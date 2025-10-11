// 📂 src/lib/cafe24-config.ts
// Review2Earn v6.0 - Cafe24 Configuration

export const CAFE24_CONFIG = {
  API_VERSION: process.env.CAFE24_API_VERSION || '2025-09-01',
  DEFAULT_SHOP_NO: parseInt(process.env.DEFAULT_SHOP_NO || '1'),
  DEFAULT_SKIN_NO: parseInt(process.env.DEFAULT_SKIN_NO || '1'),
  CLIENT_ID: process.env.CAFE24_CLIENT_ID!,
  CLIENT_SECRET: process.env.CAFE24_CLIENT_SECRET!,
  REDIRECT_URI: `${process.env.NEXT_PUBLIC_APP_URL}/api/cafe24/callback`,
} as const;

export function getCafe24Headers(accessToken: string) {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-Cafe24-Api-Version': CAFE24_CONFIG.API_VERSION,
  };
}
