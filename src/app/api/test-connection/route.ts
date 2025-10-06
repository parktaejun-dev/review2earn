import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🎯 API connection test started');
  
  try {
    // 쿠키에서 토큰 정보 가져오기
    const accessToken = request.cookies.get('cafe24_access_token')?.value;
    const mallId = request.cookies.get('cafe24_mall_id')?.value;
    
    console.log('🎯 Retrieved from cookies:', {
      accessToken: accessToken ? '[EXISTS]' : 'MISSING',
      mallId: mallId || 'MISSING'
    });

    if (!accessToken || !mallId) {
      return NextResponse.json({
        success: false,
        message: '카페24 연동 정보가 없습니다. 다시 로그인해주세요.',
        debug: {
          accessToken: !!accessToken,
          mallId: !!mallId
        }
      }, { status: 401 });
    }

    // Cafe24 API 테스트 (상품 정보 조회)
    const apiUrl = `https://${mallId}.cafe24api.com/api/v2/admin/products`;
    
    console.log('🎯 Testing API connection to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2025-09-01', // 🔥 업데이트된 API 버전
      },
    });

    console.log('🎯 API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      
      // 401 에러인 경우 토큰 만료로 간주
      if (response.status === 401) {
        return NextResponse.json({
          success: false,
          message: 'Access token이 만료되었습니다. 다시 로그인해주세요.',
          error: 'Token Expired',
          details: { status: response.status, error: errorText }
        }, { status: 401 });
      }

      return NextResponse.json({
        success: false,
        message: `Cafe24 API 오류가 발생했습니다: ${response.status}`,
        error: 'API Error',
        details: { status: response.status, error: errorText }
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ API Success:', {
      products_count: data.products?.length || 0
    });

    return NextResponse.json({
      success: true,
      message: '✅ Cafe24 OAuth 연동이 완전히 성공했습니다!',
      mall_id: mallId,
      api_version: '2025-09-01',
      products_count: data.products?.length || 0,
      token_status: 'Active',
      oauth_status: 'Complete',
      api_response: {
        status: response.status,
        products: data.products?.slice(0, 3) || [] // 처음 3개 상품만 반환
      }
    });

  } catch (error) {
    console.error('❌ API Test Error:', error);
    return NextResponse.json({
      success: false,
      message: 'API 테스트 중 오류가 발생했습니다.',
      error: 'Internal Error',
      details: { message: (error as Error).message }
    }, { status: 500 });
  }
}
