import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 환경변수 공개적으로 번들에 포함
  env: {
    NEXT_PUBLIC_CAFE24_CLIENT_ID: process.env.NEXT_PUBLIC_CAFE24_CLIENT_ID,
    CAFE24_CLIENT_SECRET: process.env.CAFE24_CLIENT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  
  // 추가 환경변수 설정
  publicRuntimeConfig: {
    CAFE24_CLIENT_ID: process.env.NEXT_PUBLIC_CAFE24_CLIENT_ID,
  },
  
  // 빌드 최적화
  experimental: {
    optimizePackageImports: ['@vercel/analytics'],
  },
  
  // 런타임 환경변수 지원
  serverRuntimeConfig: {
    CAFE24_CLIENT_SECRET: process.env.CAFE24_CLIENT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  }
};

export default nextConfig;
