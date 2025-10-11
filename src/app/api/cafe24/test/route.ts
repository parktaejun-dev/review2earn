import { CAFE24_CONFIG } from '@/lib/cafe24-config';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mallId, accessToken } = body;

        if (!mallId || !accessToken) {
            return NextResponse.json({
                success: false,
                error: 'mallId and accessToken are required'
            }, { status: 400 });
        }

        const response = await fetch(
            `https://${mallId}.cafe24api.com/api/v2/admin/products?limit=1`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Cafe24-Api-Version': CAFE24_CONFIG.API_VERSION
                }
            }
        );

        if (!response.ok) {
            return NextResponse.json({
                success: false,
                error: 'Cafe24 API request failed',
                status: response.status
            }, { status: response.status });
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('Test API Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
