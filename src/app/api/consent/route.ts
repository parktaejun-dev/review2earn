// src/app/api/consent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId, mallId, consented } = body;

    console.log('📝 Consent API called:', { memberId, mallId, consented });

    // 필수 필드 검증
    if (!memberId || !mallId) {
      return NextResponse.json(
        {
          success: false,
          error: 'memberId and mallId are required',
        },
        { status: 400 }
      );
    }

    // IP와 User-Agent 수집
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Consent 저장 (upsert)
    const consent = await prisma.consent.upsert({
      where: {
        memberId_mallId: {
          memberId,
          mallId,
        },
      },
      update: {
        consented,
        consentedAt: consented ? new Date() : null,
        ipAddress,
        userAgent,
        updatedAt: new Date(),
      },
      create: {
        memberId,
        mallId,
        consented,
        consentedAt: consented ? new Date() : null,
        ipAddress,
        userAgent,
      },
    });

    console.log('✅ Consent saved:', consent.id);

    return NextResponse.json({
      success: true,
      data: {
        id: consent.id,
        memberId: consent.memberId,
        mallId: consent.mallId,
        consented: consent.consented,
        consentedAt: consent.consentedAt,
      },
    });

  } catch (error) {
    console.error('❌ Consent API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save consent',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET: 동의 상태 조회
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const memberId = url.searchParams.get('member_id');
    const mallId = url.searchParams.get('mall_id');

    if (!memberId || !mallId) {
      return NextResponse.json(
        {
          success: false,
          error: 'member_id and mall_id are required',
        },
        { status: 400 }
      );
    }

    const consent = await prisma.consent.findUnique({
      where: {
        memberId_mallId: {
          memberId,
          mallId,
        },
      },
    });

    if (!consent) {
      return NextResponse.json({
        success: true,
        data: {
          consented: false,
          consentedAt: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        consented: consent.consented,
        consentedAt: consent.consentedAt,
      },
    });

  } catch (error) {
    console.error('❌ Consent GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch consent',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
