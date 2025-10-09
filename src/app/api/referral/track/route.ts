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

    // 클릭 수 증가
    const review = await prisma.review.update({
      where: { referralCode },
      data: {
        clickCount: {
          increment: 1,
        },
      },
    });

    console.log(`✅ [Track] Click recorded for ${referralCode}`);

    return NextResponse.json({
      success: true,
      referralCode,
      clickCount: review.clickCount,
    });
  } catch (error) {
    console.error('❌ [Track] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
