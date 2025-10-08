// src/app/api/scripttags/install/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mallId } = body;

    if (!mallId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mall ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    // DB에서 토큰 조회
    const mallSettings = await prisma.mallSettings.findUnique({
      where: { mallId },
    });

    if (!mallSettings || !mallSettings.accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'OAuth 인증이 필요합니다. 먼저 카페24 연결을 완료하세요.'
        },
        { status: 401 }
      );
    }

    const accessToken = mallSettings.accessToken;

    // 1. 기존 ScriptTag 확인
    const checkResponse = await fetch(
      `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!checkResponse.ok) {
      const errorData = await checkResponse.json();
      return NextResponse.json(
        {
          success: false,
          error: 'ScriptTags 조회 실패',
          details: errorData
        },
        { status: checkResponse.status }
      );
    }

    const existingTags = await checkResponse.json();
    const scriptUrl = 'https://review2earn.vercel.app/scripts/review-consent.js';

    // 이미 설치된 스크립트 확인
    const alreadyInstalled = existingTags.scripttags?.some(
      (tag: { src: string }) => tag.src === scriptUrl
    );

    if (alreadyInstalled) {
      return NextResponse.json({
        success: true,
        message: '✅ 이미 설치되어 있습니다!',
        scriptLocation: scriptUrl,
      });
    }

    // 2. ScriptTag 설치
    const installResponse = await fetch(
      `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request: {
            src: scriptUrl,
            display_location: ['PRODUCT_DETAIL', 'BOARD_WRITE'],
            exclude_path: [],
            integrity: null,
            skin_no: [1],
          },
        }),
      }
    );

    if (!installResponse.ok) {
      const errorData = await installResponse.json();
      return NextResponse.json(
        {
          success: false,
          error: 'ScriptTag 설치 실패',
          details: errorData
        },
        { status: installResponse.status }
      );
    }

    const result = await installResponse.json();

    return NextResponse.json({
      success: true,
      message: '✅ ScriptTag 설치 성공!',
      data: result,
      scriptLocation: scriptUrl,
      nextStep: '쇼핑몰의 리뷰 작성 페이지에서 "Review2Earn 참여 동의" 옵션을 확인하세요.',
    });

  } catch (error) {
    console.error('❌ ScriptTag Install Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
