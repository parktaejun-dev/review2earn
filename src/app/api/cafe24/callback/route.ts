import { CAFE24_CONFIG } from '@/lib/cafe24-config';
// src/app/api/cafe24/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // OAuth 거부 또는 에러
  if (error) {
    console.error(`❌ [OAuth Callback] Error from Cafe24: ${error}`)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://review2earn.vercel.app'}/?error=oauth_denied`
    )
  }

  // 필수 파라미터 검증
  if (!code || !state) {
    console.error('❌ [OAuth Callback] Missing code or state')
    return NextResponse.json(
      { error: 'Missing code or state parameter' },
      { status: 400 }
    )
  }

  try {
    // State 디코딩: Base64 JSON 또는 단순 mallId
    let mallId: string
    try {
      const decoded = Buffer.from(state, 'base64').toString('utf-8')
      const parsedState = JSON.parse(decoded)
      mallId = parsedState.mallId
      console.log('🔍 [OAuth Callback] Decoded state from JSON:', parsedState)
    } catch {
      // state가 단순 mallId인 경우
      mallId = state
      console.log('🔍 [OAuth Callback] Using state as mallId:', mallId)
    }

    console.log(`🔐 [OAuth Callback] Processing for ${mallId} with code: ${code.substring(0, 10)}...`)

    // ============================================
    // 1. Authorization Code를 Access Token으로 교환
    // ============================================
    const tokenUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/token`
    
    // Basic Auth 인코딩
    const credentials = Buffer.from(
      `${process.env.CAFE24_CLIENT_ID}:${process.env.CAFE24_CLIENT_SECRET}`
    ).toString('base64')
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.CAFE24_REDIRECT_URI!,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ [OAuth Callback] Token exchange failed:', errorText)
      throw new Error(`Token exchange failed: ${errorText}`)
    }

    const tokens = await tokenResponse.json()
    console.log(`✅ [OAuth Callback] Token received for ${mallId}`)

    // ============================================
    // 2. DB에 토큰 저장
    // ============================================
    await prisma.mallSettings.upsert({
      where: { mallId },
      create: {
        mallId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: tokens.expires_at
          ? new Date(tokens.expires_at)
          : new Date(Date.now() + 3600 * 1000),
        scopes: tokens.scope || 'mall.read_product,mall.write_design,mall.read_store,mall.read_order,mall.write_community',
        reviewerRewardRate: 0.02,
        buyerDiscountRate: 0.03,
        platformFeeRate: 0.01,
        prepaidBalance: 0,
        minBalanceThreshold: 50000,
        isActive: true,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: tokens.expires_at
          ? new Date(tokens.expires_at)
          : new Date(Date.now() + 3600 * 1000),
        scopes: tokens.scope,
        updatedAt: new Date(),
      },
    })

    console.log(`✅ [OAuth Callback] Tokens saved to DB for ${mallId}`)

    // ============================================
    // 3. ✅ v6.0: ScriptTag 자동 등록
    // ============================================
    const widgetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://review2earn.vercel.app'}/widget.js`

    try {
      const scriptTagResponse = await fetch(
        `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens.access_token}`,
            'X-Cafe24-Api-Version': CAFE24_CONFIG.API_VERSION,
          },
          body: JSON.stringify({
            shop_no: parseInt(process.env.DEFAULT_SHOP_NO || "1"),
            request: {
              src: widgetUrl,
              display_location: ['BOARD_WRITE'], // 리뷰 작성 페이지
              exclude_path: [],
              skin_no: [parseInt(process.env.DEFAULT_SKIN_NO || "1")],
            },
          }),
        }
      )

      if (scriptTagResponse.ok) {
        const scriptTagData = await scriptTagResponse.json()
        const scriptTagNo = scriptTagData.scripttag?.script_no

        if (scriptTagNo) {
          await prisma.mallSettings.update({
            where: { mallId },
            data: { scriptTagNo },
          })
          console.log(`✅ [OAuth Callback] ScriptTag 등록 완료: ${scriptTagNo}`)
        }
      } else {
        const errorText = await scriptTagResponse.text()
        console.error(`⚠️ [OAuth Callback] ScriptTag 등록 실패:`, errorText)
        // ScriptTag 실패해도 앱 설치는 계속 진행
      }
    } catch (scriptError: unknown) {
      const errorMessage = scriptError instanceof Error ? scriptError.message : 'Unknown error'
      console.error('⚠️ [OAuth Callback] ScriptTag 등록 에러:', errorMessage)
      // ScriptTag 실패해도 앱 설치는 계속 진행
    }

    // ============================================
    // 4. 쿠키 설정 후 리다이렉트 (무한 루프 방지)
    // ============================================
    const redirectUrl = new URL(
      process.env.NEXT_PUBLIC_APP_URL || 'https://review2earn.vercel.app'
    )
    redirectUrl.searchParams.set('success', 'true')
    redirectUrl.searchParams.set('mall_id', mallId)

    const response = NextResponse.redirect(redirectUrl.toString())
    
    // OAuth 완료 플래그 쿠키 설정 (5분간 유효)
    response.cookies.set('oauth_completed', 'true', {
      maxAge: 300, // 5분
      path: '/',
      httpOnly: false, // 클라이언트에서 읽을 수 있어야 함
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    console.log('✅ [OAuth Callback] Redirect with cookie set')

    return response

  } catch (error) {
    console.error('❌ [OAuth Callback] Error:', error)
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://review2earn.vercel.app'}/?error=oauth_failed`
    )
  }
}
