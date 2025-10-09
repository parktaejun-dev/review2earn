// src/app/api/cafe24/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth 인증 시작 엔드포인트
 * 사용자를 카페24 OAuth 페이지로 리다이렉트
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mallId = searchParams.get('mall_id') || 'dhdshop';

  console.log(`🔐 [OAuth] Starting auth flow for ${mallId}`);

  const authUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/authorize`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.CAFE24_CLIENT_ID!,
    state: mallId, // mallId를 state로 전달
    redirect_uri: process.env.CAFE24_REDIRECT_URI!,
    scope: 'read_product,write_scripttags,read_store',
  });

  const fullAuthUrl = `${authUrl}?${params.toString()}`;
  
  console.log(`✅ [OAuth] Redirecting to: ${fullAuthUrl}`);

  return NextResponse.redirect(fullAuthUrl);
}
