// src/app/api/webhooks/review-created/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔔 [Webhook] Review Created:', JSON.stringify(body, null, 2));

    const {
      mall_id,
      event,
      resource,
    } = body;

    if (event !== 'review.created') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid event type' 
      }, { status: 400 });
    }

    const review = resource;
    
    // 리뷰 저장
    const savedReview = await prisma.review.create({
      data: {
        mallId: mall_id,
        cafe24BoardNo: parseInt(review.board_no),
        productNo: parseInt(review.product_no),
        memberId: review.member_id,
        content: review.content,
        rating: review.rating,
        referralCode: generateReferralCode(mall_id, review.board_no),
        participateR2e: true,
      },
    });

    console.log('✅ [Webhook] Review saved with referral code:', savedReview.referralCode);

    return NextResponse.json({
      success: true,
      message: 'Review processed and referral link created',
      referral_code: savedReview.referralCode,
      review_id: savedReview.id,
    });
  } catch (error) {
    console.error('❌ [Webhook] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

function generateReferralCode(mallId: string, boardNo: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `R2E_${mallId}_${boardNo}_${timestamp}${random}`.toUpperCase();
}
