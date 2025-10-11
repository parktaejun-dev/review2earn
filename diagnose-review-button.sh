#!/bin/bash

echo "🔍 Review Button Issue Diagnosis"
echo "========================================"
echo ""

# 1️⃣ ScriptTag 등록 확인
echo "1️⃣ Checking ScriptTag registration..."
if [ -f "src/app/api/cafe24/scripttags/register/route.ts" ]; then
  echo "   ✅ ScriptTag API exists"
else
  echo "   ❌ ScriptTag API missing!"
fi

# 2️⃣ Public Script 파일 확인
echo ""
echo "2️⃣ Checking public script files..."
if [ -f "public/review2earn-button.js" ]; then
  echo "   ✅ review2earn-button.js exists"
  echo "   Size: $(wc -c < public/review2earn-button.js) bytes"
else
  echo "   ❌ review2earn-button.js missing!"
fi

# 3️⃣ Callback에서 ScriptTag 등록 확인
echo ""
echo "3️⃣ Checking callback ScriptTag registration..."
if grep -q "scripttags" src/app/api/cafe24/callback/route.ts; then
  echo "   ✅ ScriptTag registration in callback"
else
  echo "   ⚠️  No ScriptTag registration in callback"
fi

# 4️⃣ 현재 등록된 ScriptTag 확인 (DB)
echo ""
echo "4️⃣ Check DB for ScriptTag info..."
echo "   Run: npx prisma studio"
echo "   Check: ScriptTag table"

echo ""
echo "========================================"
echo "📝 Common Issues:"
echo "   1. ScriptTag not registered during OAuth"
echo "   2. Wrong script URL (localhost vs production)"
echo "   3. Script file not accessible (404)"
echo "   4. CORS issue"
echo "   5. Cafe24 cache"
echo ""
echo "🔍 Next: Check detailed logs"
