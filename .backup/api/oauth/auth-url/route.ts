// src/app/api/oauth/auth-url/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CAFE24_CLIENT_ID = process.env.CAFE24_CLIENT_ID!;
const CAFE24_REDIRECT_URI = process.env.CAFE24_REDIRECT_URI!;

const REQUIRED_SCOPES = [
  'mall.read_product',
  'mall.read_order',
  'mall.read_community',
  'mall.write_community',
  'mall.read_customer',
  'mall.write_customer',
  'mall.read_promotion',
  'mall.write_promotion',
  'mall.read_design',
  'mall.write_design',
  'mall.read_application',
  'mall.write_application'
];

export async function POST(request: NextRequest) {
  try {
    const { mallId } = await request.json();

    if (!mallId) {
      return NextResponse.json(
        { error: 'mallId is required' },
        { status: 400 }
      );
    }

    console.log('🔄 OAuth URL 생성 중...', { mallId });

    // state에 mallId 인코딩
    const stateData = {
      mallId,
      timestamp: Date.now(),
      random: crypto.randomBytes(8).toString('hex')
    };

    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

    // OAuth Authorization URL 생성
    const authUrl = new URL(`https://${mallId}.cafe24api.com/api/v2/oauth/authorize`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', CAFE24_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', CAFE24_REDIRECT_URI);
    authUrl.searchParams.set('scope', REQUIRED_SCOPES.join(','));
    authUrl.searchParams.set('state', state);

    console.log('✅ OAuth URL 생성 완료:', authUrl.toString());

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
      state
    });

  } catch (error) {
    console.error('❌ OAuth URL 생성 에러:', error);
    return NextResponse.json(
      { error: 'Failed to generate OAuth URL' },
      { status: 500 }
    );
  }
}
