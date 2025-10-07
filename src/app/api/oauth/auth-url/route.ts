// src/app/api/oauth/auth-url/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Cafe24OAuth } from '@/lib/cafe24-oauth';

export async function POST(request: NextRequest) {
  try {
    const { mallId } = await request.json();

    if (!mallId) {
      return NextResponse.json(
        { error: 'Mall ID is required' },
        { status: 400 }
      );
    }

    const oauth = new Cafe24OAuth();
    const state = oauth.generateState();
    const authUrl = oauth.getAuthUrl(mallId, state);

    return NextResponse.json({
      authUrl,
      state
    });
  } catch (error) {
    console.error('Auth URL 생성 실패:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }

}
