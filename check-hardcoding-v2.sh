#!/bin/bash

echo "🔍 Review2Earn v6.0 - Hardcoding Check"
echo "========================================"
echo ""

# ============================================
# 1️⃣ mallId 하드코딩 검사
# ============================================
echo "1️⃣ Hardcoded mallId:"
echo "--------------------"
MALL_ID_FOUND=$(grep -rn "mallId.*=.*['\"]dhdshop['\"]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null)
MALL_ID_DEFAULT=$(grep -rn "||.*['\"]dhdshop['\"]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null)

if [ -z "$MALL_ID_FOUND" ] && [ -z "$MALL_ID_DEFAULT" ]; then
  echo "✅ No hardcoded mallId found"
else
  echo "❌ Found hardcoded mallId:"
  echo "$MALL_ID_FOUND"
  echo "$MALL_ID_DEFAULT"
fi
echo ""

# ============================================
# 2️⃣ 고정 금액 하드코딩 검사 (5000, 10000 등)
# ============================================
echo "2️⃣ Hardcoded amounts (5000, 10000, etc):"
echo "--------------------"
AMOUNT_FOUND=$(grep -rn "amount.*:.*\(5000\|10000\)" src/ --include="*.ts" --include="*.tsx" | grep -v "increment\|reduce\|orderAmount\|calculateReward" 2>/dev/null)

if [ -z "$AMOUNT_FOUND" ]; then
  echo "✅ No hardcoded amounts found"
else
  echo "❌ Found hardcoded amounts:"
  echo "$AMOUNT_FOUND"
fi
echo ""

# ============================================
# 3️⃣ discount_amount 하드코딩 검사
# ============================================
echo "3️⃣ Hardcoded discount_amount:"
echo "--------------------"
DISCOUNT_FOUND=$(grep -rn "discount_amount.*:.*[0-9]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null)

if [ -z "$DISCOUNT_FOUND" ]; then
  echo "✅ No hardcoded discount_amount found"
else
  echo "❌ Found hardcoded discount_amount:"
  echo "$DISCOUNT_FOUND"
fi
echo ""

# ============================================
# 4️⃣ URL 하드코딩 검사 (환경변수 없는 경우)
# ============================================
echo "4️⃣ Hardcoded URLs (without env):"
echo "--------------------"
URL_FOUND=$(grep -rn "https://review2earn.vercel.app" src/ --include="*.ts" --include="*.tsx" | grep -v "process.env\|NEXT_PUBLIC" 2>/dev/null)

if [ -z "$URL_FOUND" ]; then
  echo "✅ No hardcoded URLs found (all use env vars)"
else
  echo "⚠️  Found URLs without env vars:"
  echo "$URL_FOUND"
fi
echo ""

# ============================================
# 5️⃣ 비율 하드코딩 검사 (0.01, 0.005 등)
# ============================================
echo "5️⃣ Hardcoded rates (should use DB or env):"
echo "--------------------"
RATE_FOUND=$(grep -rn "Rate.*=.*0\.\(01\|005\)" src/ --include="*.ts" --include="*.tsx" | grep -v "process.env\|DEFAULT_" 2>/dev/null)

if [ -z "$RATE_FOUND" ]; then
  echo "✅ No hardcoded rates found (using DB/env)"
else
  echo "⚠️  Found hardcoded rates:"
  echo "$RATE_FOUND"
fi
echo ""

# ============================================
# 6️⃣ 테스트/데모 문자열 검사
# ============================================
echo "6️⃣ Test/Demo strings:"
echo "--------------------"
TEST_FOUND=$(grep -rn "['\"]test['\"]" src/ --include="*.ts" --include="*.tsx" | grep -v "test-connection\|testing\|testMode" 2>/dev/null)

if [ -z "$TEST_FOUND" ]; then
  echo "✅ No test strings found"
else
  echo "⚠️  Found test strings:"
  echo "$TEST_FOUND" | head -5
  echo "... (showing first 5)"
fi
echo ""

# ============================================
# 7️⃣ calculateReward 사용 확인 (동적 계산)
# ============================================
echo "7️⃣ Dynamic reward calculation check:"
echo "--------------------"
CALC_USAGE=$(grep -rn "calculateReward" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)

if [ "$CALC_USAGE" -gt 0 ]; then
  echo "✅ calculateReward is used ($CALC_USAGE times)"
  grep -rn "calculateReward" src/ --include="*.ts" --include="*.tsx" 2>/dev/null
else
  echo "❌ calculateReward is NOT used (still using hardcoded values?)"
fi
echo ""

# ============================================
# 8️⃣ 환경변수 확인
# ============================================
echo "8️⃣ Environment variables check:"
echo "--------------------"
if [ -f .env ]; then
  if grep -q "DEFAULT_REVIEWER_RATE" .env; then
    echo "✅ DEFAULT_REVIEWER_RATE found in .env"
  else
    echo "❌ DEFAULT_REVIEWER_RATE NOT found in .env"
  fi
  
  if grep -q "DEFAULT_BUYER_DISCOUNT_RATE" .env; then
    echo "✅ DEFAULT_BUYER_DISCOUNT_RATE found in .env"
  else
    echo "❌ DEFAULT_BUYER_DISCOUNT_RATE NOT found in .env"
  fi
  
  if grep -q "DEFAULT_PLATFORM_FEE_RATE" .env; then
    echo "✅ DEFAULT_PLATFORM_FEE_RATE found in .env"
  else
    echo "❌ DEFAULT_PLATFORM_FEE_RATE NOT found in .env"
  fi
else
  echo "⚠️  .env file not found"
fi
echo ""

# ============================================
# 최종 요약
# ============================================
echo "========================================"
echo "🎯 Final Summary"
echo "========================================"

ERRORS=0

if [ ! -z "$MALL_ID_FOUND" ] || [ ! -z "$MALL_ID_DEFAULT" ]; then
  echo "❌ Hardcoded mallId detected"
  ((ERRORS++))
fi

if [ ! -z "$AMOUNT_FOUND" ]; then
  echo "❌ Hardcoded amounts detected"
  ((ERRORS++))
fi

if [ ! -z "$DISCOUNT_FOUND" ]; then
  echo "❌ Hardcoded discount_amount detected"
  ((ERRORS++))
fi

if [ "$CALC_USAGE" -eq 0 ]; then
  echo "❌ calculateReward not used"
  ((ERRORS++))
fi

if [ $ERRORS -eq 0 ]; then
  echo "✅ All checks passed! No hardcoding detected."
  exit 0
else
  echo "❌ Found $ERRORS issue(s). Please fix before deployment."
  exit 1
fi
