// API 연결 테스트 엔드포인트 (토큰 갱신 포함)
import { NextRequest, NextResponse } from 'next/server';
import { Cafe24OAuth } from '@/lib/cafe24-oauth';

export async function POST(request: NextRequest) {
    try {
        const accessToken = request.cookies.get('cafe24_access_token')?.value;
        const refreshToken = request.cookies.get('cafe24_refresh_token')?.value;
        const mallId = request.cookies.get('cafe24_mall_id')?.value;

        if (!mallId) {
            return NextResponse.json({
                success: false,
                message: '카페24 연동 정보가 없습니다. 다시 로그인해주세요.'
            }, { status: 401 });
        }

        let currentAccessToken = accessToken;

        // 액세스 토큰이 없거나 만료된 경우 갱신 시도
        if (!currentAccessToken && refreshToken) {
            try {
                const oauth = new Cafe24OAuth();
                const newTokenData = await oauth.refreshAccessToken(mallId, refreshToken);
                
                currentAccessToken = newTokenData.access_token;
                
                // 새로운 토큰으로 쿠키 업데이트
                const response = NextResponse.json({
                    success: true,
                    message: '토큰이 갱신되었습니다'
                });
                
                response.cookies.set('cafe24_access_token', newTokenData.access_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: newTokenData.expires_in
                });

                if (newTokenData.refresh_token) {
                    response.cookies.set('cafe24_refresh_token', newTokenData.refresh_token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: newTokenData.expires_in
                    });
                }
            } catch (error) {
                console.error('Token refresh failed:', error);
                return NextResponse.json({
                    success: false,
                    message: '토큰 갱신에 실패했습니다. 다시 로그인해주세요.'
                }, { status: 401 });
            }
        }

        if (!currentAccessToken) {
            return NextResponse.json({
                success: false,
                message: '인증 토큰이 필요합니다. 다시 로그인해주세요.'
            }, { status: 401 });
        }

        // 상품 목록 조회 테스트
        const productUrl = `https://${mallId}.cafe24api.com/api/v2/admin/products`;
        
        const response = await fetch(productUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentAccessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            
            // 토큰 만료 에러인 경우
            if (errorData.error?.code === 401 && refreshToken) {
                try {
                    const oauth = new Cafe24OAuth();
                    const newTokenData = await oauth.refreshAccessToken(mallId, refreshToken);
                    
                    // 갱신된 토큰으로 재시도
                    const retryResponse = await fetch(productUrl, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${newTokenData.access_token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    const retryData = await retryResponse.json();
                    
                    const finalResponse = NextResponse.json({
                        success: true,
                        message: 'Cafe24 API connection successful! (토큰 갱신됨)',
                        mall_id: mallId,
                        products_count: retryData.products?.length || 0,
                        sample_data: {
                            products: retryData.products?.slice(0, 2) || []
                        }
                    });

                    // 새로운 토큰으로 쿠키 업데이트
                    finalResponse.cookies.set('cafe24_access_token', newTokenData.access_token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: newTokenData.expires_in
                    });

                    if (newTokenData.refresh_token) {
                        finalResponse.cookies.set('cafe24_refresh_token', newTokenData.refresh_token, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'lax',
                            maxAge: newTokenData.expires_in
                        });
                    }

                    return finalResponse;

                } catch (refreshError) {
                    console.error('Token refresh in retry failed:', refreshError);
                    return NextResponse.json({
                        success: false,
                        message: '토큰 갱신에 실패했습니다. 다시 로그인해주세요.'
                    }, { status: 401 });
                }
            }

            throw new Error(`HTTP ${response.status}: ${errorData.error?.message || 'API 오류'}`);
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            message: 'Cafe24 API connection successful!',
            mall_id: mallId,
            products_count: data.products?.length || 0,
            sample_data: {
                products: data.products?.slice(0, 2) || []
            }
        });

    } catch (error) {
        console.error('API connection test error:', error);
        
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'API 연결 테스트 중 오류가 발생했습니다',
            error: 'Cafe24 API Error',
            details: error
        }, { status: 500 });
    }
}
