// 리뷰 보상 API 엔드포인트
import { NextRequest, NextResponse } from 'next/server';

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

        // TODO: 실제 쿠폰 발급 로직 구현 예정
        // 현재는 Mock 데이터 반환
        const mockCoupon = {
            coupon_code: `R2E${Date.now()}`,
            discount_amount: 5000,
            discount_type: 'amount',
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        // 리뷰 데이터 로깅 (개발용)
        console.log('🎯 리뷰투언: 리뷰 데이터 수신:', {
            content: reviewData.content?.substring(0, 50) + '...',
            productId: reviewData.productId,
            userId: reviewData.userId,
            timestamp: reviewData.timestamp
        });

        return NextResponse.json({
            success: true,
            message: '쿠폰이 성공적으로 발급되었습니다',
            coupon: mockCoupon
        });

    } catch (error) {
        console.error('Review reward API error:', error);
        
        return NextResponse.json({
            success: false,
            message: '처리 중 오류가 발생했습니다'
        }, { status: 500 });
    }
}
