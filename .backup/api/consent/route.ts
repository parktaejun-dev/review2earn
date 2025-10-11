// src/app/api/consent/route.ts
// v5.2: Consent 모델 제거됨 - MallSettings.isActive로 대체
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateReferralCode } from '@/utils/referralCode'  // ✅ 이미 있는 파일


/**
 * POST /api/consent
 * v5.2: Deprecated - Consent는 이제 MallSettings.isActive로 관리됨
 * 하위 호환성을 위해 API는 유지하되, R2EAccount의 동의 필드에 저장
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { memberId, mallId, consented, memberEmail } = body

    console.log('📝 Consent API called (v5.2 compatibility mode):', { 
      memberId, 
      mallId, 
      consented 
    })

    // 필수 필드 검증
    if (!memberId || !mallId) {
      return NextResponse.json(
        {
          success: false,
          error: 'memberId and mallId are required',
        },
        { status: 400 }
      )
    }

    // IP와 User-Agent 수집
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 🆕 v5.2: MallSettings 확인
    const mallSettings = await prisma.mallSettings.findUnique({
      where: { mallId },
    })

    if (!mallSettings) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mall not found',
        },
        { status: 404 }
      )
    }

    if (!mallSettings.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Review2Earn is not active for this mall',
        },
        { status: 403 }
      )
    }

    // 🆕 v5.2: R2EAccount에 동의 정보 저장 (memberEmail이 있는 경우)
    let r2eAccount = null
    if (memberEmail) {
      r2eAccount = await prisma.r2EAccount.upsert({
        where: { email: memberEmail },
        update: {
          consentDataSharing: consented,
          lastLoginAt: new Date(),
        },
        create: {
          email: memberEmail,
          referralCode: generateReferralCode(),  // ← 추가!
          totalPoints: 0,
          availablePoints: 0,
          consentMarketing: false,
          consentDataSharing: consented,
        },
      })

      console.log('✅ Consent saved to R2EAccount:', r2eAccount.id)
    }

    // 🆕 v5.2: NotificationLog에 동의 기록 (법적 증빙)
    await prisma.notificationLog.create({
      data: {
        userId: memberId,
        type: 'ACCOUNT_ACTIVATION',
        channel: 'EMAIL',
        status: 'SENT',
        content: JSON.stringify({
          action: 'consent',
          consented,
          ipAddress,
          userAgent,
          timestamp: new Date().toISOString(),
        }),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        memberId,
        mallId,
        consented,
        consentedAt: new Date(),
        r2eAccountCreated: !!r2eAccount,
      },
      message: 'Consent saved successfully (v5.2 format)',
    })

  } catch (error) {
    console.error('❌ Consent API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save consent',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/consent
 * v5.2: 동의 상태 조회 - MallSettings.isActive 및 R2EAccount.consentDataSharing 확인
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const memberId = url.searchParams.get('member_id')
    const mallId = url.searchParams.get('mall_id')
    const memberEmail = url.searchParams.get('member_email')

    if (!memberId || !mallId) {
      return NextResponse.json(
        {
          success: false,
          error: 'member_id and mall_id are required',
        },
        { status: 400 }
      )
    }

    // 🆕 v5.2: MallSettings 확인
    const mallSettings = await prisma.mallSettings.findUnique({
      where: { mallId },
    })

    if (!mallSettings) {
      return NextResponse.json({
        success: true,
        data: {
          consented: false,
          consentedAt: null,
          reason: 'mall_not_found',
        },
      })
    }

    // 몰이 비활성화된 경우
    if (!mallSettings.isActive) {
      return NextResponse.json({
        success: true,
        data: {
          consented: false,
          consentedAt: null,
          reason: 'mall_inactive',
        },
      })
    }

    // 🆕 v5.2: R2EAccount에서 개인 동의 확인 (이메일이 있는 경우)
    if (memberEmail) {
      const r2eAccount = await prisma.r2EAccount.findUnique({
        where: { email: memberEmail },
      })

      if (r2eAccount) {
        return NextResponse.json({
          success: true,
          data: {
            consented: r2eAccount.consentDataSharing,
            consentedAt: r2eAccount.createdAt,
            r2eAccountExists: true,
          },
        })
      }
    }

    // 기본값: 몰은 활성화되었지만 개인 동의는 없음
    return NextResponse.json({
      success: true,
      data: {
        consented: false,
        consentedAt: null,
        mallActive: mallSettings.isActive,
      },
    })

  } catch (error) {
    console.error('❌ Consent GET error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch consent',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
