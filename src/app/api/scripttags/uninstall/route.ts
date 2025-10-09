// src/app/api/scripttags/uninstall/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getValidToken } from '@/lib/refreshToken';

interface ScriptTag {
  script_no: number;
  src: string;
  display_location?: string[];
}

interface ListResponse {
  scripttags: ScriptTag[];
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mallId } = body;

    if (!mallId) {
      return NextResponse.json(
        {
          success: false,
          error: 'mallId is required',
        },
        { 
          status: 400,
          headers: CORS_HEADERS
        }
      );
    }

    console.log(`🗑️ [ScriptTag Uninstall] Starting for ${mallId}...`);

    // ⭐ 자동 토큰 갱신 (개선!)
    const accessToken = await getValidToken(mallId);

    // ScriptTag 목록 조회
    const listUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    const listResponse = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2025-09-01',
      },
    });

    if (!listResponse.ok) {
      const errorData = await listResponse.json();
      console.error(`❌ [ScriptTag Uninstall] List failed:`, errorData);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to list ScriptTags',
          details: errorData,
        },
        { 
          status: listResponse.status,
          headers: CORS_HEADERS
        }
      );
    }

    const listData = await listResponse.json() as ListResponse;
    
    // Review2Earn 스크립트 필터 (3가지 조건)
    const review2earnTags = listData.scripttags?.filter((tag: ScriptTag) => 
      tag.src?.includes('review2earn.vercel.app') || 
      tag.src?.includes('review-consent.js') ||
      tag.src?.includes('review-button.js') // 레거시 지원
    );

    if (!review2earnTags || review2earnTags.length === 0) {
      console.log(`ℹ️ [ScriptTag Uninstall] No scripts found for ${mallId}`);
      
      return NextResponse.json(
        {
          success: true,
          message: 'No Review2Earn scripts to uninstall',
          removedCount: 0,
          totalFound: 0,
        },
        { headers: CORS_HEADERS }
      );
    }

    console.log(`📋 [ScriptTag Uninstall] Found ${review2earnTags.length} script(s)`);

    // 일괄 삭제 실행
    const deleteResults = [];
    for (const tag of review2earnTags) {
      try {
        const deleteUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags/${tag.script_no}`;
        const deleteResponse = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Cafe24-Api-Version': '2025-09-01',
          },
        });

        if (deleteResponse.ok) {
          deleteResults.push({ 
            script_no: tag.script_no, 
            src: tag.src,
            success: true 
          });
          console.log(`✅ [ScriptTag Uninstall] Removed: ${tag.script_no} (${tag.src})`);
        } else {
          const errorData = await deleteResponse.json();
          deleteResults.push({ 
            script_no: tag.script_no, 
            src: tag.src,
            success: false, 
            error: errorData 
          });
          console.error(`❌ [ScriptTag Uninstall] Failed: ${tag.script_no}`, errorData);
        }
      } catch (error) {
        console.error(`❌ [ScriptTag Uninstall] Error: ${tag.script_no}`, error);
        deleteResults.push({ 
          script_no: tag.script_no, 
          src: tag.src,
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    const successCount = deleteResults.filter(r => r.success).length;

    console.log(`✅ [ScriptTag Uninstall] Completed: ${successCount}/${review2earnTags.length} removed`);

    return NextResponse.json(
      {
        success: successCount > 0,
        message: `${successCount} ScriptTag(s) uninstalled successfully`,
        removedCount: successCount,
        totalFound: review2earnTags.length,
        failedCount: review2earnTags.length - successCount,
        details: deleteResults,
      },
      { headers: CORS_HEADERS }
    );

  } catch (error) {
    console.error('❌ [ScriptTag Uninstall] Error:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: '카페24 인증이 필요합니다',
          needsAuth: true,
        },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { 
        status: 500,
        headers: CORS_HEADERS
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
