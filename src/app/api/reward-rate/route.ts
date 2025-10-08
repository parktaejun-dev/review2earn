// src/app/api/reward-rate/route.ts (개선 버전)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mallId = searchParams.get('mall_id');
    const productId = searchParams.get('product_id');

    if (!mallId || !productId) {
      return NextResponse.json(
        { success: false, message: 'Mall ID와 Product ID가 필요합니다.' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    // 쇼핑몰 설정 조회 (기존 필드 사용)
    const mallSettings = await prisma.mallSettings.findUnique({
      where: { mallId }
    });

    if (mallSettings) {
      // 기존 필드: reviewerRewardRate, buyerDiscountRate
      const reviewerPercent = (mallSettings.reviewerRewardRate || 0.01) * 100;
      const buyerPercent = (mallSettings.buyerDiscountRate || 0.05) * 100;

      return NextResponse.json(
        {
          success: true,
          reviewerPercent: parseFloat(reviewerPercent.toFixed(2)),
          buyerPercent: parseFloat(buyerPercent.toFixed(2)),
          source: 'mall'
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    // 기본값 (MallSettings 없을 때)
    return NextResponse.json(
      {
        success: true,
        reviewerPercent: 1.0,  // 1%
        buyerPercent: 5.0,     // 5%
        source: 'default'
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );

  } catch (error) {
    console.error('Reward Rate API 오류:', error);
    return NextResponse.json(
      { 
        success: true,  // ⭐ 에러 시에도 success: true로 기본값 반환
        reviewerPercent: 1.0,
        buyerPercent: 5.0,
        source: 'error_fallback'
      },
      { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

// ⭐ OPTIONS 핸들러 추가 (CORS Preflight)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
