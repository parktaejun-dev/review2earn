// src/app/api/cafe24/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * OAuth 콜백 엔드포인트
 * 카페24에서 인증 후 돌아오는 곳
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // mallId
  const error = searchParams.get('error');

  // 에러 체크
  if (error) {
    console.error(`❌ [OAuth Callback] Error from Cafe24: ${error}`);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://review2earn.vercel.app'}/?error=oauth_denied` // 수정
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
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.CAFE24_CLIENT_ID!,
        client_secret: process.env.CAFE24_CLIENT_SECRET!,
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

    // 2. DB에 토큰 저장 (upsert)
    await prisma.mallSettings.upsert({
      where: { mallId: state },
      create: {
        mallId: state,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: tokens.expires_at
          ? new Date(tokens.expires_at)
          : new Date(Date.now() + 3600 * 1000), // 기본 1시간
        scopes: tokens.scope || 'read_product,write_scripttags,read_store',
        reviewerRewardRate: 0.01,  // 기본 1%
        buyerDiscountRate: 0.05,   // 기본 5%
        platformFeeRate: 0.005,    // 기본 0.5%
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

    // 3. 홈페이지로 리다이렉트 (성공)
    const successUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://review2earn.vercel.app'}/?success=true&mall_id=${state}`; // 수정
    
    console.log(`🎉 [OAuth Callback] Success! Redirecting to: ${successUrl}`);

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('❌ [OAuth Callback] Error:', error);
    
    // 홈페이지로 리다이렉트 (에러)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://review2earn.vercel.app'}/?error=oauth_failed` // 수정
    );
  }
}
