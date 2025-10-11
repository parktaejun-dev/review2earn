#!/bin/bash

echo "🔧 Fixing PrismaClient imports..."

# src/app/api/admin/[mallId]/stats/route.ts
sed -i '' '4d' src/app/api/admin/[mallId]/stats/route.ts
sed -i '' '1a\
import { prisma } from "@/lib/prisma";
' src/app/api/admin/[mallId]/stats/route.ts

# src/app/api/cafe24/scripttags/register/route.ts
sed -i '' '8d' src/app/api/cafe24/scripttags/register/route.ts
sed -i '' '2a\
import { prisma } from "@/lib/prisma";
' src/app/api/cafe24/scripttags/register/route.ts

# src/app/api/webhooks/cafe24/route.ts
sed -i '' '9d' src/app/api/webhooks/cafe24/route.ts
sed -i '' '3a\
import { prisma } from "@/lib/prisma";
' src/app/api/webhooks/cafe24/route.ts

echo "✅ PrismaClient imports fixed!"
