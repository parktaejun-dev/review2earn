// src/app/api/webhooks/order/route.ts
// 카페24 주문 확정 Webhook: 추천 코드로 구매하면 보상을 계산하고 저장합니다
import { NextRequest, NextResponse } from 'next/server';
import { saveTransaction, getReviewByReferralCode, getRewardRates } from '@/lib/db';


/**
 * POST /api/webhooks/order
 * 카페24에서 주문이 확정되면 자동으로 호출됩니다
 * 
 * Webhook Body (카페24에서 전송):
 * {
 *   event_no: number,
 *   resource: {
 *     mall_id: string,
 *     event: "updated",
 *     order_id: string,
 *     member_id: string,
 *     order_amount: number,
 *     order_status: string,
 *     payment_status: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🎯 Order Webhook received:', {
      event_no: body.event_no,
      mall_id: body.resource?.mall_id,
      event: body.resource?.event,
      order_id: body.resource?.order_id,
      member_id: body.resource?.member_id,
      order_amount: body.resource?.order_amount,
      order_status: body.resource?.order_status
    });

    // Webhook 데이터 검증
    if (!body.resource) {
      console.error('❌ Invalid webhook body: missing resource');
      return NextResponse.json(
        { success: false, error: 'Invalid webhook body' },
        { status: 400 }
      );
    }

    const { 
      mall_id, 
      order_id, 
      member_id, 
      order_amount,
      order_status,
      payment_status 
    } = body.resource;

    // 필수 파라미터 검증
    if (!mall_id || !order_id || !member_id || !order_amount) {
      console.error('❌ Missing required webhook parameters:', {
        mall_id,
        order_id,
        member_id,
        order_amount
      });
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 결제 완료 상태만 처리
    if (payment_status !== 'paid' && order_status !== 'confirmed') {
      console.log('⚠️ Order not paid/confirmed:', { 
        order_id, 
        payment_status, 
        order_status 
      });
      return NextResponse.json({
        success: true,
        message: 'Order not yet paid or confirmed'
      });
    }

    // URL에서 referral_code 추출 (실제로는 URL 파라미터나 쿠폰 코드에서 가져와야 함)
    // 여기서는 간단히 URL 쿼리 파라미터에서 가져온다고 가정
    const url = new URL(request.url);
    const referralCode = url.searchParams.get('referral_code') || 
                         body.resource.referral_code;

    if (!referralCode) {
      console.log('⚠️ No referral code found for order:', order_id);
      return NextResponse.json({
        success: true,
        message: 'No referral code associated with this order'
      });
    }

    console.log('🎯 Checking referral code:', referralCode);

    // 추천 코드로 리뷰 정보 조회
    const review = await getReviewByReferralCode(referralCode);

    if (!review) {
      console.log('⚠️ Invalid or inactive referral code:', referralCode);
      return NextResponse.json({
        success: true,
        message: 'Referral code not found or inactive'
      });
    }

    console.log('✅ Valid referral code found:', {
      referral_code: review.referral_code,
      reviewer_member_id: review.member_id,
      product_no: review.product_no
    });

        // 보상 비율 조회 (제품별 설정이 있으면 사용, 없으면 쇼핑몰 기본값)
    const rates = await getRewardRates(mall_id, review.product_no);

    console.log('💰 Reward rates:', rates);

    // 보상 계산
    const orderAmountNum = parseFloat(order_amount.toString());
    const reviewerReward = (orderAmountNum * rates.reviewer_percent) / 100;
    const buyerDiscount = (orderAmountNum * rates.buyer_percent) / 100;
    const platformFee = (orderAmountNum * rates.platform_percent) / 100;

    console.log('💰 Rewards calculated:', {
      order_amount: orderAmountNum,
      reviewer_reward: reviewerReward,
      buyer_discount: buyerDiscount,
      platform_fee: platformFee
    });


    // 거래 내역 저장
    const transaction = await saveTransaction({
      mall_id,
      order_id,
      referral_code: referralCode,
      reviewer_member_id: review.member_id,
      buyer_member_id: member_id,
      order_amount: orderAmountNum,
      reviewer_reward: reviewerReward,
      buyer_discount: buyerDiscount,
      platform_fee: platformFee
    });

    console.log('✅ Transaction saved:', {
      id: transaction.id,
      order_id: transaction.order_id,
      referral_code: transaction.referral_code,
      reviewer_member_id: transaction.reviewer_member_id,
      buyer_member_id: transaction.buyer_member_id,
      order_amount: transaction.order_amount,
      reviewer_reward: transaction.reviewer_reward,
      buyer_discount: transaction.buyer_discount,
      platform_fee: transaction.platform_fee,
      created_at: transaction.created_at
    });

    // TODO: 실제 보상 지급 로직 추가
    // 1. 카페24 적립금 API 호출하여 리뷰어에게 보상 지급
    // 2. 카페24 쿠폰 API 호출하여 구매자에게 할인 적용
    // 3. 이메일 알림 발송

    return NextResponse.json({
      success: true,
      data: {
        transaction_id: transaction.id,
        order_id: transaction.order_id,
        referral_code: transaction.referral_code,
        rewards: {
          reviewer_reward: transaction.reviewer_reward,
          buyer_discount: transaction.buyer_discount,
          platform_fee: transaction.platform_fee
        }
      }
    });

  } catch (error) {
    console.error('❌ Order webhook error:', error);
    
    // 에러가 발생해도 200을 반환 (카페24가 재시도하지 않도록)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: (error as Error).message 
      },
      { status: 200 } // 카페24 재시도 방지
    );
  }
}

/**
 * GET /api/webhooks/order
 * Webhook 엔드포인트 확인용 (카페24 검증)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: 'Review2Earn Webhook',
    endpoint: 'order',
    status: 'active',
    version: '1.0.0',
    note: 'Reward rates are dynamically loaded from database'
  });
}