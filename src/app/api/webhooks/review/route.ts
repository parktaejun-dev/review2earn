// src/app/api/webhooks/review/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

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
    console.log('📥 Review Webhook received:', JSON.stringify(body, null, 2))

    // Webhook 데이터 검증
    if (body.event !== 'board.product.created') {
      return NextResponse.json(
        { success: false, error: 'Invalid event type' },
        { status: 400 }
      )
    }

    // mallId 추출 (v5.2: resource에서 가져옴)
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

    // 🆕 v5.2: MallSettings 확인 (Consent 제거됨)
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

    // 🆕 v5.2: Cafe24 API로 고객 이메일 조회 (상세 로그 포함)
    let memberEmail: string | null = null
    
    console.log('🔍 Checking accessToken:', {
      hasToken: !!mallSettings.accessToken,
      tokenLength: mallSettings.accessToken?.length,
      tokenPreview: mallSettings.accessToken?.substring(0, 10) + '***',
      tokenExpiresAt: mallSettings.tokenExpiresAt,
    })
    
    if (mallSettings.accessToken) {
      try {
        const apiUrl = `https://${mallId}.cafe24api.com/api/v2/admin/customers/${member_id}`
        console.log('🌐 Calling Cafe24 API:', apiUrl)
        
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${mallSettings.accessToken}`,
            'Content-Type': 'application/json',
            'X-Cafe24-Api-Version': '2025-09-01',
          },
        })

        console.log('📡 Cafe24 API response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('📦 Cafe24 API response data:', JSON.stringify(data, null, 2))
          
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
            statusText: response.statusText,
            error: errorText,
          })
        }
      } catch (error) {
        console.error('⚠️ Failed to get customer email:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        })
      }
    } else {
      console.warn('⚠️ No accessToken available for mall:', mallId)
    }
    
    // 🆕 이메일이 없으면 임시 이메일 생성
    if (!memberEmail) {
      memberEmail = `${member_id}@${mallId}.temp`
      console.log('⚠️ Using temporary email:', memberEmail)
    }

    // 추천 코드 생성 (기존 로직 유지)
    const referralCode = generateReferralCode(member_id, product_no, board_no)

    // 리뷰 저장 (upsert 유지)
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
        memberEmail, // 🆕 v5.2
        participateR2e: true,
        updatedAt: new Date(),
      },
      create: {
        cafe24BoardNo: board_no,
        productNo: product_no,
        memberId: member_id,
        memberEmail, // 🆕 v5.2
        mallId,
        content: content || null,
        rating: rating || null,
        referralCode,
        participateR2e: true,
      },
    })

    console.log('✅ Review saved:', {
      id: review.id,
      referralCode: review.referralCode,
      memberEmail: review.memberEmail,
    })

    // 🆕 v5.2: R2E 계정 생성 및 연동
    if (memberEmail) {
      let r2eAccount = await prisma.r2EAccount.findUnique({
        where: { email: memberEmail },
      })

      if (!r2eAccount) {
        // 첫 리뷰 작성자 - 계정 생성
        r2eAccount = await prisma.r2EAccount.create({
          data: {
            email: memberEmail,
            totalPoints: 0,
            availablePoints: 0,
            consentMarketing: false,
            consentDataSharing: false,
          },
        })
        console.log('✅ R2E account created:', memberEmail)

        // TODO: 계정 활성화 이메일 발송
        console.log('📧 TODO: Send activation email to', memberEmail)
      } else {
        console.log('ℹ️ R2E account already exists:', memberEmail)
      }

      // 리뷰에 R2E 계정 연결
      await prisma.review.update({
        where: { id: review.id },
        data: { r2eUserId: r2eAccount.id },
      })
      
      console.log('🔗 Review linked to R2E account:', {
        reviewId: review.id,
        r2eAccountId: r2eAccount.id,
      })
    }

    // 추천 링크 생성 (기존 로직 유지)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://review2earn.vercel.app'
    const referralLink = `${baseUrl}/product/${product_no}?ref=${referralCode}`

    return NextResponse.json({
      success: true,
      data: {
        reviewId: review.id,
        referralCode: review.referralCode,
        referralLink,
        r2eAccountLinked: !!memberEmail && !memberEmail.includes('.temp'),
        message: 'Review registered successfully for Review2Earn program',
      },
    })

  } catch (error) {
    console.error('❌ Review webhook error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    
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
    version: 'v5.2',
    timestamp: new Date().toISOString(),
  })
}

// 추천 코드 생성 함수 (기존 로직 유지)
function generateReferralCode(
  memberId: string,
  productNo: number,
  boardNo: number
): string {
  const timestamp = Date.now()
  const data = `${memberId}-${productNo}-${boardNo}-${timestamp}`
  const hash = crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
    .substring(0, 12)
    .toUpperCase()
  
  return `R2E${hash}`
}
