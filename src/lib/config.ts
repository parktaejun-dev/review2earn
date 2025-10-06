// 서버사이드 환경변수
export const serverConfig = {
  cafe24: {
    clientId: process.env.NEXT_PUBLIC_CAFE24_CLIENT_ID,
    clientSecret: process.env.CAFE24_CLIENT_SECRET,
    baseUrl: process.env.NEXTAUTH_URL || 'https://review2earn.vercel.app', // 명시적 fallback
  },
  nextauth: {
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL || 'https://review2earn.vercel.app',
  }
} as const;

// 클라이언트사이드 환경변수 (안전하게 노출 가능)
export const clientConfig = {
  cafe24ClientId: process.env.NEXT_PUBLIC_CAFE24_CLIENT_ID,
  baseUrl: typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.NEXTAUTH_URL || 'https://review2earn.vercel.app'),
} as const;

// 환경변수 검증 함수
export function validateServerConfig() {
  const required = {
    'NEXT_PUBLIC_CAFE24_CLIENT_ID': process.env.NEXT_PUBLIC_CAFE24_CLIENT_ID,
    'CAFE24_CLIENT_SECRET': process.env.CAFE24_CLIENT_SECRET,
    'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
    'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET
  } as const;

  console.log('🎯 Server Environment Variables:', {
    NEXT_PUBLIC_CAFE24_CLIENT_ID: required.NEXT_PUBLIC_CAFE24_CLIENT_ID ? '[SET]' : 'MISSING',
    CAFE24_CLIENT_SECRET: required.CAFE24_CLIENT_SECRET ? '[SET]' : 'MISSING', 
    NEXTAUTH_URL: required.NEXTAUTH_URL || 'MISSING',
    NEXTAUTH_SECRET: required.NEXTAUTH_SECRET ? '[SET]' : 'MISSING',
  });

  const missing = Object.entries(required)
    .filter(([key, value]) => !value)
    .map(([key]) => key);
  
  if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  console.log('✅ All server environment variables are properly configured');
  return true;
}

// 클라이언트 환경변수 검증
export function validateClientConfig() {
  if (!clientConfig.cafe24ClientId) {
    console.error('❌ NEXT_PUBLIC_CAFE24_CLIENT_ID is not available on client side');
    return false;
  }
  
  console.log('✅ Client configuration is valid');
  console.log('🎯 Client Config:', {
    cafe24ClientId: clientConfig.cafe24ClientId ? '[SET]' : 'MISSING',
    baseUrl: clientConfig.baseUrl
  });
  
  return true;
}
