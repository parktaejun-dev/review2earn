// src/app/api/scripttags/install/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mall_id } = body;

    console.log('📥 ScriptTag 설치 요청:', { mall_id });

    if (!mall_id) {
      return NextResponse.json(
        { success: false, message: 'mall_id가 필요합니다' },
        { status: 400 }
      );
    }

    // ✅ DB에서 토큰 가져오기
    const mallSettings = await prisma.mallSettings.findUnique({
      where: { mallId: mall_id },
    });

    if (!mallSettings || !mallSettings.accessToken) {
      console.error('❌ DB에 토큰 없음:', mall_id);
      return NextResponse.json(
        { success: false, message: '카페24 OAuth 인증을 먼저 완료해주세요' },
        { status: 401 }
      );
    }

    const accessToken = mallSettings.accessToken;

    console.log('✅ DB에서 토큰 가져옴:', { mall_id, token: accessToken.slice(0, 10) + '...' });

    // ScriptTag 생성
    const scriptTag = {
      src: `${process.env.NEXTAUTH_URL}/review2earn-script.js`,
      display_location: ['ORDER_BASKET', 'PRODUCT_DETAIL'],
      exclude_path: [],
      skin_no: [1],
    };

    const response = await fetch(
      `https://${mall_id}.cafe24api.com/api/v2/admin/scripttags`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Cafe24-Api-Version': '2024-03-01',
        },
        body: JSON.stringify({ request: scriptTag }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ ScriptTag 생성 실패:', data);
      return NextResponse.json(
        { success: false, message: 'ScriptTag 생성 실패', details: data },
        { status: response.status }
      );
    }

    console.log('✅ ScriptTag 생성 성공:', data);

    return NextResponse.json({
      success: true,
      message: 'ScriptTag 설치 완료!',
      data: data.scripttag,
    });

  } catch (error) {
    console.error('❌ ScriptTag 설치 에러:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'ScriptTag 설치 중 에러 발생',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
