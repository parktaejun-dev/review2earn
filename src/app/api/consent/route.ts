// src/app/api/consent/route.ts
// 리뷰 작성자 참여 동의 저장 API
import { NextRequest, NextResponse } from 'next/server';
import { saveConsent, checkConsent } from '@/lib/db';

/**
 * POST /api/consent
 * 회원의 참여 동의를 저장합니다
 * 
 * Body:
 * {
 *   mall_id: string,
 *   member_id: string,
 *   consented: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mall_id, member_id, consented } = body;

    // 필수 파라미터 검증
    if (!mall_id || !member_id || typeof consented !== 'boolean') {
      console.error('❌ Missing required parameters:', { mall_id, member_id, consented });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: mall_id, member_id, consented' 
        },
        { status: 400 }
      );
    }

    console.log('🎯 Consent request:', {
      mall_id,
      member_id,
      consented,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    // IP 주소 추출
    const ipAddress = 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // User-Agent 추출
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // 데이터베이스에 저장
    const consent = await saveConsent({
      mall_id,
      member_id,
      consented,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    console.log('✅ Consent saved:', {
      id: consent.id,
      mall_id: consent.mall_id,
      member_id: consent.member_id,
      consented: consent.consented,
      created_at: consent.created_at
    });

    return NextResponse.json({
      success: true,
      data: {
        id: consent.id,
        mall_id: consent.mall_id,
        member_id: consent.member_id,
        consented: consent.consented,
        created_at: consent.created_at,
      },
    });

  } catch (error) {
    console.error('❌ Consent API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save consent',
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/consent?mall_id=xxx&member_id=xxx
 * 회원의 동의 여부를 조회합니다
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const mall_id = url.searchParams.get('mall_id');
    const member_id = url.searchParams.get('member_id');

    // 필수 파라미터 검증
    if (!mall_id || !member_id) {
      console.error('❌ Missing query parameters:', { mall_id, member_id });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: mall_id, member_id' 
        },
        { status: 400 }
      );
    }

    console.log('🎯 Consent check request:', { mall_id, member_id });

    // 동의 여부 확인
    const consented = await checkConsent(mall_id, member_id);

    console.log('✅ Consent check result:', { mall_id, member_id, consented });

    return NextResponse.json({
      success: true,
      data: {
        mall_id,
        member_id,
        consented,
      },
    });

  } catch (error) {
    console.error('❌ Consent check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check consent',
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
