// src/app/api/scripttags/install/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const cookieMallId = request.cookies.get('cafe24_mall_id')?.value
    
    if (!cookieMallId) {
      return NextResponse.json({
        success: false,
        message: '쇼핑몰 ID를 찾을 수 없습니다.'
      }, { status: 400 })
    }

    console.log('📦 Installing script for:', cookieMallId)

    // DB에서 access token 가져오기
    const mall = await prisma.mallSettings.findUnique({
      where: { mallId: cookieMallId },
      select: { accessToken: true }
    })

    if (!mall?.accessToken) {
      return NextResponse.json({
        success: false,
        message: 'Access Token을 찾을 수 없습니다. 재연결 해주세요.'
      }, { status: 401 })
    }

    // Cafe24 ScriptTags API 호출
    const scriptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scripts/review2earn.js`
    
    const response = await fetch(
      `https://${cookieMallId}.cafe24api.com/api/v2/admin/scripttags`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mall.accessToken}`,
          'Content-Type': 'application/json',
          'X-Cafe24-Api-Version': '2025-09-01'
        },
        body: JSON.stringify({
          request: {
            shop_no: 1,
            src: scriptUrl,
            display_location: ['ALL'], // ✅ 배열로 유지
            exclude_path: [],
            integrity: null,
            skin_no: [1]
          }
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('❌ ScriptTag install error:', errorData)
      
      return NextResponse.json({
        success: false,
        message: '스크립트 설치 실패: ' + errorData
      }, { status: 500 })
    }

    const data = await response.json()
    console.log('✅ ScriptTag installed:', data)

    return NextResponse.json({
      success: true,
      message: '✅ 스크립트가 성공적으로 설치되었습니다!',
      data
    })

  } catch (error) {
    console.error('❌ Script install error:', error)
    return NextResponse.json({
      success: false,
      message: '스크립트 설치 중 오류 발생'
    }, { status: 500 })
  }
}
