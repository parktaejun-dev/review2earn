// src/lib/cafe24/token-refresh.ts
import { prisma } from '@/lib/db'

export async function refreshAccessToken(mallId: string) {
  const mall = await prisma.mallSettings.findUnique({
    where: { mallId },
  })

  if (!mall?.refreshToken) {
    throw new Error('No refresh token available')
  }

  const response = await fetch(`https://${mallId}.cafe24api.com/api/v2/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: mall.refreshToken,
      client_id: process.env.CAFE24_CLIENT_ID!,
      client_secret: process.env.CAFE24_CLIENT_SECRET!,
    }),
  })

  const data = await response.json()

  await prisma.mallSettings.update({
    where: { mallId },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  })

  return data.access_token
}
