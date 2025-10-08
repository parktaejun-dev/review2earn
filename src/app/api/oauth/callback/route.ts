// src/app/api/oauth/callback/route.ts
// 카페24 OAuth 콜백: 토큰을 받아서 데이터베이스에 저장
import { NextRequest, NextResponse } from 'next/server';
import { serverConfig } from '@/lib/config';
import { saveMallSettings } from '@/lib/db';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  
  console.log('🎯 OAuth Callback - Parameters:', {
    code: code ? '[RECEIVED]' : 'MISSING',
    state: stateParam ? stateParam.substring(0, 20) + '...' : 'MISSING',
    error: error || 'NONE',
    error_description: errorDescription || 'NONE'
  });

  // 환경변수 상태 디버깅
  console.log('🎯 Environment Variables Check:', {
    clientId: serverConfig.cafe24.clientId ? '[SET]' : 'MISSING',
    clientSecret: serverConfig.cafe24.clientSecret ? '[SET]' : 'MISSING',
    redirectUri: serverConfig.cafe24.redirectUri ? '[SET]' : 'MISSING'
  });

  // 에러 처리
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
    // state에서 mall_id 추출
    let mallId = 'dhdshop'; // 기본값
    
    if (stateParam) {
      try {
        const decodedState = Buffer.from(stateParam, 'base64').toString('utf-8');
        const stateObj = JSON.parse(decodedState);
        mallId = stateObj.mallId || 'dhdshop';
        
        console.log('✅ Decoded state:', {
          mallId: stateObj.mallId,
          random: stateObj.random?.substring(0, 10) + '...',
          timestamp: stateObj.timestamp
        });
      } catch (e) {
        console.warn('⚠️ Failed to parse state, using default mall_id:', e);
      }
    }
    
    console.log('🎯 Using mall_id:', mallId);
    
    // 환경변수 존재 확인
    if (!serverConfig.cafe24.clientId || !serverConfig.cafe24.clientSecret) {
      console.error('❌ Missing OAuth credentials');
      return NextResponse.redirect(
        new URL(`/?error=missing_credentials`, request.url)
      );
    }
    
    const tokenUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/token`;
    const redirectUri = serverConfig.cafe24.redirectUri;
    
    // Token request payload
    const tokenPayload = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    };

    // Basic Auth 헤더 생성
    const credentials = Buffer.from(
      `${serverConfig.cafe24.clientId}:${serverConfig.cafe24.clientSecret}`
    ).toString('base64');

    console.log('🎯 Token Request:', {
      url: tokenUrl,
      mall_id: mallId,
      client_id: serverConfig.cafe24.clientId,
      redirect_uri: redirectUri,
      code: '[RECEIVED]'
    });

    // 토큰 요청
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

    // ============================================
    // 🆕 데이터베이스에 토큰 저장
    // ============================================
    try {
      const expiresAt = tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : undefined;

      const savedSettings = await saveMallSettings({
        mall_id: mallId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt,
        api_version: '2025-09-01'
      });

      console.log('✅ Token saved to database:', {
        mall_id: savedSettings.mall_id,
        id: savedSettings.id,
        expires_at: savedSettings.token_expires_at
      });

    } catch (dbError) {
      console.error('❌ Failed to save token to database:', dbError);
      // 데이터베이스 저장 실패해도 일단 계속 진행
      // 프로덕션에서는 더 엄격하게 처리해야 합니다
    }

    // 성공 리다이렉트 (URL 파라미터로 토큰 전달하지 않음 - 보안상)
    console.log('✅ OAuth callback completed - redirecting to success page');
    return NextResponse.redirect(
      new URL(
        `/?success=oauth_complete&mall_id=${mallId}`,
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
