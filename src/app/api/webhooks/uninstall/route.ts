// src/app/api/webhooks/uninstall/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const mallId = body.mall_id

    console.log('🗑️ [Uninstall Webhook] Received:', { mallId, body })

    if (!mallId) {
      console.error('❌ [Uninstall Webhook] Missing mall_id')
      return NextResponse.json({ error: 'Missing mall_id' }, { status: 400 })
    }

    // ============================================
    // 1. DB에서 쇼핑몰 정보 가져오기
    // ============================================
    const mallSettings = await prisma.mallSettings.findUnique({
      where: { mallId },
    })

    if (!mallSettings) {
      console.log('⚠️ [Uninstall Webhook] Mall not found:', mallId)
      return NextResponse.json({ message: 'Mall not found' }, { status: 404 })
    }

    // ============================================
    // 2. ScriptTag 삭제
    // ============================================
    if (mallSettings.scriptTagNo && mallSettings.accessToken) {
      try {
        const scriptTagResponse = await fetch(
          `https://${mallId}.cafe24api.com/api/v2/admin/scripttags/${mallSettings.scriptTagNo}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${mallSettings.accessToken}`,
              'X-Cafe24-Api-Version': '2024-03-01',
            },
          }
        )

        if (scriptTagResponse.ok) {
          console.log('✅ [Uninstall Webhook] ScriptTag 삭제 완료:', mallSettings.scriptTagNo)
        } else {
          const errorText = await scriptTagResponse.text()
          console.error('⚠️ [Uninstall Webhook] ScriptTag 삭제 실패:', errorText)
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('⚠️ [Uninstall Webhook] ScriptTag 삭제 에러:', errorMessage)
      }
    } else {
      console.log('ℹ️ [Uninstall Webhook] No ScriptTag to delete')
    }

    // ============================================
    // 3. DB에서 쇼핑몰 정보 비활성화
    // ============================================
    await prisma.mallSettings.update({
      where: { mallId },
      data: {
        isActive: false,
        scriptTagNo: null,
        updatedAt: new Date(),
      },
    })

    console.log('✅ [Uninstall Webhook] 앱 제거 처리 완료:', mallId)

    return NextResponse.json({
      success: true,
      message: 'App uninstalled successfully',
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [Uninstall Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}
