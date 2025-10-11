// 📂 src/app/api/webhooks/order/route.ts
// Review2Earn v6.0 - Order Webhook Handler
// 구매 완료 시 리뷰어에게 적립금 지급 (주문금액 기반)

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateReward } from '@/lib/reward-calculator';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('🔔 Order Webhook received:', JSON.stringify(body, null, 2));

    const mallId = body.mall_id || body.resource?.mall_id;
    
    if (!mallId) {
      return NextResponse.json({ error: 'mallId is required' }, { status: 400 });
    }

    if (body.event === 'order.placed') {
      const { resource } = body;
      
      // 쿠키/메타데이터에서 레퍼럴 코드 추출
      const referralCode = resource.referral_code || resource.metadata?.r2e_ref;

      if (!referralCode) {
        console.log('⚠️ No referral code in order');
        return NextResponse.json({ success: true, message: 'No referral code' });
      }

      // ✅ 주문금액 추출
      const orderAmount = parseInt(resource.order_amount || resource.payment_amount || 0);

      if (orderAmount <= 0) {
        console.log('⚠️ Invalid order amount:', orderAmount);
        return NextResponse.json({ success: true, message: 'Invalid amount' });
      }

      // ✅ DB에서 비율 가져와서 동적 계산
      const reward = await calculateReward({
        mallId,
        productNo: parseInt(resource.product_no),
        orderAmount,  // ✅ 주문금액 전달
      });

      console.log('💰 Calculated reward:', reward);

      // R2E 계정 찾기
      const r2eAccount = await prisma.r2EAccount.findUnique({
        where: { referralCode },
      });

      if (!r2eAccount) {
        console.log('⚠️ R2E account not found:', referralCode);
        return NextResponse.json({ success: true, message: 'Account not found' });
      }

      // 리뷰 찾기
      const review = await prisma.review.findFirst({
        where: {
          referralCode,
          mallId,
          productNo: parseInt(resource.product_no),
        },
      });

      if (!review) {
        console.log('⚠️ Review not found');
        return NextResponse.json({ success: true, message: 'Review not found' });
      }

      // ✅ 동적 계산된 보상 지급
      const transaction = await prisma.r2ETransaction.create({
        data: {
          r2eUserId: r2eAccount.id,
          reviewId: review.id,
          mallId: mallId,
          type: 'REFERRAL_REWARD',
          status: 'COMPLETED',
          amount: reward.reviewerAmount,  // ✅ 동적 계산
          description: `주문 보상 (주문금액: ${orderAmount.toLocaleString()}원, 보상율: ${reward.reviewerRate * 100}%)`,
          referralCode: referralCode,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      // 포인트 업데이트
      await prisma.r2EAccount.update({
        where: { id: r2eAccount.id },
        data: {
          totalPoints: { increment: reward.reviewerAmount },
          availablePoints: { increment: reward.reviewerAmount },
        },
      });

      // 리뷰 통계 업데이트
      await prisma.review.update({
        where: { id: review.id },
        data: {
          conversionCount: { increment: 1 },
          totalRevenue: { increment: orderAmount },
        },
      });

      console.log('✅ Reward credited:', {
        txId: transaction.id,
        userId: r2eAccount.id,
        orderAmount,
        rewardAmount: reward.reviewerAmount,
        rewardRate: reward.reviewerRate,
      });

      return NextResponse.json({ 
        success: true, 
        mallId,
        transactionId: transaction.id,
        orderAmount,
        rewardAmount: reward.reviewerAmount,
        rewardRate: reward.reviewerRate,
      });
    }

    return NextResponse.json({ success: true, message: 'Event not handled' });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Webhook processing failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
