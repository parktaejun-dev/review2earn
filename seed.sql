-- ============================================
-- Review2Earn 초기 데이터 생성
-- ============================================

-- 1. MallSettings 데이터
INSERT INTO mall_settings (
  mall_id,
  access_token,
  refresh_token,
  token_expires_at,
  scopes,
  reviewer_reward_rate,
  buyer_discount_rate,
  platform_fee_rate,
  is_active,
  created_at,
  updated_at
) VALUES (
  'dhdshop',
  NULL,
  NULL,
  NULL,
  NULL,
  0.01,
  0.05,
  0.005,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (mall_id) DO UPDATE SET
  reviewer_reward_rate = EXCLUDED.reviewer_reward_rate,
  buyer_discount_rate = EXCLUDED.buyer_discount_rate,
  platform_fee_rate = EXCLUDED.platform_fee_rate,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 2. Consent 샘플 데이터
INSERT INTO consents (
  member_id,
  mall_id,
  consented,
  consented_at,
  ip_address,
  user_agent,
  created_at,
  updated_at
) VALUES 
  ('test_user_001', 'dhdshop', true, NOW(), '127.0.0.1', 'TestScript/1.0', NOW(), NOW()),
  ('test_user_002', 'dhdshop', true, NOW(), '127.0.0.1', 'TestScript/1.0', NOW(), NOW())
ON CONFLICT (member_id, mall_id) DO NOTHING;

-- 완료 메시지
SELECT 'Data seeding completed!' as status;
