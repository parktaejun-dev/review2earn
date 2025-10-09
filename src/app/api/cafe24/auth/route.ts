// src/app/api/cafe24/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mallId = searchParams.get('mall_id');

  if (!mallId) {
    console.error('❌ [OAuth] mall_id is required');
    return NextResponse.json(
      { error: 'mall_id parameter is required' },
      { status: 400 }
    );
  }

  console.log(`🔐 [OAuth] Starting auth flow for ${mallId}`);

  const authUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/authorize`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.CAFE24_CLIENT_ID!,
    state: mallId,
    redirect_uri: process.env.CAFE24_REDIRECT_URI!,
    scope: 'mall.read_product,mall.write_design,mall.read_store,mall.read_order,mall.write_community', // ✅ 수정!
  });

  const fullAuthUrl = `${authUrl}?${params.toString()}`;
  
  console.log(`✅ [OAuth] Redirecting to: ${fullAuthUrl}`);

  return NextResponse.redirect(fullAuthUrl);
}
