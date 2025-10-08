// src/app/api/webhooks/review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 Review Webhook received:', JSON.stringify(body, null, 2));

    // Cafe24 웹훅 데이터 추출
    const resource = body.resource;
    const mallId = body.mall_id || 'dhdshop'; // 기본값 (나중에 제거 필요)

    if (!resource) {
      return NextResponse.json(
        { success: false, error: 'Missing resource data' },
        { status: 400 }
      );
    }

    // 리뷰 데이터 추출
    const {
      board_no,
      product_no,
      member_id,
      content,
      rating,
    } = resource;

    console.log('📝 Review data:', {
      board_no,
      product_no,
      member_id,
      mallId,
    });

    // 필수 필드 검증
    if (!board_no || !product_no || !member_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. 동의 여부 확인
    const consent = await prisma.consent.findUnique({
      where: {
        memberId_mallId: {
          memberId: member_id,
          mallId,
        },
      },
    });

    if (!consent || !consent.consented) {
      console.log('❌ User has not consented to R2E program');
      return NextResponse.json({
        success: false,
        reason: 'not_consented',
        message: 'User has not consented to participate in Review2Earn',
      });
    }

    // 2. 추천 코드 생성
    const referralCode = generateReferralCode(member_id, product_no, board_no);

    // 3. 리뷰 저장 (upsert)
    const review = await prisma.review.upsert({
      where: {
        cafe24BoardNo_mallId: {
          cafe24BoardNo: board_no,
          mallId,
        },
      },
      update: {
        content: content || null,
        rating: rating || null,
        participateR2e: true,
        updatedAt: new Date(),
      },
      create: {
        cafe24BoardNo: board_no,
        productNo: product_no,
        memberId: member_id,
        mallId,
        content: content || null,
        rating: rating || null,
        referralCode,
        participateR2e: true,
      },
    });

    console.log('✅ Review saved:', {
      id: review.id,
      referralCode: review.referralCode,
    });

    // 4. 추천 링크 생성
    const baseUrl = process.env.NEXTAUTH_URL || 'https://review2earn.vercel.app';
    const referralLink = `${baseUrl}/product/${product_no}?ref=${referralCode}`;

    return NextResponse.json({
      success: true,
      data: {
        reviewId: review.id,
        referralCode: review.referralCode,
        referralLink,
        message: 'Review registered successfully for Review2Earn program',
      },
    });

  } catch (error) {
    console.error('❌ Review webhook error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process review webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// 추천 코드 생성 함수
function generateReferralCode(
  memberId: string,
  productNo: number,
  boardNo: number
): string {
  const timestamp = Date.now();
  const data = `${memberId}-${productNo}-${boardNo}-${timestamp}`;
  const hash = crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
    .substring(0, 12)
    .toUpperCase();
  
  return `R2E${hash}`;
}
