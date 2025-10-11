#!/bin/bash

echo "🔍 Review2Earn - Production-Ready Hardcoding Check"
echo "========================================"
echo ""

# ============================================
# 1️⃣ shop_no 하드코딩 (멀티샵 문제)
# ============================================
echo "1️⃣ Hardcoded shop_no (Multi-shop issue):"
echo "--------------------"
SHOP_NO=$(grep -rn "shop_no.*:.*1" src/ --include="*.ts" --include="*.tsx" | grep -v "shop_no\?: number" 2>/dev/null)

if [ -z "$SHOP_NO" ]; then
  echo "✅ No hardcoded shop_no found"
else
  echo "⚠️  Found hardcoded shop_no (should be dynamic for multi-shop):"
  echo "$SHOP_NO"
fi
echo ""

# ============================================
# 2️⃣ skin_no 하드코딩
# ============================================
echo "2️⃣ Hardcoded skin_no:"
echo "--------------------"
SKIN_NO=$(grep -rn "skin_no.*:.*\[1\]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null)

if [ -z "$SKIN_NO" ]; then
  echo "✅ No hardcoded skin_no found"
else
  echo "⚠️  Found hardcoded skin_no:"
  echo "$SKIN_NO"
fi
echo ""

# ============================================
# 3️⃣ API Version 하드코딩
# ============================================
echo "3️⃣ Hardcoded API Version:"
echo "--------------------"
API_VERSION=$(grep -rn "X-Cafe24-Api-Version.*:.*['\"]20" src/ --include="*.ts" --include="*.tsx" 2>/dev/null)

if [ -z "$API_VERSION" ]; then
  echo "✅ No hardcoded API version found"
else
  echo "⚠️  Found hardcoded API version:"
  echo "$API_VERSION" | head -5
fi
echo ""

# ============================================
# 4️⃣ 타임아웃 하드코딩
# ============================================
echo "4️⃣ Hardcoded timeout values:"
echo "--------------------"
TIMEOUT=$(grep -rn "timeout.*:.*[0-9]" src/ --include="*.ts" --include="*.tsx" | grep -v "setTimeout" 2>/dev/null)

if [ -z "$TIMEOUT" ]; then
  echo "✅ No hardcoded timeout found"
else
  echo "⚠️  Found hardcoded timeout:"
  echo "$TIMEOUT"
fi
echo ""

# ============================================
# 5️⃣ Limit/Pagination 하드코딩
# ============================================
echo "5️⃣ Hardcoded limit/pagination:"
echo "--------------------"
LIMIT=$(grep -rn "limit.*=.*[0-9]" src/ --include="*.ts" --include="*.tsx" | grep -v "limit\?: number\|limit: number\)" 2>/dev/null)

if [ -z "$LIMIT" ]; then
  echo "✅ No hardcoded limit found"
else
  echo "⚠️  Found hardcoded limit:"
  echo "$LIMIT" | head -5
fi
echo ""

# ============================================
# 6️⃣ Currency 하드코딩 (KRW 등)
# ============================================
echo "6️⃣ Hardcoded currency:"
echo "--------------------"
CURRENCY=$(grep -rn "['\"]KRW['\"]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null)

if [ -z "$CURRENCY" ]; then
  echo "✅ No hardcoded currency found"
else
  echo "⚠️  Found hardcoded currency (should support multi-currency):"
  echo "$CURRENCY"
fi
echo ""

# ============================================
# 7️⃣ 언어/로케일 하드코딩
# ============================================
echo "7️⃣ Hardcoded language/locale:"
echo "--------------------"
LOCALE=$(grep -rn "['\"]ko-KR['\"]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null)

if [ -z "$LOCALE" ]; then
  echo "✅ No hardcoded locale found"
else
  echo "⚠️  Found hardcoded locale:"
  echo "$LOCALE"
fi
echo ""

# ============================================
# 8️⃣ 데이터베이스 테이블명 하드코딩
# ============================================
echo "8️⃣ Hardcoded database table names (outside Prisma):"
echo "--------------------"
DB_TABLE=$(grep -rn "SELECT.*FROM.*['\"]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null)

if [ -z "$DB_TABLE" ]; then
  echo "✅ No raw SQL with hardcoded tables"
else
  echo "⚠️  Found raw SQL with hardcoded tables:"
  echo "$DB_TABLE"
fi
echo ""

# ============================================
# 9️⃣ 환경별 설정 누락 (development/production)
# ============================================
echo "9️⃣ Environment-specific config:"
echo "--------------------"
NODE_ENV=$(grep -rn "process.env.NODE_ENV.*===.*['\"]production['\"]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)

if [ "$NODE_ENV" -gt 0 ]; then
  echo "✅ Environment checks exist ($NODE_ENV places)"
else
  echo "⚠️  No environment-specific checks found"
fi
echo ""

# ============================================
# 🔟 에러 메시지 하드코딩 (i18n 필요)
# ============================================
echo "🔟 Hardcoded error messages (should use i18n):"
echo "--------------------"
ERROR_MSG=$(grep -rn "message.*:.*['\"].*실패\|오류\|에러" src/app/api --include="*.ts" 2>/dev/null | wc -l)

if [ "$ERROR_MSG" -gt 0 ]; then
  echo "⚠️  Found $ERROR_MSG hardcoded Korean error messages"
  echo "   (Consider using i18n for international support)"
else
  echo "✅ No hardcoded error messages found"
fi
echo ""

# ============================================
# 1️⃣1️⃣ PrismaClient 중복 생성
# ============================================
echo "1️⃣1️⃣ Multiple PrismaClient instances:"
echo "--------------------"
PRISMA_NEW=$(grep -rn "new PrismaClient()" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)

if [ "$PRISMA_NEW" -le 1 ]; then
  echo "✅ PrismaClient properly managed ($PRISMA_NEW instances)"
else
  echo "⚠️  Found $PRISMA_NEW PrismaClient instances"
  echo "   (Should use singleton pattern)"
  grep -rn "new PrismaClient()" src/ --include="*.ts" --include="*.tsx" 2>/dev/null
fi
echo ""

# ============================================
# 1️⃣2️⃣ Console.log in production
# ============================================
echo "1️⃣2️⃣ Console.log statements (should be removed/conditional):"
echo "--------------------"
CONSOLE_LOG=$(grep -rn "console.log\|console.error" src/app/api --include="*.ts" 2>/dev/null | wc -l)

if [ "$CONSOLE_LOG" -eq 0 ]; then
  echo "✅ No console statements found"
else
  echo "⚠️  Found $CONSOLE_LOG console statements"
  echo "   (Consider using proper logging library)"
fi
echo ""

# ============================================
# 최종 요약
# ============================================
echo "========================================"
echo "🎯 Production Readiness Summary"
echo "========================================"

WARNINGS=0

if [ ! -z "$SHOP_NO" ]; then
  echo "⚠️  shop_no hardcoding detected (multi-shop issue)"
  ((WARNINGS++))
fi

if [ ! -z "$SKIN_NO" ]; then
  echo "⚠️  skin_no hardcoding detected"
  ((WARNINGS++))
fi

if [ ! -z "$API_VERSION" ]; then
  echo "⚠️  API version hardcoding detected"
  ((WARNINGS++))
fi

if [ "$PRISMA_NEW" -gt 1 ]; then
  echo "⚠️  Multiple PrismaClient instances"
  ((WARNINGS++))
fi

if [ "$CONSOLE_LOG" -gt 20 ]; then
  echo "⚠️  Too many console statements ($CONSOLE_LOG)"
  ((WARNINGS++))
fi

if [ $WARNINGS -eq 0 ]; then
  echo "✅ Ready for production!"
  exit 0
else
  echo "⚠️  Found $WARNINGS production issues to review"
  exit 0
fi
