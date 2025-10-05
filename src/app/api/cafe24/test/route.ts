// 카페24 API 연결 테스트
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const accessToken = request.cookies.get('cafe24_access_token')?.value;
        const mallId = request.cookies.get('cafe24_mall_id')?.value;
        
        if (!accessToken || !mallId) {
            return NextResponse.json(
                { error: 'Not authenticated. Please login with Cafe24 first.' },
                { status: 401 }
            );
        }
        
        // 카페24 API 테스트 - 상품 목록 조회
        const response = await fetch(`https://${mallId}.cafe24api.com/api/v2/admin/products`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Cafe24-Api-Version': '2024-06-01'
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            return NextResponse.json(
                { error: 'Cafe24 API Error', details: data },
                { status: response.status }
            );
        }
        
        return NextResponse.json({
            success: true,
            message: 'Cafe24 API connection successful!',
            mall_id: mallId,
            products_count: data.products?.length || 0,
            sample_data: data
        });
        
    } catch (error) {
        console.error('API test error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'API test failed', details: errorMessage },
            { status: 500 }
        );
    }
}
