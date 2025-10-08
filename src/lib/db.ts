// src/lib/db.ts
// Review2Earn 데이터베이스 헬퍼 함수
// Prisma로 통일된 데이터베이스 액세스

import { prisma } from '@/lib/prisma';
import { sql } from '@vercel/postgres';

// ============================================
// 타입 정의
// ============================================

export interface MallSettings {
  id: number;
  mallId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Consent {
  id: number;
  mall_id: string;
  member_id: string;
  consented: boolean;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface Review {
  id: number;
  mall_id: string;
  review_id: string;
  product_no: number;
  member_id: string;
  referral_code: string;
  is_active: boolean;
  created_at: Date;
}

export interface Transaction {
  id: number;
  mall_id: string;
  order_id: string;
  referral_code: string;
  reviewer_member_id: string;
  buyer_member_id: string;
  order_amount: number;
  reviewer_reward: number;
  buyer_discount: number;
  platform_fee: number;
  reward_issued: boolean;
  created_at: Date;
}

// ============================================
// 쇼핑몰 설정 함수 (Prisma 사용)
// ============================================

/**
 * 쇼핑몰 설정을 저장하거나 업데이트합니다
 */
export async function saveMallSettings(data: {
  mall_id: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: Date;
  api_version?: string;
}): Promise<MallSettings> {
  const result = await prisma.installationToken.upsert({
    where: {
      mallId: data.mall_id
    },
    update: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt: data.token_expires_at || null,
      scope: null,
      updatedAt: new Date()
    },
    create: {
      mallId: data.mall_id,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt: data.token_expires_at || null,
      scope: null
    }
  });

  return {
    id: result.id,
    mallId: result.mallId,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken || undefined,
    expiresAt: result.expiresAt || undefined,
    scope: result.scope || undefined,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt
  };
}

/**
 * 쇼핑몰 설정을 조회합니다
 */
export async function getMallSettings(mall_id: string): Promise<MallSettings | null> {
  const result = await prisma.installationToken.findUnique({
    where: {
      mallId: mall_id
    }
  });

  if (!result) return null;

  return {
    id: result.id,
    mallId: result.mallId,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken || undefined,
    expiresAt: result.expiresAt || undefined,
    scope: result.scope || undefined,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt
  };
}

/**
 * ScriptTag ID를 업데이트합니다
 */
export async function updateScriptTagId(
  mall_id: string,
  type: 'consent' | 'button',
  scripttag_id: string
): Promise<void> {
  if (type === 'consent') {
    await sql`
      UPDATE mall_settings 
      SET scripttag_consent_id = ${scripttag_id}, updated_at = CURRENT_TIMESTAMP
      WHERE mall_id = ${mall_id}
    `;
  } else {
    await sql`
      UPDATE mall_settings 
      SET scripttag_button_id = ${scripttag_id}, updated_at = CURRENT_TIMESTAMP
      WHERE mall_id = ${mall_id}
    `;
  }
}

/**
 * Webhook ID를 업데이트합니다
 */
export async function updateWebhookId(
  mall_id: string,
  type: 'review' | 'order',
  webhook_id: string
): Promise<void> {
  if (type === 'review') {
    await sql`
      UPDATE mall_settings 
      SET webhook_review_id = ${webhook_id}, updated_at = CURRENT_TIMESTAMP
      WHERE mall_id = ${mall_id}
    `;
  } else {
    await sql`
      UPDATE mall_settings 
      SET webhook_order_id = ${webhook_id}, updated_at = CURRENT_TIMESTAMP
      WHERE mall_id = ${mall_id}
    `;
  }
}

// ============================================
// 동의 관리 함수
// ============================================

/**
 * 회원의 참여 동의를 저장합니다
 */
export async function saveConsent(data: {
  mall_id: string;
  member_id: string;
  consented: boolean;
  ip_address?: string;
  user_agent?: string;
}): Promise<Consent> {
  const result = await sql<Consent>`
    INSERT INTO consents (mall_id, member_id, consented, ip_address, user_agent)
    VALUES (
      ${data.mall_id}, 
      ${data.member_id}, 
      ${data.consented}, 
      ${data.ip_address || null}, 
      ${data.user_agent || null}
    )
    ON CONFLICT (mall_id, member_id) 
    DO UPDATE SET 
      consented = ${data.consented},
      ip_address = ${data.ip_address || null},
      user_agent = ${data.user_agent || null}
    RETURNING *
  `;
  return result.rows[0];
}

/**
 * 회원의 동의 여부를 확인합니다
 */
export async function checkConsent(mall_id: string, member_id: string): Promise<boolean> {
  const result = await sql<Consent>`
    SELECT consented FROM consents 
    WHERE mall_id = ${mall_id} AND member_id = ${member_id}
  `;
  return result.rows[0]?.consented || false;
}

/**
 * 최근 동의 내역을 조회합니다
 */
export async function getRecentConsents(
  mall_id: string, 
  limit: number = 10
): Promise<Consent[]> {
  const result = await sql<Consent>`
    SELECT * FROM consents 
    WHERE mall_id = ${mall_id}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return result.rows;
}

// ============================================
// 리뷰 관리 함수
// ============================================

/**
 * 리뷰를 저장하고 추천 코드를 생성합니다
 */
export async function saveReview(data: {
  mall_id: string;
  review_id: string;
  product_no: number;
  member_id: string;
  referral_code: string;
}): Promise<Review> {
  const result = await sql<Review>`
    INSERT INTO reviews (mall_id, review_id, product_no, member_id, referral_code)
    VALUES (
      ${data.mall_id}, 
      ${data.review_id}, 
      ${data.product_no}, 
      ${data.member_id}, 
      ${data.referral_code}
    )
    ON CONFLICT (mall_id, review_id) DO NOTHING
    RETURNING *
  `;
  return result.rows[0];
}

/**
 * 상품별 활성 리뷰를 조회합니다
 */
export async function getActiveReviewsByProduct(
  mall_id: string,
  product_no: number
): Promise<Review[]> {
  const result = await sql<Review>`
    SELECT * FROM reviews 
    WHERE mall_id = ${mall_id} 
      AND product_no = ${product_no} 
      AND is_active = true
    ORDER BY created_at DESC
  `;
  return result.rows;
}

/**
 * Referral 코드로 리뷰를 조회합니다
 */
export async function getReviewByReferralCode(
  referral_code: string
): Promise<Review | null> {
  const result = await sql<Review>`
    SELECT * FROM reviews 
    WHERE referral_code = ${referral_code} AND is_active = true
    LIMIT 1
  `;
  return result.rows[0] || null;
}

// ============================================
// 거래 관리 함수
// ============================================

/**
 * 거래 내역을 저장합니다
 */
export async function saveTransaction(data: {
  mall_id: string;
  order_id: string;
  referral_code: string;
  reviewer_member_id: string;
  buyer_member_id: string;
  order_amount: number;
  reviewer_reward: number;
  buyer_discount: number;
  platform_fee: number;
}): Promise<Transaction> {
  const result = await sql<Transaction>`
    INSERT INTO transactions (
      mall_id, order_id, referral_code, reviewer_member_id, buyer_member_id,
      order_amount, reviewer_reward, buyer_discount, platform_fee
    )
    VALUES (
      ${data.mall_id}, 
      ${data.order_id}, 
      ${data.referral_code}, 
      ${data.reviewer_member_id}, 
      ${data.buyer_member_id},
      ${data.order_amount}, 
      ${data.reviewer_reward}, 
      ${data.buyer_discount}, 
      ${data.platform_fee}
    )
    ON CONFLICT (mall_id, order_id) DO NOTHING
    RETURNING *
  `;
  return result.rows[0];
}

/**
 * 최근 거래 내역을 조회합니다
 */
export async function getRecentTransactions(
  mall_id: string,
  limit: number = 10
): Promise<Transaction[]> {
  const result = await sql<Transaction>`
    SELECT * FROM transactions 
    WHERE mall_id = ${mall_id}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return result.rows;
}

/**
 * 리뷰어의 총 수익을 조회합니다
 */
export async function getReviewerTotalRewards(
  mall_id: string,
  reviewer_member_id: string
): Promise<number> {
  const result = await sql<{ total: number }>`
    SELECT COALESCE(SUM(reviewer_reward), 0) as total
    FROM transactions
    WHERE mall_id = ${mall_id} AND reviewer_member_id = ${reviewer_member_id}
  `;
  return result.rows[0]?.total || 0;
}

// ==========================================
// 보상 비율 관리 함수
// ==========================================

/**
 * 제품별 보상 비율 조회 (없으면 쇼핑몰 기본값 반환)
 */
export async function getRewardRates(mall_id: string, product_no: number) {
  // 1. 제품별 설정 확인
  const productResult = await sql`
    SELECT reviewer_percent, buyer_percent, is_enabled
    FROM product_rewards
    WHERE mall_id = ${mall_id} AND product_no = ${product_no} AND is_enabled = true
    LIMIT 1
  `;
  
  if (productResult.rows.length > 0) {
    const row = productResult.rows[0];
    return {
      reviewer_percent: parseFloat(row.reviewer_percent),
      buyer_percent: parseFloat(row.buyer_percent),
      platform_percent: (parseFloat(row.reviewer_percent) + parseFloat(row.buyer_percent)) * 0.25
    };
  }
  
  // 2. 쇼핑몰 기본값 사용
  const mallResult = await sql`
    SELECT reviewer_percent, buyer_percent
    FROM mall_settings
    WHERE mall_id = ${mall_id}
    LIMIT 1
  `;
  
  if (mallResult.rows.length > 0) {
    const row = mallResult.rows[0];
    const reviewerPercent = parseFloat(row.reviewer_percent || '1.0');
    const buyerPercent = parseFloat(row.buyer_percent || '1.0');
    
    return {
      reviewer_percent: reviewerPercent,
      buyer_percent: buyerPercent,
      platform_percent: (reviewerPercent + buyerPercent) * 0.25
    };
  }
  
  // 3. 기본값 (fallback)
  return {
    reviewer_percent: 1.0,
    buyer_percent: 1.0,
    platform_percent: 0.5
  };
}

/**
 * 쇼핑몰 기본 보상 비율 설정
 */
export async function updateMallRewardRates(
  mall_id: string,
  reviewer_percent: number,
  buyer_percent: number
) {
  const result = await sql`
    UPDATE mall_settings
    SET reviewer_percent = ${reviewer_percent},
        buyer_percent = ${buyer_percent},
        updated_at = CURRENT_TIMESTAMP
    WHERE mall_id = ${mall_id}
    RETURNING id, mall_id, reviewer_percent, buyer_percent
  `;
  
  return result.rows[0];
}

/**
 * 제품별 보상 비율 설정
 */
export async function setProductRewardRate(
  mall_id: string,
  product_no: number,
  reviewer_percent: number,
  buyer_percent: number,
  is_enabled: boolean = true
) {
  const result = await sql`
    INSERT INTO product_rewards (mall_id, product_no, reviewer_percent, buyer_percent, is_enabled)
    VALUES (${mall_id}, ${product_no}, ${reviewer_percent}, ${buyer_percent}, ${is_enabled})
    ON CONFLICT (mall_id, product_no)
    DO UPDATE SET
      reviewer_percent = ${reviewer_percent},
      buyer_percent = ${buyer_percent},
      is_enabled = ${is_enabled},
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  
  return result.rows[0];
}

/**
 * 제품의 리뷰투언 참여 활성화/비활성화
 */
export async function toggleProductReward(
  mall_id: string,
  product_no: number,
  is_enabled: boolean
) {
  const result = await sql`
    UPDATE product_rewards
    SET is_enabled = ${is_enabled},
        updated_at = CURRENT_TIMESTAMP
    WHERE mall_id = ${mall_id} AND product_no = ${product_no}
    RETURNING *
  `;
  
  return result.rows[0];
}
