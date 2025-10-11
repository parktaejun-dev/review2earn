// src/app/api/reward-rate/route.ts (완전 버전)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getValidToken } from '@/lib/refreshToken';

// CORS 헤더 상수
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 기본값 상수
const DEFAULT_REVIEWER_PERCENT = 1.0; // 1%
const DEFAULT_BUYER_PERCENT = 5.0;    // 5%

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const mallId = searchParams.get('mall_id');
    const productId = searchParams.get('product_id');

    console.log(`📊 [Reward Rate] Request: mall=${mallId}, product=${productId}`);

    // 1. 필수 파라미터 검증
    if (!mallId) {
      console.warn('⚠️ [Reward Rate] Missing mall_id');
      return NextResponse.json(
        {
          success: false,
          error: 'mall_id is required',
        },
        {
          status: 400,
          headers: CORS_HEADERS,
        }
      );
    }

    // 2. 쇼핑몰 설정 조회 + 토큰 자동 갱신
    let mallSettings;
    try {
      // ⭐ 토큰 만료 확인 및 자동 갱신
      await getValidToken(mallId);
      
      mallSettings = await prisma.mallSettings.findUnique({
        where: { mallId },
      });
    } catch (tokenError) {
      console.warn(`⚠️ [Reward Rate] Token refresh failed for ${mallId}:`, tokenError);
      // 토큰 갱신 실패해도 기본값으로 폴백
    }

    // 3. Product별 커스텀 비율 확인 (선택적 기능)
    let customRate;
    if (productId && mallSettings) {
      try {
        customRate = await prisma.productRewardRate.findUnique({
          where: {
            mallId_productId: {
              mallId,
              productId,
            },
          },
        });
      } catch (error) {
        console.warn(`⚠️ [Reward Rate] Failed to fetch custom rate for product ${productId}:`, error);
      }
    }

    // 4. 비율 결정 (우선순위: 상품별 > 쇼핑몰별 > 기본값)
    let reviewerPercent: number;
    let buyerPercent: number;
    let source: string;

    if (customRate && customRate.isActive) {
      // 상품별 커스텀 비율
      reviewerPercent = customRate.reviewerRewardRate * 100;
      buyerPercent = customRate.buyerDiscountRate * 100;
      source = 'product';
      console.log(`✅ [Reward Rate] Using product-specific rate: ${reviewerPercent}%, ${buyerPercent}%`);
    } else if (mallSettings && mallSettings.isActive) {
      // 쇼핑몰별 설정
      reviewerPercent = (mallSettings.reviewerRewardRate || 0.01) * 100;
      buyerPercent = (mallSettings.buyerDiscountRate || 0.05) * 100;
      source = 'mall';
      console.log(`✅ [Reward Rate] Using mall settings: ${reviewerPercent}%, ${buyerPercent}%`);
    } else {
      // 기본값
      reviewerPercent = DEFAULT_REVIEWER_PERCENT;
      buyerPercent = DEFAULT_BUYER_PERCENT;
      source = 'default';
      console.log(`ℹ️ [Reward Rate] Using default values: ${reviewerPercent}%, ${buyerPercent}%`);
    }

    // 5. 응답 생성
    const responseData = {
      success: true,
      reviewerPercent: parseFloat(reviewerPercent.toFixed(2)),
      buyerPercent: parseFloat(buyerPercent.toFixed(2)),
      mallId,
      productId: productId || null,
      source,
      timestamp: new Date().toISOString(),
    };

    const duration = Date.now() - startTime;
    console.log(`✅ [Reward Rate] Response sent (${duration}ms):`, responseData);

    return NextResponse.json(responseData, {
      headers: CORS_HEADERS,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [Reward Rate] Error (${duration}ms):`, error);

    // 에러 발생 시에도 기본값으로 폴백 (스크립트가 멈추지 않도록)
    return NextResponse.json(
      {
        success: true,
        reviewerPercent: DEFAULT_REVIEWER_PERCENT,
        buyerPercent: DEFAULT_BUYER_PERCENT,
        mallId: null,
        productId: null,
        source: 'error_fallback',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      {
        status: 200, // ⭐ 200으로 반환 (클라이언트 에러 방지)
        headers: CORS_HEADERS,
      }
    );
  }
}

// ⭐ CORS Preflight 핸들러
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
