import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }  // ← Promise 추가
) {
  try {
    const { memberId } = await params;  // ← await 추가
    const { searchParams } = new URL(request.url);
    const mallId = searchParams.get('mallId') || 'dhdshop';

    console.log('🔍 Dashboard API Called:', { memberId, mallId });

    // 1. 사용자 리뷰 목록 조회
    const reviews = await prisma.review.findMany({
      where: {
        memberId,
        mallId,
      },
      include: {
        transactions: {
          select: {
            id: true,
            cafe24OrderId: true,  // ← orderId → cafe24OrderId
            orderAmount: true,
            rewardAmount: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('📊 Reviews Found:', reviews.length);

    // 2. 통계 계산
    const stats = {
      totalReviews: reviews.length,
      totalClicks: reviews.reduce((sum, r) => sum + r.clickCount, 0),
      totalConversions: reviews.reduce((sum, r) => sum + r.conversionCount, 0),
      totalRevenue: reviews.reduce((sum, r) => sum + Number(r.totalRevenue), 0),
      pendingReward: reviews.reduce(
        (sum, r) =>
          sum +
          r.transactions
            .filter((t) => t.status === 'pending')
            .reduce((s, t) => s + Number(t.rewardAmount), 0),
        0
      ),
      completedReward: reviews.reduce(
        (sum, r) =>
          sum +
          r.transactions
            .filter((t) => t.status === 'completed')
            .reduce((s, t) => s + Number(t.rewardAmount), 0),
        0
      ),
    };

    // 3. 최근 거래 내역
    const recentTransactions = reviews
      .flatMap((r) =>
        r.transactions.map((t) => ({
          ...t,
          reviewId: r.id,
          referralCode: r.referralCode,
          orderId: t.cafe24OrderId,  // ← 추가: UI에서 orderId로 표시
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        reviews: reviews.map((r) => ({
          id: r.id,
          referralCode: r.referralCode,
          referralLink: `https://review2earn.vercel.app/product/${r.productNo}?ref=${r.referralCode}`,
          productNo: r.productNo,
          clickCount: r.clickCount,
          conversionCount: r.conversionCount,
          totalRevenue: Number(r.totalRevenue),
          createdAt: r.createdAt,
        })),
        recentTransactions,
      },
    });
  } catch (error) {
    console.error('❌ Dashboard API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard data',
      },
      { status: 500 }
    );
  }
}
