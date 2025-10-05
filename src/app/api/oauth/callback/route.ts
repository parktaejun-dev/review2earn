// OAuth 콜백 처리 - 카페24에서 돌아온 후 처리
import { NextRequest, NextResponse } from 'next/server';
import { Cafe24OAuth } from '@/lib/cafe24-oauth';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // OAuth 에러 체크
    if (error) {
        console.error('OAuth error:', error);
        return NextResponse.redirect(new URL('/auth/error?error=' + error, request.url));
    }
    
    // 필수 파라미터 체크
    if (!code || !state) {
        return NextResponse.redirect(new URL('/auth/error?error=missing_parameters', request.url));
    }
    
    try {
        // 쿠키에서 저장된 state와 mall_id 확인
        const cookieState = request.cookies.get('oauth_state')?.value;
        const mallId = request.cookies.get('mall_id')?.value;
        
        // CSRF 방지 - State 검증
        if (state !== cookieState) {
            console.error('State mismatch:', { received: state, expected: cookieState });
            return NextResponse.redirect(new URL('/auth/error?error=state_mismatch', request.url));
        }
        
        if (!mallId) {
            return NextResponse.redirect(new URL('/auth/error?error=missing_mall_id', request.url));
        }
        
        // Authorization Code → Access Token 교환
        const oauth = new Cafe24OAuth();
        const tokenData = await oauth.getAccessToken(mallId, code);
        
        // TODO: 토큰을 데이터베이스에 저장
        // await saveTokenToDatabase(mallId, tokenData);
        
        // 임시로 세션에 저장 (실제로는 DB 저장)
        console.log('OAuth success:', {
            mall_id: mallId,
            access_token: tokenData.access_token.substring(0, 10) + '...',
            expires_in: tokenData.expires_in
        });
        
        // 성공 시 관리자 대시보드로 리다이렉트
        const response = NextResponse.redirect(new URL('/admin/dashboard', request.url));
        
        // 쿠키 정리
        response.cookies.delete('oauth_state');
        response.cookies.delete('mall_id');
        
        // 임시로 토큰을 쿠키에 저장 (개발용)
        response.cookies.set('cafe24_access_token', tokenData.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: tokenData.expires_in
        });
        response.cookies.set('cafe24_mall_id', mallId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: tokenData.expires_in
        });
        
        return response;
        
    } catch (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.redirect(new URL('/auth/error?error=callback_failed', request.url));
    }
}
