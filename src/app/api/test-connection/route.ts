// src/app/api/test-connection/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const mallId = url.searchParams.get('mall_id') || 'dhdshop';
    
    console.log('🎯 Test Connection - mall_id:', mallId);

    const mallSettings = await prisma.installationToken.findUnique({
      where: {
        mallId: mallId
      }
    });

    if (!mallSettings || !mallSettings.accessToken) {
      return NextResponse.json({
        success: false,
        error: 'OAuth 인증이 필요합니다',
        needsAuth: true
      }, { status: 401 });
    }

    const apiUrl = `https://${mallId}.cafe24api.com/api/v2/admin/products?limit=1`;
    
    const cafe24Response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mallSettings.accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2024-03-01'
      }
    });

    const responseData = await cafe24Response.json();

    if (!cafe24Response.ok) {
      return NextResponse.json({
        success: false,
        error: 'API 호출 실패',
        details: responseData
      }, { status: cafe24Response.status });
    }

    return NextResponse.json({
      success: true,
      message: '카페24 API 연결 성공!',
      data: {
        mallId,
        productCount: responseData.products?.length || 0,
        hasToken: true
      }
    });

  } catch (error) {
    console.error('❌ Test Connection Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
