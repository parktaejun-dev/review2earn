// src/app/api/verify-token/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, mallId } = await request.json();

    if (!accessToken || !mallId) {
      return NextResponse.json({
        success: false,
        error: 'Access Token과 Mall ID가 필요합니다.'
      }, { status: 400 });
    }

    console.log('🔍 토큰 검증 시작...');
    console.log('Mall ID:', mallId);
    console.log('Access Token:', accessToken.substring(0, 10) + '...');

    // 1. Products API 테스트 (기본 권한)
    const productsUrl = `https://${mallId}.cafe24api.com/api/v2/admin/products?limit=1`;
    const productsResponse = await fetch(productsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2025-09-01'
      }
    });

    const productsStatus = productsResponse.status;
    const productsOk = productsResponse.ok;
    const productsData = productsOk ? await productsResponse.json() : await productsResponse.text();

    console.log('📦 Products API:', productsStatus, productsOk ? '✅' : '❌');

    // 2. ScriptTags API 테스트 (GET)
    const scriptTagsUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    const scriptGetResponse = await fetch(scriptTagsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2025-09-01'
      }
    });

    const scriptGetStatus = scriptGetResponse.status;
    const scriptGetOk = scriptGetResponse.ok;
    const scriptGetData = await scriptGetResponse.text();

    console.log('📜 ScriptTags GET:', scriptGetStatus, scriptGetOk ? '✅' : '❌');

    // 3. 결과 반환
    return NextResponse.json({
      success: true,
      message: '토큰 검증 완료',
      timestamp: new Date().toISOString(),
      results: {
        productsApi: {
          status: productsStatus,
          ok: productsOk,
          message: productsOk ? 'Products API 정상 작동' : 'Products API 실패',
          data: productsOk ? productsData : productsData.substring(0, 200)
        },
        scriptTagsApi: {
          status: scriptGetStatus,
          ok: scriptGetOk,
          message: scriptGetOk ? 'ScriptTags API 권한 있음 ✅' : 'ScriptTags API 권한 없음 ❌',
          error: scriptGetOk ? null : scriptGetData.substring(0, 500)
        }
      },
      conclusion: scriptGetOk 
        ? '✅ ScriptTags API 사용 가능! 403 에러는 다른 원인입니다.'
        : '❌ ScriptTags API 권한이 실제로 없습니다. OAuth 재인증이 필요합니다.'
    });

  } catch (error) {
    console.error('❌ 검증 오류:', error);
    return NextResponse.json({
      success: false,
      error: '검증 중 오류 발생',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
