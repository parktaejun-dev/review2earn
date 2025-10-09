#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 Review2Earn API 테스트${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. Consent 테스트
echo -e "${GREEN}✅ Test 1: Consent 등록${NC}"
curl -s -X POST "$BASE_URL/api/consent" \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "test_user_001",
    "mallId": "dhdshop",
    "consented": true,
    "ipAddress": "127.0.0.1",
    "userAgent": "TestScript/1.0"
  }' | jq '.'
echo ""

# 2. Review Webhook 테스트
echo -e "${GREEN}✅ Test 2: Review 생성 + 추천 링크${NC}"
REVIEW_RESPONSE=$(curl -s -X POST "$BASE_URL/api/webhooks/review" \
  -H "Content-Type: application/json" \
  -d '{
    "mall_id": "dhdshop",
    "resource": {
      "board_no": 12345,
      "product_no": 100,
      "member_id": "test_user_001",
      "content": "정말 좋은 상품입니다!",
      "rating": 5
    }
  }')

echo "$REVIEW_RESPONSE" | jq '.'
REFERRAL_CODE=$(echo "$REVIEW_RESPONSE" | jq -r '.data.referralCode')
echo -e "${BLUE}📌 추천 코드: $REFERRAL_CODE${NC}"
echo ""

# 3. Click Tracking 테스트
echo -e "${GREEN}✅ Test 3: 클릭 추적${NC}"
curl -s -X POST "$BASE_URL/api/referral/track" \
  -H "Content-Type: application/json" \
  -d "{\"referralCode\": \"$REFERRAL_CODE\"}" | jq '.'
echo ""

# 4. Order Webhook 테스트
echo -e "${GREEN}✅ Test 4: 주문 완료 + 보상 계산${NC}"
curl -s -X POST "$BASE_URL/api/webhooks/order" \
  -H "Content-Type: application/json" \
  -d "{
    \"mall_id\": \"dhdshop\",
    \"resource\": {
      \"order_id\": \"ORDER_20251009_001\",
      \"items\": [
        {
          \"product_no\": 100,
          \"product_price\": \"50000\",
          \"quantity\": 2
        }
      ],
      \"referer\": \"https://dhdshop.cafe24.com/product/100?ref=$REFERRAL_CODE\"
    }
  }" | jq '.'

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 테스트 완료!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
