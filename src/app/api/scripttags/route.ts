// src/app/api/scripttags/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, mallId } = await request.json();

    if (!accessToken || !mallId) {
      return NextResponse.json({
        success: false,
        error: 'Access Token과 Mall ID가 필요합니다.'
      }, { status: 400 });
    }

    // 외부 스크립트 URL (Vercel 또는 다른 CDN)
    const scriptUrl = 'https://review2earn.vercel.app/scripts/review-button.js';

    // ScriptTag 등록
    const scriptTagsUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    
    const scriptTagData = {
  src: 'https://review2earn.vercel.app/scripts/review-button.js',  // ✅ 경로 확인
  display_location: ["ALL"],  // ✅ 전체 페이지
  exclude_path: [],
  integrity: "",
  skin_no: 1
};

    const response = await fetch(scriptTagsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2025-09-01'
      },
      body: JSON.stringify({
        request: {
          script_tag: scriptTagData
        }
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('ScriptTag 등록 실패:', responseData);
      return NextResponse.json({
        success: false,
        error: 'ScriptTag 등록 실패',
        details: responseData
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: 'ScriptTag 등록 완료!',
      data: responseData
    });

  } catch (error) {
    console.error('ScriptTag 등록 오류:', error);
    return NextResponse.json({
      success: false,
      error: 'ScriptTag 등록 중 오류 발생',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
