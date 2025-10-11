// 📂 src/lib/reward-calculator.ts
// Review2Earn v6.0 - Reward Calculator
// 기획서 v6.0 기준: 주문금액의 비율로 보상 계산

import { prisma } from './prisma';

export interface RewardResult {
  reviewerAmount: number;      // 리뷰어 보상 (원)
  buyerDiscountAmount: number; // 구매자 할인 (원)
  platformFee: number;         // 플랫폼 수수료 (원)
  reviewerRate: number;        // 리뷰어 보상율
  buyerDiscountRate: number;   // 구매자 할인율
  platformFeeRate: number;     // 플랫폼 수수료율
}

/**
 * ✅ v6.0: 주문금액 기반 보상 계산
 * 
 * 우선순위:
 * 1. 상품별 설정 (ProductRewardRate)
 * 2. 쇼핑몰 설정 (MallSettings)
 * 3. 기본값 (환경변수)
 */
export async function calculateReward(params: {
  mallId: string;
  productNo?: number;
  orderAmount: number;
}): Promise<RewardResult> {
  const { mallId, productNo, orderAmount } = params;

  // 1. 상품별 커스텀 요율 확인
  if (productNo) {
    const productRate = await prisma.productRewardRate.findUnique({
      where: {
        mallId_productId: {
          mallId,
          productId: String(productNo),
        },
      },
    });

    if (productRate?.isActive) {
      return {
        reviewerAmount: Math.floor(orderAmount * productRate.reviewerRewardRate),
        buyerDiscountAmount: Math.floor(orderAmount * productRate.buyerDiscountRate),
        platformFee: Math.floor(orderAmount * productRate.platformFeeRate),
        reviewerRate: productRate.reviewerRewardRate,
        buyerDiscountRate: productRate.buyerDiscountRate,
        platformFeeRate: productRate.platformFeeRate,
      };
    }
  }

  // 2. 쇼핑몰 기본 요율 확인
  const mallSettings = await prisma.mallSettings.findUnique({
    where: { mallId },
  });

  if (mallSettings) {
    return {
      reviewerAmount: Math.floor(orderAmount * mallSettings.reviewerRewardRate),
      buyerDiscountAmount: Math.floor(orderAmount * mallSettings.buyerDiscountRate),
      platformFee: Math.floor(orderAmount * mallSettings.platformFeeRate),
      reviewerRate: mallSettings.reviewerRewardRate,
      buyerDiscountRate: mallSettings.buyerDiscountRate,
      platformFeeRate: mallSettings.platformFeeRate,
    };
  }

  // 3. 기본값 사용
  const defaultReviewerRate = parseFloat(process.env.DEFAULT_REVIEWER_RATE || '0.01');
  const defaultBuyerRate = parseFloat(process.env.DEFAULT_BUYER_DISCOUNT_RATE || '0.01');
  const defaultPlatformRate = parseFloat(process.env.DEFAULT_PLATFORM_FEE_RATE || '0.005');

  return {
    reviewerAmount: Math.floor(orderAmount * defaultReviewerRate),
    buyerDiscountAmount: Math.floor(orderAmount * defaultBuyerRate),
    platformFee: Math.floor(orderAmount * defaultPlatformRate),
    reviewerRate: defaultReviewerRate,
    buyerDiscountRate: defaultBuyerRate,
    platformFeeRate: defaultPlatformRate,
  };
}
