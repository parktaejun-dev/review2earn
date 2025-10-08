// src/app/api/oauth/authorize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Cafe24OAuth } from '@/lib/cafe24-oauth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mallId = searchParams.get('mall_id');
  
  if (!mallId) {
    return NextResponse.json(
      { error: 'mall_id is required' },
      { status: 400 }
    );
  }
  
  const oauth = new Cafe24OAuth();
  const randomState = oauth.generateState();
  
  // state에 mall_id 포함 (JSON 형태로 인코딩)
  const stateData = {
    random: randomState,
    mallId: mallId,
    timestamp: Date.now()
  };
  
  const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
  
  console.log('🎯 OAuth Authorize - Creating auth URL:', {
    mallId,
    state: state.substring(0, 20) + '...'
  });
  
  const authUrl = oauth.getAuthUrl(mallId, state);
  
  return NextResponse.redirect(authUrl);
}
