// app/api/cafe24/scripttags/register/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { mallId } = await request.json();

    if (!mallId) {
      return NextResponse.json(
        { error: 'mallId is required' },
        { status: 400 }
      );
    }

    // ✅ 올바른 모델 이름: MallSettings
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

    // ScriptTag 등록
    const scriptTagUrl = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    
    const response = await fetch(scriptTagUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${store.accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2024-03-01',
      },
      body: JSON.stringify({
        request: {
          shop_no: 1,
          src: 'https://review2earn.vercel.app/widget.js',
          display_location: ['FRONT_PRODUCT_DETAIL'],
          exclude_path: [],
          skin_no: [1],
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ ScriptTag registration failed:', data);
      return NextResponse.json(
        { error: 'ScriptTag registration failed', details: data },
        { status: response.status }
      );
    }

    console.log('✅ ScriptTag registered:', data);

    // ✅ scriptTagNo 저장
    if (data.scripttag && data.scripttag.script_no) {
      await prisma.mallSettings.update({
        where: { mallId },
        data: {
          scriptTagNo: data.scripttag.script_no,
        },
      });
      console.log('✅ ScriptTag number saved:', data.scripttag.script_no);
    }

    return NextResponse.json({
      success: true,
      scriptTag: data.scripttag,
    });

  } catch (error: any) {
    console.error('❌ ScriptTag registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
