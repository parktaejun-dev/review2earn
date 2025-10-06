import { NextRequest, NextResponse } from 'next/server';
import { serverConfig } from '@/lib/config';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const mallId = url.searchParams.get('mall_id') || 'dhdshop'; // 기본값

  console.log('🎯 OAuth Callback received:', { code, state, mallId });

  if (!code) {
    console.error('❌ No authorization code received');
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
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

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token request failed:', tokenResponse.status, errorText);
      return NextResponse.redirect(new URL(`/?error=token_failed&details=${encodeURIComponent(errorText)}`, request.url));
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token response received:', { 
      access_token: tokenData.access_token ? '[RECEIVED]' : 'MISSING',
      refresh_token: tokenData.refresh_token ? '[RECEIVED]' : 'MISSING',
      expires_in: tokenData.expires_in 
    });

    // 토큰을 쿠키에 저장
    const response = NextResponse.redirect(new URL('/?success=oauth_complete', request.url));
    
    // 쿠키 설정
    response.cookies.set('cafe24_access_token', tokenData.access_token, {
      httpOnly: false, // 클라이언트에서 접근 가능하도록
      secure: true,
      sameSite: 'lax',
      maxAge: tokenData.expires_in || 3600,
      path: '/'
    });

    if (tokenData.refresh_token) {
      response.cookies.set('cafe24_refresh_token', tokenData.refresh_token, {
        httpOnly: true, // 보안상 서버에서만 접근
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30일
        path: '/'
      });
    }

    response.cookies.set('cafe24_mall_id', mallId, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30일
      path: '/'
    });

    console.log('✅ OAuth callback completed successfully');
    return response;

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    return NextResponse.redirect(new URL(`/?error=callback_error&details=${encodeURIComponent((error as Error).message)}`, request.url));
  }
}
