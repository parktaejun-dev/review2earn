// src/app/api/webhooks/install/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CAFE24_CLIENT_ID = process.env.CAFE24_CLIENT_ID!;
const CAFE24_CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 App Install Webhook 수신:', body);

    const { mall_id, code } = body;

    if (!mall_id || !code) {
      console.error('❌ mall_id 또는 code 없음');
      return NextResponse.json(
        { success: false, error: 'Missing mall_id or code' },
        { status: 400 }
      );
    }

    console.log('🔄 Access Token 교환 시작...');

    // Access Token 교환
    const tokenUrl = `https://${mall_id}.cafe24api.com/api/v2/oauth/token`;
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/webhooks/install`,
        client_id: CAFE24_CLIENT_ID,
        client_secret: CAFE24_CLIENT_SECRET,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('❌ Token 교환 실패:', tokenData);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to obtain access token',
          details: tokenData,
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

    // ✅ DB에 저장 (tokenExpiresAt 사용)
    console.log('💾 DB에 Mall 정보 저장 중...');
    
    await prisma.mallSettings.upsert({
      where: { mallId: mall_id },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(expires_at * 1000), // ✅ 수정!
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        mallId: mall_id,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(expires_at * 1000), // ✅ 수정!
        isActive: true,
      },
    });

    console.log('✅ DB 저장 완료!');

    // 카페24에 성공 응답
    return NextResponse.json({
      success: true,
      message: 'App installed successfully',
      mall_id: mall_id,
    });

  } catch (error) {
    console.error('❌ App Install Webhook 에러:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
