#!/bin/bash

echo "🔧 Applying Production Fixes..."
echo "========================================"

# 백업 생성
echo "📦 Creating backup..."
mkdir -p .backup
cp -r src/app/api .backup/
cp -r src/lib .backup/
echo "✅ Backup created in .backup/"

# ============================================
# 1️⃣ PrismaClient 중복 제거
# ============================================
echo ""
echo "1️⃣ Fixing PrismaClient imports..."

# src/app/api/admin/[mallId]/stats/route.ts
sed -i '' '/^import { PrismaClient }/d' src/app/api/admin/[mallId]/stats/route.ts
sed -i '' '/^const prisma = new PrismaClient/d' src/app/api/admin/[mallId]/stats/route.ts
sed -i '' '1i\
import { prisma } from "@/lib/prisma";
' src/app/api/admin/[mallId]/stats/route.ts

# src/app/api/cafe24/scripttags/register/route.ts
sed -i '' '/^import { PrismaClient }/d' src/app/api/cafe24/scripttags/register/route.ts
sed -i '' '/^const prisma = new PrismaClient/d' src/app/api/cafe24/scripttags/register/route.ts
sed -i '' '1i\
import { prisma } from "@/lib/prisma";
' src/app/api/cafe24/scripttags/register/route.ts

# src/app/api/webhooks/cafe24/route.ts
sed -i '' '/^import { PrismaClient }/d' src/app/api/webhooks/cafe24/route.ts
sed -i '' '/^const prisma = new PrismaClient/d' src/app/api/webhooks/cafe24/route.ts
sed -i '' '1i\
import { prisma } from "@/lib/prisma";
' src/app/api/webhooks/cafe24/route.ts

echo "   ✅ PrismaClient fixed (3 files)"

# ============================================
# 2️⃣ shop_no, skin_no 동적 처리
# ============================================
echo ""
echo "2️⃣ Fixing shop_no and skin_no..."

# src/app/api/cafe24/scripttags/register/route.ts
sed -i '' 's/shop_no: 1,/shop_no: parseInt(process.env.DEFAULT_SHOP_NO || "1"),/g' src/app/api/cafe24/scripttags/register/route.ts
sed -i '' 's/skin_no: \[1\],/skin_no: [parseInt(process.env.DEFAULT_SKIN_NO || "1")],/g' src/app/api/cafe24/scripttags/register/route.ts

# src/app/api/cafe24/callback/route.ts
sed -i '' 's/shop_no: 1,/shop_no: parseInt(process.env.DEFAULT_SHOP_NO || "1"),/g' src/app/api/cafe24/callback/route.ts
sed -i '' 's/skin_no: \[1\],/skin_no: [parseInt(process.env.DEFAULT_SKIN_NO || "1")],/g' src/app/api/cafe24/callback/route.ts

# src/lib/cafe24-scripttags.ts
sed -i '' 's/shop_no: 1,/shop_no: parseInt(process.env.DEFAULT_SHOP_NO || "1"),/g' src/lib/cafe24-scripttags.ts

echo "   ✅ shop_no, skin_no fixed (3 files)"

# ============================================
# 3️⃣ API Version 동적 처리
# ============================================
echo ""
echo "3️⃣ Fixing API version..."

# Cafe24 config import 추가
for file in src/app/api/test-connection/route.ts src/app/api/verify-token/route.ts src/app/api/cafe24/test/route.ts src/app/api/cafe24/scripttags/register/route.ts
do
  if ! grep -q "import.*CAFE24_CONFIG" "$file"; then
    sed -i '' '1i\
import { CAFE24_CONFIG } from "@/lib/cafe24-config";
' "$file"
  fi
done

# API Version 치환
sed -i '' 's/"X-Cafe24-Api-Version": "2025-09-01"/"X-Cafe24-Api-Version": CAFE24_CONFIG.API_VERSION/g' src/app/api/test-connection/route.ts
sed -i '' 's/"X-Cafe24-Api-Version": "2025-09-01"/"X-Cafe24-Api-Version": CAFE24_CONFIG.API_VERSION/g' src/app/api/verify-token/route.ts
sed -i '' 's/"X-Cafe24-Api-Version": "2024-06-01"/"X-Cafe24-Api-Version": CAFE24_CONFIG.API_VERSION/g' src/app/api/cafe24/test/route.ts
sed -i '' 's/"X-Cafe24-Api-Version": "2024-03-01"/"X-Cafe24-Api-Version": CAFE24_CONFIG.API_VERSION/g' src/app/api/cafe24/scripttags/register/route.ts

echo "   ✅ API version fixed (5 files)"

# ============================================
# 4️⃣ Locale 동적 처리
# ============================================
echo ""
echo "4️⃣ Fixing locale..."

# formatDate import 추가
for file in src/app/r2e/dashboard/page.tsx src/app/admin/dashboard/page.tsx
do
  if ! grep -q "import.*formatDate" "$file"; then
    sed -i '' '1i\
import { formatDate } from "@/lib/locale-utils";
' "$file"
  fi
done

# 날짜 포맷 치환
sed -i '' 's/toLocaleDateString('\''ko-KR'\''/formatDate(/g' src/app/r2e/dashboard/page.tsx
sed -i '' 's/toLocaleDateString('\''ko-KR'\''/formatDate(/g' src/app/admin/dashboard/page.tsx

echo "   ✅ Locale fixed (2 files)"

echo ""
echo "========================================"
echo "✅ All fixes applied!"
echo "========================================"
echo ""
echo "📝 Modified files:"
echo "  - 3 PrismaClient imports"
echo "  - 3 shop_no/skin_no hardcoding"
echo "  - 5 API version hardcoding"
echo "  - 2 locale hardcoding"
echo ""
echo "🔍 Run check again:"
echo "   ./check-production-hardcoding.sh"
