import { NextRequest, NextResponse } from 'next/server';
import { Cafe24OAuth } from '@/lib/cafe24-oauth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const mallId = searchParams.get('mall_id');
    const error = searchParams.get('error');

    // 에러 처리
    if (error) {
      const errorDescription = searchParams.get('error_description');
      console.error('OAuth error:', error, errorDescription);
      
      return NextResponse.redirect(new URL('/?error=' + encodeURIComponent(error), request.url));
    }

    // 필수 매개변수 확인
    if (!code || !mallId) {
      return NextResponse.redirect(new URL('/?error=missing_params', request.url));
    }

    // 액세스 토큰 교환
    const oauth = new Cafe24OAuth();
    const tokenData = await oauth.getAccessToken(mallId, code);

    // 쿠키에 토큰 및 mall_id 저장
    const response = NextResponse.redirect(new URL('/admin/dashboard', request.url));
    
    response.cookies.set('cafe24_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in
    });

    // ⭐ Refresh Token 저장 추가
    if (tokenData.refresh_token) {
      response.cookies.set('cafe24_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokenData.expires_in * 10 // 리프레시 토큰은 더 오래 보관
      });
    }
    
    response.cookies.set('cafe24_mall_id', mallId, {
      httpOnly: false, // 클라이언트에서 읽을 수 있도록
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in
    });

    return response;

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
  }
}
