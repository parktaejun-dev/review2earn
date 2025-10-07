import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Authorization 헤더에서 토큰 읽기
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '').trim();
    
    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Access Token이 설정되지 않았습니다.',
        message: 'OAuth 인증이 필요합니다.',
        redirectUrl: '/api/oauth/authorize?mall_id=dhdshop'
      }, { status: 401 });
    }

    // Mall ID 가져오기
    const mallId = request.headers.get('X-Mall-Id') || 'dhdshop';

    // 카페24 API 호출
    const apiUrl = `https://${mallId}.cafe24api.com/api/v2/admin/products`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({
        success: false,
        error: 'API 호출 실패',
        details: errorData
      }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: '✅ Cafe24 API 연동 성공!',
      mall_id: mallId,
      api_version: '2025-09-01',
      products_count: data.products?.length || 0,
      token_status: 'Active',
      oauth_status: 'Complete'
    });

  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
