import { NextRequest, NextResponse } from 'next/server';
import { serverConfig } from '@/lib/config';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  
  // 모든 파라미터 로깅
  console.log('🎯 OAuth Callback - All parameters:', {
    code: code ? '[RECEIVED]' : 'MISSING',
    state: state || 'MISSING',
    error: error || 'NONE',
    error_description: errorDescription || 'NONE',
    full_url: request.url,
    all_params: Object.fromEntries(url.searchParams.entries())
  });

  // 에러 파라미터가 있는 경우
  if (error) {
    console.error('❌ OAuth Error from Cafe24:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/?error=oauth_error&details=${encodeURIComponent(error + ': ' + (errorDescription || 'Unknown error'))}`, request.url)
    );
  }

  // code가 없는 경우
  if (!code) {
    console.error('❌ No authorization code received. URL:', request.url);
    console.error('❌ URL Search Params:', Object.fromEntries(url.searchParams.entries()));
    
    // 디버깅을 위해 모든 파라미터를 보여줌
    const debugInfo = {
      received_url: request.url,
      search_params: Object.fromEntries(url.searchParams.entries()),
      headers: Object.fromEntries(request.headers.entries())
    };
    
    return NextResponse.redirect(
      new URL(`/?error=no_code&debug=${encodeURIComponent(JSON.stringify(debugInfo))}`, request.url)
    );
  }

  try {
    // mallId를 state에서 추출하거나 기본값 사용
    const mallId = 'dhdshop'; // 임시로 고정
    
    // 토큰 교환 요청
    const tokenUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/token`;
    const redirectUri = `${serverConfig.cafe24.baseUrl}/api/oauth/callback`;
    
    const tokenPayload = {
      grant_type: 'authorization_code',
      client_id: serverConfig.cafe24.clientId,
      client_secret: serverConfig.cafe24.clientSecret,
      code: code,
      redirect_uri: redirectUri,
    };

    console.log('🎯 Requesting access token from:', tokenUrl);
    console.log('🎯 Token payload:', { ...tokenPayload, client_secret: '[HIDDEN]' });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenPayload),
    });

    console.log('🎯 Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token request failed:', tokenResponse.status, errorText);
      return NextResponse.redirect(
        new URL(`/?error=token_failed&status=${tokenResponse.status}&details=${encodeURIComponent(errorText)}`, request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token response received:', { 
      access_token: tokenData.access_token ? '[RECEIVED]' : 'MISSING',
      refresh_token: tokenData.refresh_token ? '[RECEIVED]' : 'MISSING',
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    });

    // 토큰을 쿠키에 저장
    const response = NextResponse.redirect(new URL('/?success=oauth_complete', request.url));
    
    // 쿠키 설정 (더 관대한 설정)
    response.cookies.set('cafe24_access_token', tokenData.access_token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in || 3600,
      path: '/'
    });

    if (tokenData.refresh_token) {
      response.cookies.set('cafe24_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30일
        path: '/'
      });
    }

    response.cookies.set('cafe24_mall_id', mallId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30일
      path: '/'
    });

    // 성공 정보도 쿠키에 저장
    response.cookies.set('cafe24_oauth_success', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60,
      path: '/'
    });

    console.log('✅ OAuth callback completed successfully');
    return response;

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/?error=callback_error&details=${encodeURIComponent((error as Error).message)}`, request.url)
    );
  }
}
