// src/app/api/test-connection/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔗 카페24 연결 테스트 시작');
    
    // OAuth 토큰 확인 (실제 구현에서는 데이터베이스에서 가져옴)
    const accessToken = process.env.CAFE24_ACCESS_TOKEN || '';
    const mallId = 'dhdshop';
    
    if (!accessToken) {
      console.log('❌ Access Token이 없습니다');
      return NextResponse.json({
        success: false,
        error: 'Access Token이 설정되지 않았습니다.',
        message: 'OAuth 인증이 필요합니다.',
        redirectUrl: `/api/oauth/authorize?mall_id=${mallId}`
      });
    }

    // 카페24 API로 상품 정보 조회 테스트
    const apiUrl = `https://${mallId}.cafe24api.com/api/v2/admin/products?shop_no=1&limit=5`;
    
    console.log('📤 API 요청:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2025-09-01'
      }
    });

    const responseData = await response.json();
    console.log('📥 카페24 응답:', response.status);

    if (response.ok && responseData.products) {
      return NextResponse.json({
        success: true,
        message: '✅ Cafe24 OAuth 연동이 완전히 성공했습니다!',
        mall_id: mallId,
        api_version: '2025-09-01',
        products_count: responseData.products.length,
        token_status: 'Active',
        oauth_status: 'Complete',
        accessToken: accessToken // ScriptTag 설치용
      });
    } else {
      console.log('❌ API 호출 실패:', responseData);
      return NextResponse.json({
        success: false,
        error: 'API 호출 실패',
        details: responseData,
        message: 'OAuth 토큰이 만료되었거나 권한이 없습니다.'
      }, { status: response.status });
    }

  } catch (error) {
    console.error('❌ 연결 테스트 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

// POST 요청도 처리 (호환성을 위해)
export async function POST(request: NextRequest) {
  return GET(request);
}
