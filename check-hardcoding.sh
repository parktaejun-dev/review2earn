#!/bin/bash

echo "🔍 Checking for hardcoded values..."
echo ""

echo "1️⃣ Hardcoded mallId:"
grep -rn "= ['\"]dhdshop['\"]" src/ --include="*.ts" --include="*.tsx"
grep -rn "|| ['\"]dhdshop['\"]" src/ --include="*.ts" --include="*.tsx"
echo ""

echo "2️⃣ Hardcoded URLs:"
grep -rn "https://review2earn.vercel.app" src/ --include="*.ts" --include="*.tsx"
grep -rn "https://.*\.cafe24\.com" src/ --include="*.ts" --include="*.tsx"
echo ""

echo "3️⃣ Hardcoded amounts (10000, 5000 등):"
grep -rn "amount.*:.*[0-9]" src/ --include="*.ts" --include="*.tsx" | grep -v "increment\|reduce"
echo ""

echo "4️⃣ Hardcoded rates (0.01, 0.005 등):"
grep -rn "rate.*:.*0\." src/ --include="*.ts" --include="*.tsx"
echo ""

echo "5️⃣ Hardcoded email/member IDs:"
grep -rn "member.*=.*['\"][^@]*['\"]" src/ --include="*.ts" --include="*.tsx"
echo ""

echo "✅ Check complete!"
