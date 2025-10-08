// src/app/api/oauth/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { mallId } = await request.json();

    if (!mallId) {
      return NextResponse.json(
        { success: false, message: '⚠️ Mall ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // DB에서 토큰 조회
    const mallSettings = await prisma.mallSettings.findUnique({
      where: { mallId },
    });

    if (!mallSettings || !mallSettings.accessToken) {
      return NextResponse.json({
        success: false,
        message: '⚠️ OAuth 인증이 필요합니다. 먼저 카페24 연결을 완료하세요.',
        oauth_status: 'Not Connected',
        mall_id: mallId,
      });
    }

    const accessToken = mallSettings.accessToken;

    // 1. Products API 테스트
    const productsUrl = `https://${mallId}.cafe24api.com/api/v2/admin/products?limit=1`;
    const productsResponse = await fetch(productsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // 2. ScriptTags API 테스트
    const scriptTagsUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    const scriptTagsResponse = await fetch(scriptTagsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const results = {
      productsApi: {
        status: productsResponse.status,
        ok: productsResponse.ok,
        message: productsResponse.ok ? '✅ 접근 가능' : '❌ 접근 불가',
      },
      scriptTagsApi: {
        status: scriptTagsResponse.status,
        ok: scriptTagsResponse.ok,
        message: scriptTagsResponse.ok ? '✅ 접근 가능' : '❌ 접근 불가',
      },
    };

    const allSuccess = productsResponse.ok && scriptTagsResponse.ok;

    return NextResponse.json({
      success: allSuccess,
      message: allSuccess 
        ? '✅ 모든 API 권한 확인 완료!' 
        : '⚠️ 일부 API 접근 권한이 없습니다.',
      timestamp: new Date().toISOString(),
      results,
      conclusion: allSuccess
        ? '✅ ScriptTags API 사용 가능합니다!'
        : '⚠️ OAuth 재인증이 필요할 수 있습니다.',
    });

  } catch (error) {
    console.error('❌ Verify Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '❌ 서버 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
