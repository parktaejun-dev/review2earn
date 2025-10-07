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

    console.log('🚀 ScriptTag 등록 시작...');
    
    const scriptUrl = 'https://review2earn.vercel.app/scripts/review-button.js';
    const scriptTagsUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    
    // ✅ 수정: display_location을 배열 형식이 아닌 문자열로 전송
    const requestBody = {
      shop_no: 1,
      request: {
        src: scriptUrl,
        display_location: ["PRODUCTDETAIL"],  // ✅ 상품 상세 페이지만
        exclude_path: [],
        skin_no: 1
      }
    };

    console.log('📝 요청 데이터:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(scriptTagsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2025-09-01'
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();
    console.log('📥 응답 데이터:', responseData);

    if (!response.ok) {
      console.error('❌ ScriptTag 등록 실패:', responseData);
      return NextResponse.json({
        success: false,
        error: 'ScriptTag 등록 실패',
        details: responseData
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: '✅ ScriptTag 등록 완료!',
      data: responseData,
      note: '상품 상세 페이지에 스크립트가 로드됩니다. 리뷰 작성 페이지는 스크립트 내부에서 조건부 표시됩니다.'
    });

  } catch (error) {
    console.error('❌ ScriptTag 등록 오류:', error);
    return NextResponse.json({
      success: false,
      error: 'ScriptTag 등록 중 오류 발생',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
