import { NextRequest, NextResponse } from 'next/server';
import { serverConfig } from '@/lib/config';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  
  console.log('🎯 OAuth Callback - Parameters:', {
    code: code ? '[RECEIVED]' : 'MISSING',
    state: state || 'MISSING',
    error: error || 'NONE',
    error_description: errorDescription || 'NONE'
  });

  // 환경변수 상태 디버깅
  console.log('🎯 Environment Variables Check:', {
    clientId: serverConfig.cafe24.clientId ? '[SET]' : 'MISSING',
    clientSecret: serverConfig.cafe24.clientSecret ? '[SET]' : 'MISSING',
    baseUrl: serverConfig.cafe24.baseUrl || 'MISSING'
  });

  if (error) {
    console.error('❌ OAuth Error from Cafe24:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/?error=oauth_error&details=${encodeURIComponent(error + ': ' + (errorDescription || 'Unknown error'))}`, request.url)
    );
  }

  if (!code) {
    console.error('❌ No authorization code received');
    return NextResponse.redirect(
      new URL(`/?error=no_code&url=${encodeURIComponent(request.url)}`, request.url)
    );
  }

  try {
    const mallId = 'dhdshop';
    
    // 환경변수 존재 확인
    if (!serverConfig.cafe24.clientId || !serverConfig.cafe24.clientSecret) {
      console.error('❌ Missing OAuth credentials');
      return NextResponse.redirect(
        new URL(`/?error=missing_credentials&client_id=${!!serverConfig.cafe24.clientId}&client_secret=${!!serverConfig.cafe24.clientSecret}`, request.url)
      );
    }
    
    const tokenUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/token`;
    const redirectUri = `${serverConfig.cafe24.baseUrl}/api/oauth/callback`;
    
    // 🔥 Authorization 헤더 방식으로 변경
    const tokenPayload = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    };

    // 🔥 Basic Auth 헤더 생성
    const credentials = Buffer.from(`${serverConfig.cafe24.clientId}:${serverConfig.cafe24.clientSecret}`).toString('base64');

    console.log('🎯 Token Request:', {
      url: tokenUrl,
      client_id: serverConfig.cafe24.clientId,
      redirect_uri: tokenPayload.redirect_uri,
      authorization: `Basic ${credentials.substring(0, 20)}...`,
      code: '[RECEIVED]'
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`, // 🔥 중요: Authorization 헤더
      },
      body: new URLSearchParams(tokenPayload),
    });

    console.log('🎯 Token Response Status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token request failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
        headers: Object.fromEntries(tokenResponse.headers.entries())
      });
      
      return NextResponse.redirect(
        new URL(`/?error=token_failed&status=${tokenResponse.status}&details=${encodeURIComponent(errorText)}`, request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token received:', {
      access_token: tokenData.access_token ? '[RECEIVED]' : 'MISSING',
      refresh_token: tokenData.refresh_token ? '[RECEIVED]' : 'MISSING',
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    });

    // 쿠키 설정
    const response = NextResponse.redirect(new URL('/?success=oauth_complete', request.url));
    
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
        maxAge: 60 * 60 * 24 * 30,
        path: '/'
      });
    }

    response.cookies.set('cafe24_mall_id', mallId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/'
    });

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
