import { CAFE24_CONFIG } from "@/lib/cafe24-config";
// src/app/api/webhooks/review/route.ts
// v6.0: 회원 전용 (Member Only) - 레퍼럴 코드 시스템
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateReferralCode } from '@/utils/referralCode'

// Cafe24 Webhook 타입 정의
interface ReviewWebhookPayload {
  event_no: number
  resource: {
    mall_id: string
  }
  event: string
  data: {
    board_no: number
    product_no: number
    member_id: string
    writer: string
    content?: string
    rating?: number
    created_date: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ReviewWebhookPayload = await request.json()
    console.log('📥 [v6.0] Review Webhook received:', JSON.stringify(body, null, 2))

    // Webhook 데이터 검증
    if (body.event !== 'board.product.created') {
      return NextResponse.json(
        { success: false, error: 'Invalid event type' },
        { status: 400 }
      )
    }

    // mallId 추출
    const mallId = body.resource?.mall_id
    if (!mallId) {
      return NextResponse.json(
        { success: false, error: 'Missing mall_id' },
        { status: 400 }
      )
    }

    // 리뷰 데이터 추출
    const {
      board_no,
      product_no,
      member_id,
      content,
      rating,
    } = body.data

    console.log('📝 Review data:', {
      board_no,
      product_no,
      member_id,
      mallId,
    })

    // 필수 필드 검증
    if (!board_no || !product_no || !member_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // ============================================
    // 1. MallSettings 확인
    // ============================================
    const mallSettings = await prisma.mallSettings.findUnique({
      where: { mallId },
    })

    if (!mallSettings) {
      console.error('❌ Mall not found:', mallId)
      return NextResponse.json(
        { success: false, error: 'Mall not registered' },
        { status: 404 }
      )
    }

    if (!mallSettings.isActive) {
      console.log('⚠️ Mall is inactive:', mallId)
      return NextResponse.json({
        success: false,
        reason: 'mall_inactive',
        message: 'Review2Earn is currently disabled for this mall',
      })
    }

    // ============================================
    // 2. ✅ v6.0: Cafe24 API로 회원 이메일 조회 (필수)
    // ============================================
    let memberEmail: string | null = null
    
    if (mallSettings.accessToken) {
      try {
        const apiUrl = `https://${mallId}.cafe24api.com/api/v2/admin/customers/${member_id}`
        console.log('🌐 Calling Cafe24 API:', apiUrl)
        
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${mallSettings.accessToken}`,
            'Content-Type': 'application/json',
            'X-Cafe24-Api-Version': CAFE24_CONFIG.API_VERSION,
          },
        })

        if (response.ok) {
          const data = await response.json()
          memberEmail = data.customer?.email || null
          
          if (memberEmail) {
            console.log('✅ Customer email retrieved:', memberEmail)
          } else {
            console.warn('⚠️ No email in Cafe24 response')
          }
        } else {
          const errorText = await response.text()
          console.error('❌ Cafe24 API error:', {
            status: response.status,
            error: errorText,
          })
        }
      } catch (error) {
        console.error('⚠️ Failed to get customer email:', error)
      }
    }
    
    // ✅ v6.0: 이메일 없으면 리뷰 참여 불가 (회원 전용)
    if (!memberEmail) {
      console.log('❌ No email found - Member only policy')
      return NextResponse.json({
        success: false,
        reason: 'member_only',
        message: 'Review2Earn is available for members only. Please sign up first.',
      }, { status: 403 })
    }

    // ============================================
    // 3. ✅ v6.0: R2EAccount 생성 또는 조회 (회원 전용)
    // ============================================
    let r2eAccount = await prisma.r2EAccount.findUnique({
      where: { email: memberEmail },
    })

    if (!r2eAccount) {
      // 첫 리뷰 작성자 - 계정 생성
      const newReferralCode = generateReferralCode() // R2E-XXXXXXXXXXXX
      
      r2eAccount = await prisma.r2EAccount.create({
        data: {
          email: memberEmail,
          referralCode: newReferralCode,
          totalPoints: 0,
          availablePoints: 0,
          consentMarketing: false,
          consentDataSharing: false,
        },
      })
      
      console.log('✅ R2E account created:', {
        email: memberEmail,
        referralCode: newReferralCode,
      })

      // ✅ v6.0: R2EMallLink 생성 (멀티몰 지원)
      await prisma.r2EMallLink.create({
        data: {
          r2eAccountId: r2eAccount.id,
          mallId,
          memberId: member_id,
        },
      })
      console.log('✅ R2EMallLink created:', { r2eAccountId: r2eAccount.id, mallId })

      // TODO: 활성화 이메일 발송
      console.log('📧 TODO: Send activation email to', memberEmail)
    } else {
      console.log('ℹ️ R2E account already exists:', memberEmail)
      
      // ✅ v6.0: R2EMallLink 확인 및 생성
      const existingLink = await prisma.r2EMallLink.findUnique({
        where: {
          r2eAccountId_mallId: {
            r2eAccountId: r2eAccount.id,
            mallId,
          },
        },
      })

      if (!existingLink) {
        await prisma.r2EMallLink.create({
          data: {
            r2eAccountId: r2eAccount.id,
            mallId,
            memberId: member_id,
          },
        })
        console.log('✅ R2EMallLink created for existing account')
      }
    }

    // ============================================
    // 4. ✅ v6.0: 리뷰 저장
    // ============================================
    const review = await prisma.review.upsert({
      where: {
        cafe24BoardNo_mallId: {
          cafe24BoardNo: board_no,
          mallId,
        },
      },
      update: {
        content: content || null,
        rating: rating || null,
        memberEmail,
        participateR2e: true,
        updatedAt: new Date(),
      },
      create: {
        cafe24BoardNo: board_no,
        productNo: product_no,
        memberId: member_id,
        memberEmail,
        mallId,
        content: content || null,
        rating: rating || null,
        referralCode: r2eAccount.referralCode, // R2EAccount 코드 사용
        participateR2e: true,
        r2eUserId: r2eAccount.id,
      },
    })

    console.log('✅ Review saved:', {
      id: review.id,
      referralCode: review.referralCode,
      r2eAccountId: r2eAccount.id,
    })

    // ============================================
    // 5. 추천 링크 생성
    // ============================================
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://review2earn.vercel.app'
    const referralLink = `${baseUrl}/product/${product_no}?ref=${r2eAccount.referralCode}`

    return NextResponse.json({
      success: true,
      data: {
        reviewId: review.id,
        referralCode: r2eAccount.referralCode,
        referralLink,
        r2eAccountId: r2eAccount.id,
        message: 'Review registered successfully for Review2Earn program',
      },
    })

  } catch (error) {
    console.error('❌ Review webhook error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process review webhook',
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
    version: 'v6.0-member-only',
    timestamp: new Date().toISOString(),
  })
}
