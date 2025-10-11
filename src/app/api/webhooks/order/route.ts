// src/app/api/webhooks/order/route.ts
// v5.2 완전 수정판 - TypeScript 에러 해결
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ✅ 타입 정의 추가
interface R2ETransactionResult {
  id: string
  amount: number
  type: string
  status: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📦 Order Webhook received:', JSON.stringify(body, null, 2))

    const resource = body.resource
    const mallId = body.mall_id || body.resource?.mall_id || 'dhdshop'

    if (!resource) {
      return NextResponse.json(
        { success: false, error: 'Missing resource data' },
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

    // 1. Referer에서 추천 코드 추출
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

    // 2. 리뷰 찾기 (r2eUser 포함)
    const review = await prisma.review.findUnique({
      where: {
        referralCode_mallId: {
          referralCode,
          mallId,
        },
      },
      include: {
        mall: true,
        r2eUser: true,
      },
    })

    if (!review) {
      console.log('❌ Review not found for referral code:', referralCode)
      return NextResponse.json({
        success: false,
        reason: 'invalid_referral',
        message: 'Invalid referral code',
      })
    }

    if (!review.r2eUser) {
      console.log('❌ R2E user not linked to review:', review.id)
      return NextResponse.json({
        success: false,
        reason: 'no_r2e_account',
        message: 'R2E account not linked to this review',
      })
    }

    console.log('✅ Review found:', {
      reviewId: review.id,
      memberId: review.memberId,
      r2eUserId: review.r2eUser.id,
    })

    // 3. 보상 계산 및 거래 생성
    const r2eTransactions: R2ETransactionResult[] = [] // ✅ 타입 지정
    let totalReward = 0

    // v5.1 수수료율
    const platformFeeRate = 0.0025 // 0.25%
    const reviewerRewardRate = review.mall?.reviewerRewardRate ?? 0.03 // 3%

    for (const item of items) {
      const { product_no, product_price, quantity } = item

      // 리뷰 상품과 주문 상품 매칭 확인
      if (product_no !== review.productNo) {
        console.log(`⚠️ Product mismatch: ${product_no} !== ${review.productNo}`)
        continue
      }

      const itemTotal = parseFloat(product_price) * quantity
      const grossReward = Math.floor(itemTotal * reviewerRewardRate)
      const platformFee = Math.floor(itemTotal * platformFeeRate)
      const netReward = grossReward - platformFee

      console.log('💰 Reward calculation:', {
        itemTotal,
        grossReward,
        platformFee,
        netReward,
      })

      // ✅ R2ETransaction 생성 (모든 필수 필드 포함)
      const transaction = await prisma.r2ETransaction.create({
        data: {
          r2eUserId: review.r2eUser.id,
          reviewId: review.id,
          mallId,
          type: 'REFERRAL_REWARD',
          status: 'COMPLETED',
          amount: netReward,
          description: `주문 ${order_id} 추천 보상 (상품 ${product_no})`,
          relatedOrderId: order_id,
          relatedReviewId: review.id,
          referralCode,
          expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      })

      // ✅ 타입 안전하게 push
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

    // 4. R2E 계정 잔액 업데이트
    await prisma.r2EAccount.update({
      where: { id: review.r2eUser.id },
      data: {
        totalPoints: { increment: totalReward },
        availablePoints: { increment: totalReward },
      },
    })

    // 5. Review 통계 업데이트
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
        r2eUserId: review.r2eUser.id,
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
    version: 'v5.2',
    timestamp: new Date().toISOString(),
  })
}
