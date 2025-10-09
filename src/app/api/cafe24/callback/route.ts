// src/app/api/cafe24/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    console.error(`❌ [OAuth Callback] Error from Cafe24: ${error}`);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://review2earn.vercel.app'}/?error=oauth_denied`
    );
  }

  if (!code || !state) {
    console.error('❌ [OAuth Callback] Missing code or state');
    return NextResponse.json(
      { error: 'Missing code or state parameter' },
      { status: 400 }
    );
  }

  try {
    console.log(`🔐 [OAuth Callback] Processing for ${state} with code: ${code.substring(0, 10)}...`);

    // 1. Authorization Code를 Access Token으로 교환
    const tokenUrl = `https://${state}.cafe24api.com/api/v2/oauth/token`;
    
    // ✅ Basic Auth 인코딩
    const credentials = Buffer.from(
      `${process.env.CAFE24_CLIENT_ID}:${process.env.CAFE24_CLIENT_SECRET}`
    ).toString('base64');
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`, // ✅ Authorization 헤더 추가!
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.CAFE24_REDIRECT_URI!,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`❌ [OAuth Callback] Token exchange failed:`, errorText);
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokens = await tokenResponse.json();
    console.log(`✅ [OAuth Callback] Token received for ${state}`);

    // 2. DB에 토큰 저장
    await prisma.mallSettings.upsert({
      where: { mallId: state },
      create: {
        mallId: state,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: tokens.expires_at
          ? new Date(tokens.expires_at)
          : new Date(Date.now() + 3600 * 1000),
        scopes: tokens.scope || 'mall.read_product,mall.write_design,mall.read_store,mall.read_order,mall.write_community',
        reviewerRewardRate: 0.01,
        buyerDiscountRate: 0.05,
        platformFeeRate: 0.005,
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
    });

    console.log(`✅ [OAuth Callback] Tokens saved to DB for ${state}`);

    // 3. 성공 리다이렉트
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://review2earn.vercel.app'}/?success=true&mall_id=${state}`
    );
  } catch (error) {
    console.error('❌ [OAuth Callback] Error:', error);
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://review2earn.vercel.app'}/?error=oauth_failed`
    );
  }
}
