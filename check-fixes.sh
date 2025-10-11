#!/bin/bash

echo "�� Checking Production Fixes"
echo "========================================"
echo ""

MISSING=0

# 1. Prisma
if [ -f "src/lib/prisma.ts" ]; then
  echo "✅ src/lib/prisma.ts exists"
else
  echo "❌ src/lib/prisma.ts missing"
  ((MISSING++))
fi

# 2. Cafe24 Config
if [ -f "src/lib/cafe24-config.ts" ]; then
  echo "✅ src/lib/cafe24-config.ts exists"
else
  echo "❌ src/lib/cafe24-config.ts missing"
  ((MISSING++))
fi

# 3. Locale Utils
if [ -f "src/lib/locale-utils.ts" ]; then
  echo "✅ src/lib/locale-utils.ts exists"
else
  echo "❌ src/lib/locale-utils.ts missing"
  ((MISSING++))
fi

# 4. Logger
if [ -f "src/lib/logger.ts" ]; then
  echo "✅ src/lib/logger.ts exists"
else
  echo "❌ src/lib/logger.ts missing"
  ((MISSING++))
fi

echo ""

# 5. Check .env
if grep -q "CAFE24_API_VERSION" .env; then
  echo "✅ CAFE24_API_VERSION in .env"
else
  echo "❌ CAFE24_API_VERSION missing from .env"
  ((MISSING++))
fi

if grep -q "DEFAULT_SHOP_NO" .env; then
  echo "✅ DEFAULT_SHOP_NO in .env"
else
  echo "❌ DEFAULT_SHOP_NO missing from .env"
  ((MISSING++))
fi

echo ""
echo "========================================"
if [ $MISSING -eq 0 ]; then
  echo "✅ All files created successfully!"
  echo ""
  echo "📝 Next: Run production check again"
  echo "   ./check-production-hardcoding.sh"
else
  echo "❌ $MISSING file(s) missing"
  echo ""
  echo "Please run the file creation commands first"
fi
echo "========================================"
