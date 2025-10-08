// src/app/api/scripttags/install/route.ts (최종 개선)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mallId } = body;

    if (!mallId) {
      return NextResponse.json(
        { success: false, error: 'Mall ID가 필요합니다.' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    // DB에서 토큰 조회
    const mallSettings = await prisma.mallSettings.findUnique({
      where: { mallId },
    });

    if (!mallSettings || !mallSettings.accessToken) {
      return NextResponse.json(
        { success: false, error: 'OAuth 인증이 필요합니다.' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    const accessToken = mallSettings.accessToken;
    const scriptUrl = 'https://review2earn.vercel.app/scripts/review-consent.js';

    // ⭐ 개선 1: API 버전 헤더 추가
    const cafe24Headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Cafe24-Api-Version': '2024-03-01', // ⭐ API 버전 고정
    };

    // 1. 기존 ScriptTag 확인
    const checkResponse = await fetch(
      `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`,
      { headers: cafe24Headers }
    );

    if (!checkResponse.ok) {
      const errorData = await checkResponse.json();
      console.error('❌ ScriptTags 조회 실패:', errorData);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'ScriptTags 조회 실패', 
          details: errorData,
          // ⭐ 개선 2: 상세 에러 정보
          errorCode: errorData.error?.code,
          errorMessage: errorData.error?.message,
        },
        { 
          status: checkResponse.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    const existingTags = await checkResponse.json();

    // 이미 설치된 스크립트 확인
    const alreadyInstalled = existingTags.scripttags?.some(
      (tag: { src: string }) => tag.src === scriptUrl
    );

    if (alreadyInstalled) {
      return NextResponse.json(
        {
          success: true,
          message: '✅ 이미 설치되어 있습니다!',
          scriptLocation: scriptUrl,
          alreadyInstalled: true, // ⭐ 플래그 추가
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    // 2. ScriptTag 설치
    const installResponse = await fetch(
      `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`,
      {
        method: 'POST',
        headers: cafe24Headers,
        body: JSON.stringify({
          request: {
            src: scriptUrl,
            display_location: ['ALL'], // 모든 페이지
            exclude_path: [],
            integrity: null,
            skin_no: [1],
          },
        }),
      }
    );

    if (!installResponse.ok) {
      const errorData = await installResponse.json();
      console.error('❌ ScriptTag 설치 실패:', errorData);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'ScriptTag 설치 실패', 
          details: errorData,
          // ⭐ 개선 2: 상세 에러 정보
          errorCode: errorData.error?.code,
          errorMessage: errorData.error?.message,
        },
        { 
          status: installResponse.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    const result = await installResponse.json();

    return NextResponse.json(
      {
        success: true,
        message: '✅ ScriptTag 설치 성공!',
        data: result,
        scriptLocation: scriptUrl,
        scriptNo: result.scripttag?.script_no, // ⭐ Script ID 반환
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );

  } catch (error) {
    console.error('❌ ScriptTag Install Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: '서버 오류',
        // ⭐ 개선 2: 에러 메시지 포함
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

// OPTIONS 핸들러 (CORS Preflight)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
