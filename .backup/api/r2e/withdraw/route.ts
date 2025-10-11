// src/app/api/r2e/withdraw/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, bankName, accountNumber, accountHolder } = body

    // 필수 필드 검증
    if (!userId || !amount || !bankName || !accountNumber || !accountHolder) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 최소 출금 금액 확인 (10,000원)
    if (amount < 10000) {
      return NextResponse.json(
        { success: false, error: 'Minimum withdrawal amount is 10,000 KRW' },
        { status: 400 }
      )
    }

    // R2E 계정 조회
    const account = await prisma.r2EAccount.findUnique({
      where: { id: userId },
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    // 잔액 확인
    if (account.availablePoints < amount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // 출금 요청 생성
    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        r2eUserId: userId,
        amount,
        bankName,
        accountNumber,
        accountHolder,
        status: 'PENDING',
      },
    })

    // R2E 계정 잔액 차감
    await prisma.r2EAccount.update({
      where: { id: userId },
      data: {
        availablePoints: { decrement: amount },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        withdrawalId: withdrawal.id,
        amount,
        status: withdrawal.status,
        requestedAt: withdrawal.requestedAt,
        message: 'Withdrawal request submitted successfully',
      },
    })

  } catch (error) {
    console.error('❌ Withdrawal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process withdrawal',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
