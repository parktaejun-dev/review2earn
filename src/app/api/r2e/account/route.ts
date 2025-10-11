// src/app/api/r2e/account/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ✅ GET: R2E 계정 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const userId = searchParams.get('userId')

    if (!email && !userId) {
      return NextResponse.json(
        { success: false, error: 'Email or userId required' },
        { status: 400 }
      )
    }

    // R2E 계정 조회
    const account = await prisma.r2EAccount.findUnique({
      where: email ? { email } : { id: userId! },
      include: {
        r2eTransactions: {
          where: { status: 'COMPLETED' },
          orderBy: { earnedAt: 'desc' },
          take: 10,
        },
        withdrawalRequests: {
          orderBy: { requestedAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: account.id,
        email: account.email,
        totalPoints: account.totalPoints,
        availablePoints: account.availablePoints,
        createdAt: account.createdAt,
        recentTransactions: account.r2eTransactions,
        recentWithdrawals: account.withdrawalRequests,
      },
    })

  } catch (error) {
    console.error('❌ R2E account error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch R2E account',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
