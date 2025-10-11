// src/lib/refreshToken.ts
import { prisma } from './prisma';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scopes: string[];
}

/**
 * 유효한 액세스 토큰을 반환합니다.
 * 만료되었다면 자동으로 갱신합니다.
 */
export async function getValidToken(mallId: string): Promise<string> {
  const settings = await prisma.mallSettings.findUnique({
    where: { mallId },
  });

  if (!settings) {
    throw new Error(`Mall ${mallId} not found. Please complete OAuth first.`);
  }

  if (!settings.accessToken) {
    throw new Error(`No access token for ${mallId}. Please complete OAuth first.`);
  }

  // 토큰이 아직 유효한지 확인 (5분 버퍼)
  const bufferTime = 5 * 60 * 1000; // 5분
  const isTokenValid = 
    settings.tokenExpiresAt && 
    settings.tokenExpiresAt.getTime() > Date.now() + bufferTime;

  if (isTokenValid) {
    console.log(`✅ Token for ${mallId} is still valid`);
    return settings.accessToken;
  }

  // 토큰 만료 또는 만료 임박 → 갱신
  console.log(`🔄 Refreshing token for ${mallId}...`);
  
  if (!settings.refreshToken) {
    throw new Error(`No refresh token for ${mallId}. Please re-authenticate.`);
  }

  try {
    const newToken = await refreshAccessToken(mallId, settings.refreshToken);
    return newToken;
  } catch (error) {
    console.error(`❌ Failed to refresh token for ${mallId}:`, error);
    throw new Error(`Token refresh failed for ${mallId}. Please re-authenticate.`);
  }
}

/**
 * Refresh Token으로 새 Access Token 발급
 */
async function refreshAccessToken(
  mallId: string,
  refreshToken: string
): Promise<string> {
  const tokenUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/token`;
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.CAFE24_CLIENT_ID!,
      client_secret: process.env.CAFE24_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Token refresh failed:`, errorText);
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const tokens: TokenResponse = await response.json();

  // DB 업데이트
  await prisma.mallSettings.update({
    where: { mallId },
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || refreshToken, // 새 refresh token이 없으면 기존 것 유지
      tokenExpiresAt: tokens.expires_at 
        ? new Date(tokens.expires_at)
        : new Date(Date.now() + 3600 * 1000), // 1시간 후 (기본값)
      scopes: tokens.scopes ? tokens.scopes.join(',') : undefined,
    },
  });

  console.log(`✅ Token refreshed successfully for ${mallId}`);
  console.log(`🕐 New expiry: ${tokens.expires_at || 'in 1 hour'}`);

  return tokens.access_token;
}

/**
 * 여러 쇼핑몰의 토큰을 일괄 갱신 (Cron 작업용)
 */
export async function refreshAllExpiredTokens(): Promise<void> {
  const expiringMalls = await prisma.mallSettings.findMany({
    where: {
      tokenExpiresAt: {
        lt: new Date(Date.now() + 10 * 60 * 1000), // 10분 이내 만료
      },
      isActive: true,
    },
  });

  console.log(`🔄 Found ${expiringMalls.length} malls with expiring tokens`);

  for (const mall of expiringMalls) {
    try {
      await getValidToken(mall.mallId);
      console.log(`✅ Refreshed token for ${mall.mallId}`);
    } catch (error) {
      console.error(`❌ Failed to refresh ${mall.mallId}:`, error);
    }
  }
}
