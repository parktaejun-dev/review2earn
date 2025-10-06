// src/app/api/scripttags/route.ts - 올바른 Review2Earn 버전
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mallId, accessToken } = body;
    
    if (!mallId || !accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Mall ID와 Access Token이 필요합니다.'
      }, { status: 400 });
    }

    console.log(`🚀 Review2Earn ScriptTags API 호출 시작 - Mall: ${mallId}`);

    // 카페24 ScriptTags API 호출 - 리뷰 목록 페이지에 삽입
    const apiUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    
    const scriptTagData = {
      "shop_no": 1,
      "request": {
        "src": "https://cdn.jsdelivr.net/gh/parktaejun-dev/review2earn-cafe24-app@main/public/review-earn-button.js",
        "display_location": "PRODUCT_DETAIL", // 상품 상세 페이지의 리뷰 영역
        "skin_no": 101
      }
    };

    console.log('📤 Review2Earn ScriptTag 등록 데이터:', JSON.stringify(scriptTagData, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2025-09-01'
      },
      body: JSON.stringify(scriptTagData)
    });

    const responseData = await response.json();
    console.log('📥 카페24 응답:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: '✅ Review2Earn ScriptTag가 성공적으로 등록되었습니다!',
        data: responseData,
        scriptLocation: 'PRODUCT_DETAIL - 상품 상세 페이지 리뷰 영역',
        nextStep: '이제 dhdshop.cafe24.com의 상품 페이지에서 리뷰 영역을 확인해보세요!',
        buttonFunction: '각 리뷰 옆에 "👍 도움됨+1%할인" 버튼이 나타납니다'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'ScriptTag 등록 실패',
        details: responseData
      }, { status: response.status });
    }

  } catch (error) {
    console.error('❌ ScriptTags API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

// GET 요청으로 등록된 스크립트태그 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mallId = searchParams.get('mallId');
    const accessToken = searchParams.get('accessToken');

    if (!mallId || !accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Mall ID와 Access Token이 필요합니다.'
      }, { status: 400 });
    }

    const apiUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2025-09-01'
      }
    });

    const responseData = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: '등록된 Review2Earn ScriptTag 목록을 가져왔습니다.',
        data: responseData
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'ScriptTag 조회 실패',
        details: responseData
      }, { status: response.status });
    }

  } catch (error) {
    console.error('❌ ScriptTags GET 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
