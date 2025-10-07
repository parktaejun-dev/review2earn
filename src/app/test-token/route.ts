// src/app/api/test-token/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { accessToken, mallId } = await request.json();
  
  // 토큰 정보 확인
  const tokenInfoUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/token`;
  
  const response = await fetch(tokenInfoUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const tokenInfo = await response.json();
  
  return NextResponse.json({
    tokenInfo,
    scopes: tokenInfo.scopes || 'No scopes found'
  });
}
