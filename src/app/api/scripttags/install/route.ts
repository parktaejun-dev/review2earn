// src/app/api/scripttags/install/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getValidToken } from '@/lib/refreshToken';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

interface ScriptTag {
  src?: string;
  script_no?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mallId } = body;

    if (!mallId) {
      return NextResponse.json(
        { success: false, error: 'mallId is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    console.log(`📦 [ScriptTag Install] Starting for ${mallId}...`);

    const accessToken = await getValidToken(mallId);
    const scriptUrl = 'https://review2earn.vercel.app/scripts/review-consent.js';

    // 1. 기존 ScriptTag 확인
    const checkUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    const checkResponse = await fetch(checkUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2025-09-01',
      },
    });

    if (!checkResponse.ok) {
      const errorData = await checkResponse.json();
      console.error(`❌ [ScriptTag Install] Check failed:`, errorData);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check existing ScriptTags',
          details: errorData,
        },
        { status: checkResponse.status, headers: CORS_HEADERS }
      );
    }

    const existingTags = await checkResponse.json();

    // ✅ 기존 ScriptTag 찾기 및 삭제
    const existingTag = existingTags.scripttags?.find(
      (tag: ScriptTag) => tag.src === scriptUrl
    );

    if (existingTag && existingTag.script_no) {
      console.log(`🔄 [ScriptTag Install] Removing existing: ${existingTag.script_no}`);
      
      const deleteUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags/${existingTag.script_no}`;
      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Cafe24-Api-Version': '2025-09-01',
        },
      });
      
      if (deleteResponse.ok) {
        console.log(`✅ [ScriptTag Install] Existing tag removed`);
      }
    }

    // 2. 새 ScriptTag 설치
const installUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
const installResponse = await fetch(installUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-Cafe24-Api-Version': '2025-09-01',
  },
  body: JSON.stringify({
    request: {
      src: scriptUrl,
      display_location: [
        'MAIN',
        'PRODUCT_LIST',
        'PRODUCT_DETAIL',
        'BOARD_DETAIL',
      ],
      skin_no: [1],
    },
  }),
});

    if (!installResponse.ok) {
      const errorData = await installResponse.json();
      console.error(`❌ [ScriptTag Install] Installation failed:`, errorData);
      
      return NextResponse.json(
        {
          success: false,
          error: 'ScriptTag installation failed',
          details: errorData,
          errorCode: errorData.error?.code,
          errorMessage: errorData.error?.message,
        },
        { status: installResponse.status, headers: CORS_HEADERS }
      );
    }

    const result = await installResponse.json();
    console.log(`✅ [ScriptTag Install] Success for ${mallId}:`, result.scripttag?.script_no);

    return NextResponse.json(
      {
        success: true,
        message: 'ScriptTag installed successfully',
        data: result.scripttag,
        scriptUrl,
        scriptNo: result.scripttag?.script_no,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('❌ [ScriptTag Install] Error:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: '카페24 인증이 필요합니다',
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
