// src/app/api/oauth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CAFE24_CLIENT_ID = process.env.CAFE24_CLIENT_ID!;
const CAFE24_CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET!;
const CAFE24_REDIRECT_URI = process.env.CAFE24_REDIRECT_URI!;

export async function GET(request: NextRequest) {
  try {
    const { code, state } = extractCallbackParams(request);
    const mallId = decodeMallId(state);
    const tokenData = await exchangeCodeForToken(mallId, code);
    
    await saveMallSettings(mallId, tokenData);
    
    return redirectToFrontend(request, mallId, tokenData);
  } catch (error) {
    console.error('❌ OAuth Callback Error:', error);
    return redirectWithError(request, error);
  }
}

function extractCallbackParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    throw new Error('Missing code or state parameter');
  }

  return { code, state };
}

function decodeMallId(state: string): string {
  try {
    const stateData = JSON.parse(
      Buffer.from(state, 'base64').toString('utf-8')
    );
    
    if (!stateData.mallId) {
      throw new Error('mallId not found in state');
    }
    
    return stateData.mallId;
  } catch (error) {
    throw new Error('Invalid state parameter');
  }
}

async function exchangeCodeForToken(mallId: string, code: string) {
  const authHeader = Buffer.from(
    `${CAFE24_CLIENT_ID}:${CAFE24_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(
    `https://${mallId}.cafe24api.com/api/v2/oauth/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: CAFE24_REDIRECT_URI,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${JSON.stringify(data)}`);
  }

  return data;
}

// ✅ tokenExpiresAt 제거!
async function saveMallSettings(mallId: string, tokenData: any) {
  const { access_token, refresh_token } = tokenData;

  await prisma.mallSettings.upsert({
    where: { mallId },
    update: {
      accessToken: access_token,
      refreshToken: refresh_token,
      // tokenExpiresAt 제거!
      isActive: true,
    },
    create: {
      mallId,
      accessToken: access_token,
      refreshToken: refresh_token,
      // tokenExpiresAt 제거!
      isActive: true,
    },
  });
}

function redirectToFrontend(
  request: NextRequest,
  mallId: string,
  tokenData: any
) {
  const redirectUrl = new URL('/', request.url);
  redirectUrl.searchParams.set('oauth_success', 'true');
  redirectUrl.searchParams.set('mall_id', mallId);

  return NextResponse.redirect(redirectUrl);
}

function redirectWithError(request: NextRequest, error: any) {
  const redirectUrl = new URL('/', request.url);
  redirectUrl.searchParams.set('error', 'oauth_failed');
  redirectUrl.searchParams.set('message', error.message || 'Unknown error');

  return NextResponse.redirect(redirectUrl);
}
