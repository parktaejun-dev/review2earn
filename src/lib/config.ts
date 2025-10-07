// src/lib/config.ts
// ✅ 카페24 OAuth 전용 설정 (정리됨)

/**
 * 서버사이드 환경변수 (비공개)
 */
export const serverConfig = {
  cafe24: {
    clientId: process.env.CAFE24_CLIENT_ID || '',
    clientSecret: process.env.CAFE24_CLIENT_SECRET || '',
    redirectUri: process.env.CAFE24_REDIRECT_URI || '',
  },
} as const;

/**
 * 클라이언트사이드 환경변수 (공개 가능)
 */
export const clientConfig = {
  cafe24ClientId: process.env.NEXT_PUBLIC_CAFE24_CLIENT_ID || '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://review2earn.vercel.app',
} as const;

/**
 * 서버 환경변수 검증
 */
export function validateServerConfig(): boolean {
  const { cafe24 } = serverConfig;
  
  const missing: string[] = [];
  
  if (!cafe24.clientId) missing.push('CAFE24_CLIENT_ID');
  if (!cafe24.clientSecret) missing.push('CAFE24_CLIENT_SECRET');
  if (!cafe24.redirectUri) missing.push('CAFE24_REDIRECT_URI');
  
  if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ All server environment variables are configured');
  }
  
  return true;
}

/**
 * 클라이언트 환경변수 검증
 */
export function validateClientConfig(): boolean {
  if (!clientConfig.cafe24ClientId) {
    console.error('❌ NEXT_PUBLIC_CAFE24_CLIENT_ID is missing');
    return false;
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Client configuration is valid');
  }
  
  return true;
}
