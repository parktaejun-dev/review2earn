// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 클라이언트에서 접근 가능한 환경변수 (PUBLIC만!)
  env: {
    CAFE24_CLIENT_ID: process.env.CAFE24_CLIENT_ID,
    // ⚠️ CAFE24_CLIENT_SECRET 제거! (보안)
    CAFE24_REDIRECT_URI: process.env.CAFE24_REDIRECT_URI,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  
  // 서버에서만 접근 가능 (안전)
  serverRuntimeConfig: {
    cafe24ClientSecret: process.env.CAFE24_CLIENT_SECRET,
  },
  
  // 공개 런타임 설정 (클라이언트도 접근)
  publicRuntimeConfig: {
    cafe24ClientId: process.env.CAFE24_CLIENT_ID,
    // ⚠️ CAFE24_CLIENT_SECRET 절대 여기 넣지 마세요!
  },

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
