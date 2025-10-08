// src/app/api/webhooks/order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📦 Order Webhook received:', JSON.stringify(body, null, 2));

    const resource = body.resource;
    const mallId = body.mall_id || 'dhdshop';

    if (!resource) {
      return NextResponse.json(
        { success: false, error: 'Missing resource data' },
        { status: 400 }
      );
    }

    const {
      order_id,
      items,
      referer,
    } = resource;

    console.log('📝 Order data:', {
      order_id,
      items_count: items?.length,
      referer,
      mallId,
    });

    if (!order_id || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required order fields' },
        { status: 400 }
      );
    }

    // 1. Referer에서 추천 코드 추출
    let referralCode: string | null = null;
    
    if (referer) {
      try {
        const url = new URL(referer);
        referralCode = url.searchParams.get('ref');
        console.log('🔗 Referral code from referer:', referralCode);
      } catch (error) {
        console.warn('⚠️ Failed to parse referer URL:', error);
      }
    }

    if (!referralCode) {
      console.log('ℹ️ No referral code found - regular order');
      return NextResponse.json({
        success: true,
        reason: 'no_referral',
        message: 'Order processed without referral',
      });
    }

    // 2. 리뷰 찾기
    const review = await prisma.review.findUnique({
      where: {
        referralCode_mallId: {
          referralCode,
          mallId,
        },
      },
      include: {
        mall: true,
      },
    });

    if (!review) {
      console.log('❌ Review not found for referral code:', referralCode);
      return NextResponse.json({
        success: false,
        reason: 'invalid_referral',
        message: 'Invalid referral code',
      });
    }

    console.log('✅ Review found:', {
      reviewId: review.id,
      memberId: review.memberId,
      productNo: review.productNo,
    });

    // 3. 보상 계산 및 거래 생성
    const transactions = [];
    let totalReward = 0;

    for (const item of items) {
      const {
        product_no,
        product_price,
        quantity,
      } = item;

      // 리뷰 상품과 주문 상품 매칭 확인
      if (product_no !== review.productNo) {
        console.log(`⚠️ Product mismatch: ${product_no} !== ${review.productNo}`);
        continue;
      }

      // 보상 요율 가져오기
      const rewardRate = review.mall?.reviewerRewardRate ?? 0.01;
      const itemTotal = parseFloat(product_price) * quantity;
      const rewardAmount = Math.floor(itemTotal * rewardRate);

      console.log('💰 Reward calculation:', {
        itemTotal,
        rewardRate: `${rewardRate * 100}%`,
        rewardAmount,
      });

      // 거래 기록 생성
      const transaction = await prisma.transaction.create({
        data: {
          reviewId: review.id,
          mallId,
          cafe24OrderId: order_id,
          productNo: product_no,
          orderAmount: itemTotal,
          rewardAmount,
          rewardRate,
          status: 'pending',
        },
      });

      transactions.push(transaction);
      totalReward += rewardAmount;
    }

    if (transactions.length === 0) {
      return NextResponse.json({
        success: false,
        reason: 'no_matching_products',
        message: 'No matching products found for this referral',
      });
    }

    console.log('✅ Order processed successfully:', {
      transactionCount: transactions.length,
      totalReward,
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order_id,
        reviewId: review.id,
        transactionCount: transactions.length,
        totalReward,
        message: 'Referral reward processed successfully',
      },
    });

  } catch (error) {
    console.error('❌ Order webhook error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process order webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
