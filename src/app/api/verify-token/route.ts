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

    // 실제 API 호출로 권한 검증
    const testUrl = `https://${mallId}.cafe24api.com/api/v2/admin/products?limit=1`;
    
    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2025-09-01'
      }
    });

    if (response.ok) {
      // ScriptTags API도 테스트
      const scriptTagsUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
      const scriptResponse = await fetch(scriptTagsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Cafe24-Api-Version': '2025-09-01'
        }
      });

      return NextResponse.json({
        success: true,
        message: '토큰 검증 완료',
        productApi: 'OK',
        scriptTagsApi: scriptResponse.ok ? 'OK' : 'FAILED',
        scriptTagsStatus: scriptResponse.status,
        scriptTagsError: scriptResponse.ok ? null : await scriptResponse.text()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: '토큰이 유효하지 않습니다.',
        status: response.status
      });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '검증 중 오류 발생',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
