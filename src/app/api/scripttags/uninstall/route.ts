// src/app/api/scripttags/uninstall/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface ScriptTag {
  script_no: number;
  src: string;
  display_location: string[];
}

interface ListResponse {
  scripttags: ScriptTag[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mallId, accessToken } = body;

    if (!mallId || !accessToken) {
      return NextResponse.json({
        success: false,
        error: 'mallId와 accessToken이 필요합니다.'
      }, { status: 400 });
    }

    console.log('🗑️ ScriptTag 제거 시작:', mallId);

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
      return NextResponse.json({
        success: false,
        error: 'ScriptTag 목록 조회 실패',
        details: errorData
      }, { status: listResponse.status });
    }

    const listData = await listResponse.json() as ListResponse;
    
    // ✅ any 제거: tag 타입 명시
    const review2earnTags = listData.scripttags?.filter((tag: ScriptTag) => 
      tag.src?.includes('review2earn') || 
      tag.display_location?.includes('REVIEW_WRITE') ||
      tag.src?.includes('review-button')
    );

    if (!review2earnTags || review2earnTags.length === 0) {
      return NextResponse.json({
        success: true,
        message: '제거할 ScriptTag가 없습니다.',
        removedCount: 0
      });
    }

    console.log(`📋 발견된 ScriptTag: ${review2earnTags.length}개`);

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
          deleteResults.push({ script_no: tag.script_no, success: true });
          console.log(`✅ ScriptTag 제거 성공: ${tag.script_no}`);
        } else {
          const errorData = await deleteResponse.json();
          deleteResults.push({ script_no: tag.script_no, success: false, error: errorData });
          console.error(`❌ ScriptTag 제거 실패: ${tag.script_no}`, errorData);
        }
      } catch (error) {
        console.error(`❌ ScriptTag 제거 중 오류: ${tag.script_no}`, error);
        deleteResults.push({ 
          script_no: tag.script_no, 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    const successCount = deleteResults.filter(r => r.success).length;

    return NextResponse.json({
      success: successCount > 0,
      message: `${successCount}개의 ScriptTag를 제거했습니다.`,
      removedCount: successCount,
      totalFound: review2earnTags.length,
      details: deleteResults
    });

  } catch (error) {
    console.error('❌ ScriptTag uninstall error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
