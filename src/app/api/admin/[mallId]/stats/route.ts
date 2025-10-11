import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { mallId: string } }
) {
  try {
    const { mallId } = params;

    // 1. 총 리뷰 수
    const totalReviews = await prisma.review.count({
      where: { mallId },
    });

    // 2. 총 주문 수
    const totalOrders = await prisma.transaction.count({
      where: { mallId },
    });

    // 3. R2E 회원 수
    const totalMembers = await prisma.r2EMallLink.count({
      where: { mallId },
    });

    // 4. 총 적립금
    const totalRewardsResult = await prisma.r2ETransaction.aggregate({
      where: {
        mallId,
        type: 'REFERRAL_REWARD',
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    const totalRewards = totalRewardsResult._sum.amount || 0;

    // 5. 활성 상품 수
    const activeProducts = await prisma.review.groupBy({
      by: ['productNo'],
      where: { mallId },
    });

    return NextResponse.json({
      totalOrders,
      totalReviews,
      totalMembers,
      totalRewards,
      activeProducts: activeProducts.length,
    });

  } catch (error: any) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', message: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
