// src/app/api/oauth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CAFE24_CLIENT_ID = process.env.NEXT_PUBLIC_CAFE24_CLIENT_ID!;
const CAFE24_CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET!;
const NEXT_AUTH_URL = process.env.NEXTAUTH_URL || 'https://review2earn.vercel.app';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    console.log('📥 OAuth Callback received:', { code: !!code, state });

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Authorization code is missing' },
        { status: 400 }
      );
    }

    // State에서 mall_id 추출
    let mallId = 'dhdshop'; // 기본값
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        mallId = stateData.mallId || mallId;
        console.log('✅ Extracted mall_id from state:', mallId);
      } catch (error) {
        console.warn('⚠️ Failed to parse state, using default mall_id:', error);
      }
    }

    // 1. Access Token 요청
    console.log('🔑 Requesting access token for mall:', mallId);
    
    const tokenUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${NEXT_AUTH_URL}/api/oauth/callback`,
        client_id: CAFE24_CLIENT_ID,
        client_secret: CAFE24_CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token request failed:', errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to obtain access token',
          details: errorText 
        },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token obtained successfully');

    // 2. MallSettings에 저장 (upsert)
    try {
      const expiresAt = tokenData.expires_at 
        ? new Date(tokenData.expires_at * 1000)
        : new Date(Date.now() + 3600 * 1000); // 기본 1시간

      const mallSettings = await prisma.mallSettings.upsert({
        where: { mallId },
        update: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt: expiresAt,
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          mallId,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt: expiresAt,
          isActive: true,
        },
      });

      console.log('✅ MallSettings saved:', mallSettings.mallId);

      // 3. 성공 리다이렉트
      const redirectUrl = new URL('/', NEXT_AUTH_URL);
      redirectUrl.searchParams.set('auth', 'success');
      redirectUrl.searchParams.set('mall_id', mallId);

      return NextResponse.redirect(redirectUrl);

    } catch (dbError) {
      console.error('❌ Database save failed:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save mall settings',
          details: dbError instanceof Error ? dbError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
