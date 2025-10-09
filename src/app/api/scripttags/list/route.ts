// src/app/api/scripttags/list/route.ts (새 파일)

import { NextRequest, NextResponse } from 'next/server';
import { getValidToken } from '@/lib/refreshToken';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mallId = searchParams.get('mallId');

    if (!mallId) {
      return NextResponse.json(
        { success: false, error: 'mallId is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const accessToken = await getValidToken(mallId);
    
    const url = `https://${mallId}.cafe24api.com/api/v2/admin/scripttags`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2025-09-01',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, error: errorData },
        { status: response.status, headers: CORS_HEADERS }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(
      {
        success: true,
        scripttags: data.scripttags || [],
        count: data.scripttags?.length || 0,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
