// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mallId = searchParams.get('mall_id')

    if (!mallId) {
      return NextResponse.json(
        { success: false, error: 'mall_id required' },
        { status: 400 }
      )
    }

    // 병렬 쿼리로 성능 최적화
    const [
      productsCount,
      reviewsCount,
      r2eAccountsCount,
      totalPoints,
      pendingWithdrawals,
      recentTransactions,
    ] = await Promise.all([
      // 상품 수 (API 호출 필요 - 임시로 0)
      Promise.resolve(0),
      
      // 총 리뷰 수
      prisma.review.count({
        where: { mallId },
      }),
      
      // R2E 회원 수
      prisma.r2EAccount.count(),
      
      // 총 적립금
      prisma.r2EAccount.aggregate({
        _sum: { totalPoints: true },
      }),
      
      // 대기 중인 출금
      prisma.withdrawalRequest.count({
        where: { status: 'PENDING' },
      }),
      
      // 최근 거래 (최근 5개)
      prisma.r2ETransaction.findMany({
        where: { mallId },
        orderBy: { earnedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          earnedAt: true,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        mallId,
        products_count: productsCount,
        total_reviews: reviewsCount,
        total_r2e_accounts: r2eAccountsCount,
        total_r2e_points: totalPoints._sum.totalPoints || 0,
        pending_withdrawals: pendingWithdrawals,
        recent_transactions: recentTransactions,
      },
    })

  } catch (error) {
    console.error('❌ Stats error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
