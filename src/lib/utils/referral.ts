// src/lib/utils/referral.ts
import crypto from 'crypto'

/**
 * R2E 추천 코드 생성
 * 형식: R2E-{mallId}-{boardNo}-{randomHex}
 * 예시: R2E-DHDSHOP-12345-A1B2C3D4
 */
export function generateReferralCode(mallId: string, boardNo: number): string {
  const randomBytes = crypto.randomBytes(4).toString('hex')
  return `R2E-${mallId}-${boardNo}-${randomBytes}`.toUpperCase()
}

/**
 * R2E 추천 코드 유효성 검사
 * @param code 검증할 추천 코드
 * @returns 유효한 형식이면 true
 */
export function validateReferralCode(code: string): boolean {
  const pattern = /^R2E-[A-Z0-9]+-\d+-[A-F0-9]{8}$/
  return pattern.test(code)
}
