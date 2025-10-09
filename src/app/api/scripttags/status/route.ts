// src/app/api/scripttags/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getValidToken } from '@/lib/refreshToken';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mallId = searchParams.get('mall_id');

  if (!mallId) {
    return NextResponse.json(
      { success: false, error: 'mall_id is required' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    console.log(`🔍 [ScriptTag Status] Checking ${mallId}...`);

    // ⭐ 자동 토큰 갱신
    const accessToken = await getValidToken(mallId);

    // Cafe24 API 호출
    const listUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    const response = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2025-09-01',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ [ScriptTag Status] Cafe24 API error:`, errorData);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch ScriptTags',
          details: errorData,
        },
        { status: response.status, headers: CORS_HEADERS }
      );
    }

    const data = await response.json();
    const scripttags = data.scripttags || [];

    // Review2Earn 스크립트 찾기
    interface ScriptTag {
  script_no: number;
  src?: string;
  display_location?: string[];
}

const r2eScript = scripttags.find((tag: ScriptTag) =>
  tag.src?.includes('review2earn.vercel.app') ||
  tag.src?.includes('review-consent.js')
);

    if (r2eScript) {
      console.log(`✅ [ScriptTag Status] Found R2E script for ${mallId}`);
      
      return NextResponse.json(
        {
          success: true,
          installed: true,
          script: {
            script_no: r2eScript.script_no,
            src: r2eScript.src,
            display_location: r2eScript.display_location,
          },
          totalScripts: scripttags.length,
        },
        { headers: CORS_HEADERS }
      );
    }

    console.log(`ℹ️ [ScriptTag Status] R2E script not found for ${mallId}`);

    return NextResponse.json(
      {
        success: true,
        installed: false,
        needsInstall: true,
        totalScripts: scripttags.length,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('❌ [ScriptTag Status] Error:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          message: '카페24 인증이 필요합니다',
          needsAuth: true,
        },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
