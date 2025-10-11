import { CAFE24_CONFIG } from "@/lib/cafe24-config";
import { prisma } from "@/lib/prisma";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { mallId } = await request.json();

    if (!mallId) {
      return NextResponse.json(
        { error: 'mallId is required' },
        { status: 400 }
      );
    }

    const store = await prisma.mallSettings.findUnique({
      where: { mallId },
    });

    if (!store || !store.accessToken) {
      return NextResponse.json(
        { error: 'Store not found or not authenticated' },
        { status: 404 }
      );
    }

    console.log('✅ Store found:', mallId);

    const widgetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/widget.js`;
    
    console.log('🔗 Widget URL:', widgetUrl);

    const response = await fetch(
      `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${store.accessToken}`,
          'Content-Type': 'application/json',
          'X-Cafe24-Api-Version': CAFE24_CONFIG.API_VERSION,
        },
        body: JSON.stringify({
          request: {
            shop_no: parseInt(process.env.DEFAULT_SHOP_NO || "1"),
            src: widgetUrl,
            display_location: ['PRODUCT_DETAIL'],  // ✅ 수정됨!
            exclude_path: [],
            skin_no: [parseInt(process.env.DEFAULT_SKIN_NO || "1")],
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ ScriptTag registration failed:', data);
      return NextResponse.json(
        { error: 'ScriptTag registration failed', details: data },
        { status: response.status }
      );
    }

    console.log('✅ ScriptTag registered:', data);

    if (data.scripttag && data.scripttag.script_no) {
      await prisma.mallSettings.update({
        where: { mallId },
        data: {
          scriptTagNo: parseInt(data.scripttag.script_no),  // ✅ parseInt 추가!
        },
      });
      console.log('✅ ScriptTag number saved:', data.scripttag.script_no);
    }

    return NextResponse.json({
      success: true,
      scriptTag: data.scripttag,
      widgetUrl,
    });

  } catch (error) {
    console.error('❌ ScriptTag registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
