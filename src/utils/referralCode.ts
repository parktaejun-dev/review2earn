// src/utils/referralCode.ts

import crypto from 'crypto';

/**
 * ✅ v6.0: 완전 익명화된 레퍼럴 코드 생성
 * 형식: R2E-[12자리 HEX]
 * 예시: R2E-A7F3B2E1C9D4
 */
export function generateReferralCode(): string {
  const randomBytes = crypto.randomBytes(6);
  const hex = randomBytes.toString('hex').toUpperCase();
  return `R2E-${hex}`;
}

/**
 * 레퍼럴 코드 유효성 검증
 */
export function validateReferralCode(code: string): boolean {
  const pattern = /^R2E-[A-F0-9]{12}$/i;
  return pattern.test(code);
}

/**
 * 텍스트에서 레퍼럴 코드 추출
 */
export function extractReferralCode(text: string): string | null {
  const pattern = /R2E-[A-F0-9]{12}/gi;
  const matches = text.match(pattern);
  return matches ? matches[0].toUpperCase() : null;
}

/**
 * 텍스트에서 모든 레퍼럴 코드 추출
 */
export function extractAllReferralCodes(text: string): string[] {
  const pattern = /R2E-[A-F0-9]{12}/gi;
  const matches = text.match(pattern);
  
  if (!matches) return [];
  
  return [...new Set(matches.map(code => code.toUpperCase()))];
}

/**
 * 레퍼럴 코드 마스킹
 */
export function maskReferralCode(code: string): string {
  if (!validateReferralCode(code)) {
    return code;
  }
  
  const hex = code.replace('R2E-', '');
  const masked = hex.substring(0, 4) + '****' + hex.substring(8);
  
  return `R2E-${masked}`;
}
