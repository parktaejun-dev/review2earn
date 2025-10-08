// src/app/api/oauth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CAFE24_CLIENT_ID = process.env.CAFE24_CLIENT_ID!;
const CAFE24_CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET!;
const CAFE24_REDIRECT_URI = process.env.CAFE24_REDIRECT_URI!;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    console.log('📥 OAuth Callback:', { code, state });

    if (!code || !state) {
      console.error('❌ Code 또는 State 없음');
      return NextResponse.redirect(
        new URL('/?error=missing_parameters', request.url)
      );
    }

    // state 디코딩하여 mallId 추출
    let mallId: string;
    try {
      const stateData = JSON.parse(
        Buffer.from(state, 'base64').toString('utf-8')
      );
      mallId = stateData.mallId;
      console.log('✅ State에서 mallId 추출:', mallId);
    } catch (error) {
      console.error('❌ State 디코딩 실패:', error);
      return NextResponse.redirect(
        new URL('/?error=invalid_state', request.url)
      );
    }

    if (!mallId) {
      console.error('❌ mallId가 state에 없음');
      return NextResponse.redirect(
        new URL('/?error=missing_mall_id', request.url)
      );
    }

    // ✅ Authorization Header 생성
    const authHeader = Buffer.from(
      `${CAFE24_CLIENT_ID}:${CAFE24_CLIENT_SECRET}`
    ).toString('base64');

    // Access Token 요청
    console.log('🔄 Access Token 요청 시작...');
    
    const tokenUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/token`;
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`, // ✅ 추가!
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: CAFE24_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('❌ Token 교환 실패:', tokenData);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to obtain access token',
          details: JSON.stringify(tokenData),
        },
        { status: 401 }
      );
    }

    console.log('✅ Access Token 획득 성공!');

    const {
      access_token,
      refresh_token,
      expires_at,
    } = tokenData;

    // DB에 저장
    console.log('💾 DB에 토큰 저장 중...');
    
    await prisma.mallSettings.upsert({
      where: { mallId: mallId },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(expires_at * 1000),
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        mallId: mallId,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(expires_at * 1000),
        isActive: true,
      },
    });

    console.log('✅ DB 저장 완료!');

    // 프론트엔드로 리다이렉트
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('access_token', access_token);
    redirectUrl.searchParams.set('refresh_token', refresh_token);
    redirectUrl.searchParams.set('mall_id', mallId);
    redirectUrl.searchParams.set('expires_in', expires_at.toString());

    console.log('✅ 프론트엔드로 리다이렉트');

    return NextResponse.redirect(redirectUrl);
    
  } catch (error) {
    console.error('❌ OAuth Callback 에러:', error);
    
    return NextResponse.redirect(
      new URL(`/?error=callback_failed&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url)
    );
  }
}
