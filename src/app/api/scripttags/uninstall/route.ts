// src/app/api/scripttags/uninstall/route.ts (최종 개선)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ScriptTag {
  script_no: number;
  src: string;
  display_location?: string[];
}

interface ListResponse {
  scripttags: ScriptTag[];
}

// ⭐ CORS 헤더 상수
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mallId } = body;

    // ⭐ 개선 1: mallId만 필요 (accessToken은 DB에서 조회)
    if (!mallId) {
      return NextResponse.json(
        {
          success: false,
          error: 'mallId가 필요합니다.'
        },
        { 
          status: 400,
          headers: CORS_HEADERS
        }
      );
    }

    console.log('🗑️ ScriptTag 제거 시작:', mallId);

    // ⭐ 개선 2: Prisma로 accessToken 조회
    const mallSettings = await prisma.mallSettings.findUnique({
      where: { mallId },
    });

    if (!mallSettings || !mallSettings.accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'OAuth 인증이 필요합니다.'
        },
        { 
          status: 401,
          headers: CORS_HEADERS
        }
      );
    }

    const accessToken = mallSettings.accessToken;

    // ScriptTag 목록 조회
    const listUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    const listResponse = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2024-03-01'
      }
    });

    if (!listResponse.ok) {
      const errorData = await listResponse.json();
      return NextResponse.json(
        {
          success: false,
          error: 'ScriptTag 목록 조회 실패',
          details: errorData
        },
        { 
          status: listResponse.status,
          headers: CORS_HEADERS
        }
      );
    }

    const listData = await listResponse.json() as ListResponse;
    
    // ⭐ 개선 3: 필터 조건 업데이트 (review-consent.js 기준)
    const review2earnTags = listData.scripttags?.filter((tag: ScriptTag) => 
      tag.src?.includes('review2earn.vercel.app') || 
      tag.src?.includes('review-consent.js') ||
      tag.src?.includes('review-button.js') // 레거시 지원
    );

    if (!review2earnTags || review2earnTags.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'ℹ️ 제거할 ScriptTag가 없습니다.',
          removedCount: 0,
          totalFound: 0,
        },
        { headers: CORS_HEADERS }
      );
    }

    console.log(`📋 발견된 ScriptTag: ${review2earnTags.length}개`);

    // 삭제 실행
    const deleteResults = [];
    for (const tag of review2earnTags) {
      try {
        const deleteUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags/${tag.script_no}`;
        const deleteResponse = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Cafe24-Api-Version': '2024-03-01'
          }
        });

        if (deleteResponse.ok) {
          deleteResults.push({ 
            script_no: tag.script_no, 
            src: tag.src,
            success: true 
          });
          console.log(`✅ ScriptTag 제거 성공: ${tag.script_no} (${tag.src})`);
        } else {
          const errorData = await deleteResponse.json();
          deleteResults.push({ 
            script_no: tag.script_no, 
            src: tag.src,
            success: false, 
            error: errorData 
          });
          console.error(`❌ ScriptTag 제거 실패: ${tag.script_no}`, errorData);
        }
      } catch (error) {
        console.error(`❌ ScriptTag 제거 중 오류: ${tag.script_no}`, error);
        deleteResults.push({ 
          script_no: tag.script_no, 
          src: tag.src,
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    const successCount = deleteResults.filter(r => r.success).length;

    return NextResponse.json(
      {
        success: successCount > 0,
        message: `✅ ${successCount}개의 ScriptTag를 제거했습니다.`,
        removedCount: successCount,
        totalFound: review2earnTags.length,
        failedCount: review2earnTags.length - successCount,
        details: deleteResults
      },
      { headers: CORS_HEADERS }
    );

  } catch (error) {
    console.error('❌ ScriptTag uninstall error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: CORS_HEADERS
      }
    );
  }
}

// ⭐ 개선 4: OPTIONS 핸들러 추가
export async function OPTIONS() {
  // request 파라미터 제거
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
