// src/app/api/test-connection/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // URL에서 mall_id 가져오기
    const url = new URL(request.url);
    const mallId = url.searchParams.get('mall_id') || 'dhdshop';
    
    console.log('🎯 Test Connection - mall_id:', mallId);

    // 데이터베이스에서 토큰 조회
    const mallSettings = await prisma.installationToken.findUnique({
      where: {
        mall_id: mallId
      }
    });

    if (!mallSettings || !mallSettings.access_token) {
      console.log('❌ No token found for mall_id:', mallId);
      return NextResponse.json({
        success: false,
        error: 'Access Token이 설정되지 않았습니다.',
        message: 'OAuth 인증이 필요합니다.',
        redirectUrl: `/api/oauth/authorize?mall_id=${mallId}`
      }, { status: 401 });
    }

    console.log('✅ Token found:', {
      mall_id: mallSettings.mall_id,
      token: mallSettings.access_token.substring(0, 20) + '...',
      expires_at: mallSettings.token_expires_at
    });

    // 토큰 만료 확인
    if (mallSettings.token_expires_at && new Date(mallSettings.token_expires_at) < new Date()) {
      console.log('⚠️ Token expired for mall_id:', mallId);
      return NextResponse.json({
        success: false,
        error: 'Access Token이 만료되었습니다.',
        message: 'OAuth 재인증이 필요합니다.',
        redirectUrl: `/api/oauth/authorize?mall_id=${mallId}`
      }, { status: 401 });
    }

    // 카페24 API 호출 (Shop 정보 조회)
    const apiUrl = `https://${mallId}.cafe24api.com/api/v2/admin/shop`;
    
    console.log('🎯 Calling Cafe24 API:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${mallSettings.access_token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('🎯 Cafe24 API Response Status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Cafe24 API Error:', errorData);
      
      return NextResponse.json({
        success: false,
        error: 'API 호출 실패',
        details: errorData
      }, { status: response.status });
    }

    const data = await response.json();

    console.log('✅ Cafe24 API Success:', {
      shop_name: data.shop?.shop_name,
      shop_no: data.shop?.shop_no
    });

    return NextResponse.json({
      success: true,
      message: '✅ Cafe24 API 연동 성공!',
      mall_id: mallId,
      shop_info: {
        shop_name: data.shop?.shop_name,
        shop_no: data.shop?.shop_no,
        domain: data.shop?.primary_domain
      },
      token_status: 'Active',
      oauth_status: 'Complete',
      expires_at: mallSettings.token_expires_at
    });

  } catch (error) {
    console.error('❌ Test connection error:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      details: (error as Error).message
    }, { status: 500 });
  }
}
