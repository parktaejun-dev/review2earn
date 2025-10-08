// src/app/api/reward-rate/route.ts
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
        { status: 400 }
      );
    }

    // 쇼핑몰 설정 조회 (기존 필드 사용)
    const mallSettings = await prisma.mallSettings.findUnique({
      where: { mallId }
    });

    if (mallSettings) {
      // 기존 필드: reviewerRewardRate, buyerDiscountRate
      const reviewerPercent = (mallSettings.reviewerRewardRate || 0.01) * 100; // 0.01 → 1%
      const buyerPercent = (mallSettings.buyerDiscountRate || 0.05) * 100;     // 0.05 → 5%

      return NextResponse.json({
        success: true,
        reviewerPercent: parseFloat(reviewerPercent.toFixed(2)),
        buyerPercent: parseFloat(buyerPercent.toFixed(2)),
        source: 'mall'
      });
    }

    // 기본값 (MallSettings 없을 때)
    return NextResponse.json({
      success: true,
      reviewerPercent: 1.0,  // 1%
      buyerPercent: 5.0,     // 5%
      source: 'default'
    });

  } catch (error) {
    console.error('Reward Rate API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류' },
      { status: 500 }
    );
  }
}
