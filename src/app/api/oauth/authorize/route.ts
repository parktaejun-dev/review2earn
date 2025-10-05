// OAuth 인증 시작점 - 카페24로 리다이렉트
import { NextRequest, NextResponse } from 'next/server';
import { Cafe24OAuth } from '@/lib/cafe24-oauth';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const mallId = searchParams.get('mall_id');
    
    if (!mallId) {
        return NextResponse.json(
            { error: 'Mall ID is required' },
            { status: 400 }
        );
    }
    
    try {
        const oauth = new Cafe24OAuth();
        const state = oauth.generateState();
        const authUrl = oauth.getAuthUrl(mallId, state);
        
        // State를 세션 또는 쿠키에 저장 (CSRF 방지)
        const response = NextResponse.redirect(authUrl);
        response.cookies.set('oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 600 // 10분
        });
        response.cookies.set('mall_id', mallId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 600 // 10분
        });
        
        return response;
        
    } catch (error) {
        console.error('OAuth authorize error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}
