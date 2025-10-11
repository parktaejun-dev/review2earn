// 📂 src/app/api/review/reward/route.ts
// Review2Earn v6.0 - 리뷰 보상 API (동적 계산)

import { NextRequest, NextResponse } from 'next/server';
import { calculateReward } from '@/lib/reward-calculator';

export async function POST(request: NextRequest) {
    try {
        const reviewData = await request.json();
        
        // 리뷰 데이터 검증
        if (!reviewData.content || reviewData.content.length < 10) {
            return NextResponse.json({
                success: false,
                message: '리뷰를 10자 이상 작성해주세요'
            }, { status: 400 });
        }

        // ✅ 필수 파라미터 검증
        if (!reviewData.mallId || !reviewData.orderAmount) {
            return NextResponse.json({
                success: false,
                message: 'mallId와 주문금액이 필요합니다'
            }, { status: 400 });
        }

        // ✅ DB에서 동적으로 보상 계산
        const reward = await calculateReward({
            mallId: reviewData.mallId,
            productNo: reviewData.productId ? parseInt(reviewData.productId) : undefined,
            orderAmount: parseInt(reviewData.orderAmount),
        });

        // ✅ 동적으로 계산된 쿠폰 발급
        const coupon = {
            coupon_code: `R2E${Date.now()}`,
            discount_amount: reward.buyerDiscountAmount,  // ✅ 동적 계산
            discount_type: 'amount',
            discount_rate: reward.buyerDiscountRate,      // ✅ 비율 정보 추가
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        // 리뷰 데이터 로깅 (개발용)
        console.log('🎯 리뷰투언: 리뷰 데이터 수신:', {
            content: reviewData.content?.substring(0, 50) + '...',
            productId: reviewData.productId,
            userId: reviewData.userId,
            mallId: reviewData.mallId,
            orderAmount: reviewData.orderAmount,
            calculatedReward: reward.buyerDiscountAmount,
            timestamp: reviewData.timestamp
        });

        return NextResponse.json({
            success: true,
            message: '쿠폰이 성공적으로 발급되었습니다',
            coupon: coupon,
            reward: {
                reviewerAmount: reward.reviewerAmount,
                buyerDiscountAmount: reward.buyerDiscountAmount,
                platformFee: reward.platformFee,
            }
        });

    } catch (error) {
        console.error('❌ Review reward API error:', error);
        
        return NextResponse.json({
            success: false,
            message: '처리 중 오류가 발생했습니다',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
