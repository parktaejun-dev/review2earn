// src/app/api/scripttags/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // ✅ localStorage 제거, 쿠키에서만 가져오기
    const cookieMallId = request.cookies.get('cafe24_mall_id')?.value
    
    if (!cookieMallId) {
      return NextResponse.json({
        success: false,
        installed: false,
        message: '⚠️ 쇼핑몰 ID를 찾을 수 없습니다.'
      })
    }

    console.log('🔍 Checking script status for:', cookieMallId)

    // DB에서 스크립트 설치 상태 확인 (임시로 false 반환)
    const scriptInstalled = false // TODO: DB 체크

    return NextResponse.json({
      success: true,
      installed: scriptInstalled,
      message: scriptInstalled 
        ? '✅ 리뷰투언 스크립트가 설치되어 있습니다.' 
        : '⚠️ 스크립트가 설치되지 않았습니다. 아래 버튼을 눌러 설치하세요.'
    })
  } catch (error) {
    console.error('❌ Script status check error:', error)
    return NextResponse.json({
      success: false,
      installed: false,
      message: '스크립트 상태 확인 중 오류 발생'
    }, { status: 500 })
  }
}
