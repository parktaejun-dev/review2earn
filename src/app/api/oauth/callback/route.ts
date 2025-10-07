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
        new URL(`/?error=missing_credentials`, request.url)
      );
    }
    
    const tokenUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/token`;
    const redirectUri = `${serverConfig.cafe24.baseUrl}/api/oauth/callback`;
    
    // 🔥 Authorization 헤더 방식
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
        'Authorization': `Basic ${credentials}`,
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
      });
      
      return NextResponse.redirect(
        new URL(`/?error=token_failed&status=${tokenResponse.status}`, request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token received:', {
      access_token: tokenData.access_token ? '[RECEIVED]' : 'MISSING',
      refresh_token: tokenData.refresh_token ? '[RECEIVED]' : 'MISSING',
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    });

    // 🔥 URL 파라미터로 토큰 전달 (쿠키 대신)
    // 프론트엔드에서 localStorage에 저장하도록 함
    console.log('✅ OAuth callback completed - redirecting with token');
    return NextResponse.redirect(
      new URL(
        `/?success=oauth_complete&access_token=${encodeURIComponent(tokenData.access_token)}&refresh_token=${encodeURIComponent(tokenData.refresh_token || '')}&mall_id=${mallId}&expires_in=${tokenData.expires_in || 3600}`,
        request.url
      )
    );

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/?error=callback_error&details=${encodeURIComponent((error as Error).message)}`, request.url)
    );
  }
}
