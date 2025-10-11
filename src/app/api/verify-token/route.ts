import { CAFE24_CONFIG } from '@/lib/cafe24-config';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { mallId, accessToken } = await request.json();

    if (!mallId || !accessToken) {
      return NextResponse.json(
        { error: 'mallId and accessToken are required' },
        { status: 400 }
      );
    }

    // 간단한 API 호출로 토큰 검증
    const verifyShop = await fetch(
      `https://${mallId}.cafe24api.com/api/v2/admin/shop`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Cafe24-Api-Version': CAFE24_CONFIG.API_VERSION
        }
      }
    );

    if (!verifyShop.ok) {
      return NextResponse.json(
        { valid: false, error: 'Token is invalid or expired' },
        { status: 401 }
      );
    }

    // Products API로 추가 검증
    const verifyProducts = await fetch(
      `https://${mallId}.cafe24api.com/api/v2/admin/products?limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Cafe24-Api-Version': CAFE24_CONFIG.API_VERSION
        }
      }
    );

    if (!verifyProducts.ok) {
      return NextResponse.json(
        { valid: false, error: 'Token is invalid or expired' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      message: 'Token is valid'
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
