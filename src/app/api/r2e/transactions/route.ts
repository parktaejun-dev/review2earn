// src/app/api/r2e/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId required' },
        { status: 400 }
      )
    }

    // 거래 내역 조회
    const transactions = await prisma.r2ETransaction.findMany({
      where: { r2eUserId: userId },
      orderBy: { earnedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        review: {
          select: {
            productNo: true,
            mallId: true,
          },
        },
      },
    })

    // 총 개수
    const total = await prisma.r2ETransaction.count({
      where: { r2eUserId: userId },
    })

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    })

  } catch (error) {
    console.error('❌ R2E transactions error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
