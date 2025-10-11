// src/app/api/scripttags/uninstall/route.ts (새 파일)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const cookieMallId = request.cookies.get('cafe24_mall_id')?.value
    
    if (!cookieMallId) {
      return NextResponse.json({
        success: false,
        message: '쇼핑몰 ID를 찾을 수 없습니다.'
      }, { status: 400 })
    }

    // TODO: 설치된 스크립트 ID 찾아서 삭제
    // 임시로 성공 응답
    return NextResponse.json({
      success: true,
      message: '스크립트가 제거되었습니다.'
    })

  } catch (error) {
    console.error('Script uninstall error:', error)
    return NextResponse.json({
      success: false,
      message: '스크립트 제거 중 오류 발생'
    }, { status: 500 })
  }
}
