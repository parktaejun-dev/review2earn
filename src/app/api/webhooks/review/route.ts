// src/app/api/webhooks/review/route.ts
// 카페24 리뷰 작성 Webhook: 리뷰가 작성되면 추천 코드를 생성합니다
import { NextRequest, NextResponse } from 'next/server';
import { saveReview, checkConsent } from '@/lib/db';
import { nanoid } from 'nanoid';


/**
 * POST /api/webhooks/review
 * 카페24에서 리뷰가 작성되면 자동으로 호출됩니다
 * 
 * Webhook Body (카페24에서 전송):
 * {
 *   event_no: number,
 *   resource: {
 *     mall_id: string,
 *     event: "created",
 *     board_no: number,
 *     product_no: number,
 *     member_id: string,
 *     article_no: number
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🎯 Review Webhook received:', {
      event_no: body.event_no,
      mall_id: body.resource?.mall_id,
      event: body.resource?.event,
      product_no: body.resource?.product_no,
      member_id: body.resource?.member_id,
      article_no: body.resource?.article_no
    });


    // Webhook 데이터 검증
    if (!body.resource || body.resource.event !== 'created') {
      console.log('⚠️ Skipping non-created event:', body.resource?.event);
      return NextResponse.json({ 
        success: true, 
        message: 'Event ignored (not a creation event)' 
      });
    }


    const { mall_id, product_no, member_id, article_no } = body.resource;


    // 필수 파라미터 검증
    if (!mall_id || !product_no || !member_id || !article_no) {
      console.error('❌ Missing required webhook parameters:', {
        mall_id,
        product_no,
        member_id,
        article_no
      });
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }


    // 회원의 참여 동의 확인
    const hasConsented = await checkConsent(mall_id, member_id);
    
    if (!hasConsented) {
      console.log('⚠️ Member has not consented:', { mall_id, member_id });
      return NextResponse.json({
        success: true,
        message: 'Member has not opted in to the program',
        consented: false
      });
    }


    console.log('✅ Member has consented:', { mall_id, member_id });


    // 추천 코드 생성 (10자리, URL-safe)
    const referralCode = nanoid(10);


    // 리뷰 정보를 데이터베이스에 저장
    const review = await saveReview({
      mall_id,
      review_id: article_no.toString(),
      product_no,
      member_id,
      referral_code: referralCode 
    });


    console.log('✅ Review saved with referral code:', {
      id: review.id,
      mall_id: review.mall_id,
      review_id: review.review_id,
      product_no: review.product_no,
      member_id: review.member_id,
      referral_code: review.referral_code,
      created_at: review.created_at
    });


    // 카페24에 200 OK 응답 (반드시 24시간 내에 응답해야 함)
    return NextResponse.json({
      success: true,
      data: {
        review_id: review.review_id,
        referral_code: review.referral_code,
        product_no: review.product_no,
        member_id: review.member_id,
      }
    });


  } catch (error) {
    console.error('❌ Review webhook error:', error);
    
    // 에러가 발생해도 200을 반환 (카페24가 재시도하지 않도록)
    // 프로덕션에서는 에러 로깅 시스템에 기록해야 합니다
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
 * GET /api/webhooks/review
 * Webhook 엔드포인트 확인용 (카페24 검증)
 */
export async function GET() {
  return NextResponse.json({
    service: 'Review2Earn Webhook',
    endpoint: 'review',
    status: 'active',
    version: '1.0.0'
  });
}
