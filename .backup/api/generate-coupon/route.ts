// src/app/api/generate-coupon/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, couponData } = body;

    console.log('🎫 쿠폰 생성 요청:', { action, couponData });

    if (action !== 'generateCoupon' || !couponData) {
      return NextResponse.json({
        success: false,
        error: '잘못된 요청 데이터입니다.'
      }, { status: 400 });
    }

    // 쿠폰 데이터 검증
    const requiredFields = ['couponId', 'discountValue', 'mallId'];
    for (const field of requiredFields) {
      if (!couponData[field]) {
        return NextResponse.json({
          success: false,
          error: `필수 필드 누락: ${field}`
        }, { status: 400 });
      }
    }

    // 쿠폰 정보 로깅 (실제 서비스에서는 DB 저장)
    console.log('✅ 쿠폰 생성 완료:', {
      couponId: couponData.couponId,
      discount: `${couponData.discountValue}%`,
      mallId: couponData.mallId,
      validUntil: couponData.validUntil,
      timestamp: new Date().toISOString()
    });

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '쿠폰이 성공적으로 생성되었습니다.',
      couponId: couponData.couponId,
      discountValue: couponData.discountValue,
      status: 'active',
      createdAt: new Date().toISOString(),
      // 실제 서비스에서는 DB에서 조회한 데이터 반환
      analytics: {
        totalCouponsGenerated: Math.floor(Math.random() * 1000) + 500,
        todayGenerated: Math.floor(Math.random() * 50) + 10,
        conversionRate: (Math.random() * 15 + 10).toFixed(1) + '%'
      }
    });

  } catch (error) {
    console.error('❌ 쿠폰 생성 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

// GET 요청으로 쿠폰 통계 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mallId = searchParams.get('mallId');

    return NextResponse.json({
      success: true,
      message: '쿠폰 통계 조회 성공',
      mallId: mallId || 'all',
      statistics: {
        totalCoupons: Math.floor(Math.random() * 10000) + 5000,
        activeCoupons: Math.floor(Math.random() * 1000) + 500,
        usedCoupons: Math.floor(Math.random() * 2000) + 1000,
        conversionRate: (Math.random() * 20 + 15).toFixed(1) + '%',
        averageDiscount: (Math.random() * 10 + 15).toFixed(1) + '%',
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 쿠폰 통계 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '통계 조회 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
