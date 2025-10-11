// src/app/api/referral/track/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { referralCode } = await request.json();

    if (!referralCode) {
      return NextResponse.json(
        { success: false, error: 'Missing referral code' },
        { status: 400 }
      );
    }

    // ============================================
    // v6.0: referralCode는 unique가 아니므로 updateMany 사용
    // ============================================
    const result = await prisma.review.updateMany({
      where: { referralCode },
      data: {
        clickCount: {
          increment: 1,
        },
      },
    });

    // 업데이트된 리뷰가 없으면 404
    if (result.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Referral code not found' },
        { status: 404 }
      );
    }

    console.log(`✅ [Track] Click recorded for ${referralCode} (${result.count} review(s))`);

    // 최신 클릭 수 조회 (첫 번째 리뷰)
    const updatedReview = await prisma.review.findFirst({
      where: { referralCode },
      select: { clickCount: true },
    });

    return NextResponse.json({
      success: true,
      referralCode,
      clickCount: updatedReview?.clickCount || 0,
      reviewCount: result.count,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [Track] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track click', details: errorMessage },
      { status: 500 }
    );
  }
}
