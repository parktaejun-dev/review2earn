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
    console.log('Mall ID:', mallId);
    console.log('Access Token:', accessToken.substring(0, 10) + '...');

    const scriptUrl = 'https://review2earn.vercel.app/scripts/review-button.js';
    const scriptTagsUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    
    // ✅ 핵심: COMMON (전체 페이지)에 로드, 스크립트에서 조건부 실행
    const requestBody = {
      shop_no: 1,
      request: {
        src: scriptUrl,
        display_location: "COMMON",  // ✅ 문자열로 전송!
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
    console.log('📥 카페24 응답:', responseData);

    if (!response.ok) {
      console.error('❌ ScriptTag 등록 실패:', responseData);
      return NextResponse.json({
        success: false,
        error: 'ScriptTag 등록 실패',
        details: responseData,
        requestSent: requestBody
      }, { status: response.status });
    }

    console.log('✅ ScriptTag 등록 성공!');

    return NextResponse.json({
      success: true,
      message: '✅ ScriptTag 등록 완료!',
      data: responseData,
      scriptUrl: scriptUrl,
      note: '전체 페이지에 스크립트가 로드되며, 리뷰 작성 페이지에서만 버튼이 표시됩니다.'
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

// GET: 설치된 ScriptTags 확인
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accessToken = searchParams.get('accessToken');
    const mallId = searchParams.get('mallId');

    if (!accessToken || !mallId) {
      return NextResponse.json({
        success: false,
        error: 'Access Token과 Mall ID가 필요합니다.'
      }, { status: 400 });
    }

    const scriptTagsUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags?shop_no=1`;

    const response = await fetch(scriptTagsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2025-09-01'
      }
    });

    const responseData = await response.json();

    return NextResponse.json({
      success: response.ok,
      data: responseData
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
