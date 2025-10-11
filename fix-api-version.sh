#!/bin/bash

echo "🔧 Fixing remaining API version hardcoding..."

# 1️⃣ src/app/api/test-connection/route.ts
cat > src/app/api/test-connection/route.ts.tmp << 'APIEOF'
import { CAFE24_CONFIG } from '@/lib/cafe24-config';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mallId = searchParams.get('mall_id');

    if (!mallId) {
      return NextResponse.json(
        {
          success: false,
          error: 'mall_id parameter is required',
          usage: 'GET /api/test-connection?mall_id=YOUR_MALL_ID'
        },
        { status: 400 }
      );
    }

    console.log('🎯 Test Connection - mall_id:', mallId);

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
        mall_id: mallId,
        next_step: `Visit: ${process.env.NEXT_PUBLIC_APP_URL}/oauth/install?mall_id=${mallId}`
      });
    }

    const apiUrl = `https://${mallId}.cafe24api.com/api/v2/admin/products?limit=1`;
    
    console.log('🔗 Testing Cafe24 API:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${mallSettings.accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': CAFE24_CONFIG.API_VERSION
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Cafe24 API Error:', errorText);
      
      return NextResponse.json({
        success: false,
        message: '❌ Cafe24 API 연결 실패',
        token_status: 'Invalid or Expired',
        error: errorText,
        mall_id: mallId,
        http_status: response.status,
        next_step: 'Please re-authenticate with Cafe24'
      }, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: '✅ Cafe24 연결 성공!',
      mall_id: mallId,
      api_version: CAFE24_CONFIG.API_VERSION,
      products_count: data.products?.length || 0,
      token_status: 'Active',
      oauth_status: 'Complete',
      token_expires_at: mallSettings.tokenExpiresAt,
      timestamp: new Date().toISOString()
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
APIEOF

mv src/app/api/test-connection/route.ts.tmp src/app/api/test-connection/route.ts

echo "✅ API Version hardcoding removed from all files"
echo ""
echo "🔍 Run check again:"
echo "   ./check-production-hardcoding.sh"
