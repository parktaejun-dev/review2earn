// src/lib/utils/referral.ts
import crypto from 'crypto'

export function generateReferralCode(mallId: string, boardNo: number): string {
  const timestamp = Date.now()
  const randomBytes = crypto.randomBytes(4).toString('hex')
  return `R2E-${mallId}-${boardNo}-${randomBytes}`.toUpperCase()
}

export function validateReferralCode(code: string): boolean {
  const pattern = /^R2E-[A-Z0-9]+-\d+-[A-F0-9]{8}$/
  return pattern.test(code)
}
