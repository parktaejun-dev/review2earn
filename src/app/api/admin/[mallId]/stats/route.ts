import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mallId: string }> }
) {
  try {
    // ✅ params를 await으로 처리
    const { mallId } = await params;

    const totalReviews = await prisma.review.count({
      where: { mallId },
    });

    const totalOrders = await prisma.transaction.count({
      where: { mallId },
    });

    const totalMembers = await prisma.r2EMallLink.count({
      where: { mallId },
    });

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

  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
