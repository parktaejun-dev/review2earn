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

    // 외부 스크립트 URL
    const scriptUrl = 'https://review2earn.vercel.app/scripts/review-button.js';

    // ScriptTag 등록
    const scriptTagsUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    
    const scriptTagData = {
      src: scriptUrl,
      display_location: [
        "BOARD_WRITE",      // ✅ 게시판 작성 페이지 (리뷰 작성)
        "BOARD_VIEW",       // ✅ 게시판 보기 (리뷰 보기)
        "PRODUCT_DETAIL"    // ✅ 상품 상세 페이지
      ],
      exclude_path: [],     // 제외할 경로 없음
      integrity: "",        // SRI 없음
      skin_no: 1           // 기본 스킨
    };

    console.log('📝 ScriptTag 데이터:', scriptTagData);

    const response = await fetch(scriptTagsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2025-09-01'
      },
      body: JSON.stringify({
        shop_no: 1,
        request: scriptTagData
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ ScriptTag 등록 실패:', responseData);
      return NextResponse.json({
        success: false,
        error: 'ScriptTag 등록 실패',
        details: responseData
      }, { status: response.status });
    }

    console.log('✅ ScriptTag 등록 성공:', responseData);

    return NextResponse.json({
      success: true,
      message: '✅ ScriptTag 등록 완료!',
      data: responseData,
      installedPages: [
        '게시판 작성 페이지 (리뷰 작성)',
        '게시판 보기 페이지 (리뷰 보기)',
        '상품 상세 페이지'
      ]
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

// GET: 설치된 ScriptTags 조회
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

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'ScriptTags 조회 실패',
        details: responseData
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ ScriptTags 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: 'ScriptTags 조회 중 오류 발생',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

// DELETE: ScriptTag 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { accessToken, mallId, scriptTagNo } = await request.json();

    if (!accessToken || !mallId || !scriptTagNo) {
      return NextResponse.json({
        success: false,
        error: 'Access Token, Mall ID, ScriptTag 번호가 필요합니다.'
      }, { status: 400 });
    }

    const scriptTagsUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags/${scriptTagNo}`;

    const response = await fetch(scriptTagsUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2025-09-01'
      }
    });

    if (!response.ok) {
      const responseData = await response.json();
      return NextResponse.json({
        success: false,
        error: 'ScriptTag 삭제 실패',
        details: responseData
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: '✅ ScriptTag 삭제 완료!'
    });

  } catch (error) {
    console.error('❌ ScriptTag 삭제 오류:', error);
    return NextResponse.json({
      success: false,
      error: 'ScriptTag 삭제 중 오류 발생',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
