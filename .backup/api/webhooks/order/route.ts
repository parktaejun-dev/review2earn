// src/app/api/webhooks/order/route.ts
// v6.0: R2EAccount.referralCode 사용, 멀티몰 지원
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface R2ETransactionResult {
  id: string
  amount: number
  type: string
  status: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📦 [v6.0] Order Webhook received:', JSON.stringify(body, null, 2))

    const resource = body.resource
    const mallId = body.mall_id || body.resource?.mall_id

    if (!resource || !mallId) {
      return NextResponse.json(
        { success: false, error: 'Missing resource or mall_id' },
        { status: 400 }
      )
    }

    const { order_id, items, referer } = resource

    console.log('📝 Order data:', {
      order_id,
      items_count: items?.length,
      referer,
      mallId,
    })

    if (!order_id || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required order fields' },
        { status: 400 }
      )
    }

    // ============================================
    // 1. Referer에서 추천 코드 추출
    // ============================================
    let referralCode: string | null = null

    if (referer) {
      try {
        const url = new URL(referer)
        referralCode = url.searchParams.get('ref')
        console.log('🔗 Referral code from referer:', referralCode)
      } catch (error) {
        console.warn('⚠️ Failed to parse referer URL:', error)
      }
    }

    if (!referralCode) {
      console.log('ℹ️ No referral code found - regular order')
      return NextResponse.json({
        success: true,
        reason: 'no_referral',
        message: 'Order processed without referral',
      })
    }

    // ============================================
    // 2. ✅ v6.0: R2EAccount 직접 조회 (referralCode로)
    // ============================================
    const r2eAccount = await prisma.r2EAccount.findUnique({
      where: { referralCode },
      include: {
        reviews: {
          where: { mallId },
          take: 1, // 최근 리뷰 하나만
        },
      },
    })

    if (!r2eAccount) {
      console.log('❌ R2E account not found for referral code:', referralCode)
      return NextResponse.json({
        success: false,
        reason: 'invalid_referral',
        message: 'Invalid referral code',
      })
    }

    if (!r2eAccount.reviews || r2eAccount.reviews.length === 0) {
      console.log('❌ No reviews found for this R2E account in mall:', mallId)
      return NextResponse.json({
        success: false,
        reason: 'no_reviews',
        message: 'No reviews found for this referral code',
      })
    }

    const review = r2eAccount.reviews[0] // 첫 번째 리뷰 사용

    console.log('✅ R2E account found:', {
      r2eAccountId: r2eAccount.id,
      email: r2eAccount.email,
      referralCode: r2eAccount.referralCode,
      reviewId: review.id,
    })

    // ============================================
    // 3. MallSettings 조회 (수수료율)
    // ============================================
    const mallSettings = await prisma.mallSettings.findUnique({
      where: { mallId },
    })

    if (!mallSettings || !mallSettings.isActive) {
      console.log('❌ Mall is inactive or not found:', mallId)
      return NextResponse.json({
        success: false,
        reason: 'mall_inactive',
        message: 'Mall is not active',
      })
    }

    // ============================================
    // 4. 보상 계산 및 거래 생성
    // ============================================
    const r2eTransactions: R2ETransactionResult[] = []
    let totalReward = 0

    const platformFeeRate = mallSettings.platformFeeRate || 0.0025 // 0.25%
    const reviewerRewardRate = mallSettings.reviewerRewardRate || 0.03 // 3%

    for (const item of items) {
      const { product_no, product_price, quantity } = item

      // ✅ v6.0: 리뷰 상품과 매칭 (선택적)
      // 모든 상품에 대해 보상을 줄 수도 있음
      // if (product_no !== review.productNo) {
      //   console.log(`⚠️ Product mismatch: ${product_no} !== ${review.productNo}`)
      //   continue
      // }

      const itemTotal = parseFloat(product_price) * quantity
      const grossReward = Math.floor(itemTotal * reviewerRewardRate)
      const platformFee = Math.floor(itemTotal * platformFeeRate)
      const netReward = grossReward - platformFee

      console.log('💰 Reward calculation:', {
        product_no,
        itemTotal,
        grossReward,
        platformFee,
        netReward,
      })

      // ✅ v6.0: R2ETransaction 생성
      const transaction = await prisma.r2ETransaction.create({
        data: {
          r2eUserId: r2eAccount.id,
          reviewId: review.id,
          mallId,
          type: 'REFERRAL_REWARD',
          status: 'COMPLETED',
          amount: netReward,
          description: `주문 ${order_id} 추천 보상 (상품 ${product_no})`,
          relatedOrderId: order_id,
          relatedReviewId: review.id,
          referralCode,
          expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90일 유효
        },
      })

      r2eTransactions.push({
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
      })
      totalReward += netReward
    }

    if (r2eTransactions.length === 0) {
      return NextResponse.json({
        success: false,
        reason: 'no_matching_products',
        message: 'No matching products found for this referral',
      })
    }

    // ============================================
    // 5. R2E 계정 잔액 업데이트
    // ============================================
    await prisma.r2EAccount.update({
      where: { id: r2eAccount.id },
      data: {
        totalPoints: { increment: totalReward },
        availablePoints: { increment: totalReward },
      },
    })

    // ============================================
    // 6. Review 통계 업데이트
    // ============================================
    await prisma.review.update({
      where: { id: review.id },
      data: {
        conversionCount: { increment: r2eTransactions.length },
        totalRevenue: { increment: totalReward },
      },
    })

    console.log('✅ Order processed successfully:', {
      transactionCount: r2eTransactions.length,
      totalReward,
      r2eAccountUpdated: true,
      reviewStatsUpdated: true,
    })

    return NextResponse.json({
      success: true,
      data: {
        orderId: order_id,
        reviewId: review.id,
        r2eAccountId: r2eAccount.id,
        referralCode: r2eAccount.referralCode,
        transactionCount: r2eTransactions.length,
        totalReward,
        message: 'R2E referral reward processed successfully',
      },
    })

  } catch (error) {
    console.error('❌ Order webhook error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process order webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Webhook 검증용 GET 엔드포인트
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: 'v6.0',
    timestamp: new Date().toISOString(),
  })
}
