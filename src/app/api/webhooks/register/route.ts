// src/app/api/webhooks/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { mallId } = await request.json();

    if (!mallId) {
      return NextResponse.json(
        { error: 'Missing mallId' },
        { status: 400 }
      );
    }

    // MallSettings에서 accessToken 조회
    const mallSettings = await prisma.mallSettings.findUnique({
      where: { mallId },
    });

    if (!mallSettings) {
      return NextResponse.json(
        { error: 'Mall not found' },
        { status: 404 }
      );
    }

    // ============================================
    // Cafe24 Webhook 자동 등록 API (선택)
    // ============================================
    const webhooks = [
      {
        event: 'board.product.created',
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/review`,
      },
      {
        event: 'order.created',
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/order`,
      },
      {
        event: 'app.uninstalled',
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/uninstall`,
      },
    ];

    console.log('✅ [Webhook Register] Webhooks should be registered manually:', webhooks);

    return NextResponse.json({
      success: true,
      message: 'Please register webhooks manually in Cafe24 Developer Center',
      webhooks,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [Webhook Register] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
