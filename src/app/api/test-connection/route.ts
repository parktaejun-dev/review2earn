// src/app/api/test-connection/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mallId = searchParams.get('mall_id') || 'dhdshop';

    console.log('🎯 Test Connection - mall_id:', mallId);

    // ❌ 이전 (삭제된 테이블)
    // const mallSettings = await prisma.installationToken.findUnique({

    // ✅ 수정 (통합된 테이블)
    const mallSettings = await prisma.mallSettings.findUnique({
      where: {
        mallId: mallId
      }
    });

    if (!mallSettings?.accessToken) {
      return NextResponse.json({
        success: false,
        message: '⚠️ OAuth 인증이 필요합니다. 먼저 카페24 연결을 완료하세요.',
        oauth_status: 'Not Connected',
        mall_id: mallId
      });
    }

    // Cafe24 API 테스트
    const response = await fetch(
      `https://${mallId}.cafe24api.com/api/v2/admin/products?limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${mallSettings.accessToken}`,
          'Content-Type': 'application/json',
          'X-Cafe24-Api-Version': '2025-09-01'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Cafe24 API Error:', errorText);
      
      return NextResponse.json({
        success: false,
        message: '❌ Cafe24 API 연결 실패',
        token_status: 'Invalid or Expired',
        error: errorText,
        mall_id: mallId
      }, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: '✅ Cafe24 연결 성공!',
      mall_id: mallId,
      api_version: '2025-09-01',
      products_count: data.products?.length || 0,
      token_status: 'Active',
      oauth_status: 'Complete'
    });

  } catch (error) {
    console.error('❌ Test connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
