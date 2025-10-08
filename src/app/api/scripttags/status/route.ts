// src/app/api/scripttags/status/route.ts (개선)
import { NextRequest, NextResponse } from 'next/server';
import { Cafe24ScriptTags } from '@/lib/cafe24-scripttags';
import { prisma } from '@/lib/prisma';

interface ScriptTag {
  src?: string;
  script_no?: number;
  display_location?: string[];
}

interface ScriptTagsResponse {
  scripttags?: ScriptTag[];
}

export async function GET(request: NextRequest) {
  try {
    // 1. 쿠키에서 인증 정보 확인 (우선순위 1)
    let accessToken = request.cookies.get('cafe24_access_token')?.value;
    let mallId = request.cookies.get('cafe24_mall_id')?.value;

    // 2. 쿼리 파라미터로도 확인 (API 호출용)
    const { searchParams } = new URL(request.url);
    const queryMallId = searchParams.get('mall_id');

    // 3. 쿼리 파라미터가 있으면 DB에서 토큰 조회
    if (queryMallId && !accessToken) {
      const mallSettings = await prisma.mallSettings.findUnique({
        where: { mallId: queryMallId },
      });

      if (mallSettings?.accessToken) {
        accessToken = mallSettings.accessToken;
        mallId = queryMallId;
      }
    }

    // 4. 인증 정보 없으면 401
    if (!accessToken || !mallId) {
      return NextResponse.json({
        success: false,
        message: '카페24 인증이 필요합니다',
        needsAuth: true,
        installed: false,
      }, { status: 401 });
    }

    // 5. ScriptTags 조회
    const scriptTags = new Cafe24ScriptTags();
    const existingScripts: ScriptTagsResponse = await scriptTags.getScriptTags(
      mallId, 
      accessToken
    );

    // 6. 스크립트 파일명 업데이트 (review-button.js → review-consent.js)
    const targetScript = 'review-consent.js';
    const reviewScript = existingScripts.scripttags?.find(
      (script) => script.src?.includes(targetScript)
    );

    const installed = !!reviewScript;

    return NextResponse.json({
      success: true,
      installed,
      message: installed 
        ? '✅ Review2Earn 스크립트가 설치되어 있습니다'
        : '⚠️ Review2Earn 스크립트가 설치되어 있지 않습니다',
      script: reviewScript || null,
      totalScripts: existingScripts.scripttags?.length || 0,
      needsInstall: !installed,
      mallId,
    });

  } catch (error) {
    console.error('❌ ScriptTags status check error:', error);
    
    return NextResponse.json({
      success: false,
      message: '스크립트 상태 확인 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : 'Unknown error',
      installed: false,
    }, { status: 500 });
  }
}
