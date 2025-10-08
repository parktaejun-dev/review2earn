// src/app/api/oauth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const mallId = searchParams.get('mall_id') || 'dhdshop';

    console.log('🔐 OAuth Callback received:', { code, state, mallId });

    if (!code) {
      console.error('❌ No authorization code received');
      return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }

    const clientId = process.env.NEXT_PUBLIC_CAFE24_CLIENT_ID!;
    const clientSecret = process.env.CAFE24_CLIENT_SECRET!;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/oauth/callback`;

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenResponse = await fetch(
      `https://${mallId}.cafe24api.com/api/v2/oauth/token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token request failed:', errorText);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to obtain access token',
          details: errorText
        },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token obtained:', tokenData);

    // ✅ expires_in 처리 수정
    const expiresInSeconds = tokenData.expires_in || tokenData.expires_at || 7200; // 기본 2시간
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    console.log('📅 Token expiry:', {
      expiresInSeconds,
      expiresAt: expiresAt.toISOString(),
      isValid: !isNaN(expiresAt.getTime())
    });

    // ✅ 유효성 검증 추가
    if (isNaN(expiresAt.getTime())) {
      console.error('❌ Invalid expiry date');
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid token expiry date',
          details: `expires_in: ${expiresInSeconds}`
        },
        { status: 500 }
      );
    }

    // MallSettings에 저장
    await prisma.mallSettings.upsert({
      where: { mallId },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: expiresAt,
      },
      create: {
        mallId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: expiresAt,
      },
    });

    console.log('✅ Token saved to database');

    // 프론트엔드로 리다이렉트
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('access_token', tokenData.access_token);
    redirectUrl.searchParams.set('refresh_token', tokenData.refresh_token || '');
    redirectUrl.searchParams.set('mall_id', mallId);
    redirectUrl.searchParams.set('expires_in', expiresInSeconds.toString());

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'OAuth callback failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
