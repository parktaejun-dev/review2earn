/*
  Warnings:

  - You are about to drop the column `order_id` on the `r2e_transactions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."r2e_transactions" DROP CONSTRAINT "r2e_transactions_r2e_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."withdrawal_requests" DROP CONSTRAINT "withdrawal_requests_r2e_user_id_fkey";

-- AlterTable
ALTER TABLE "mall_settings" ALTER COLUMN "platform_fee_rate" SET DEFAULT 0.0025,
ALTER COLUMN "reviewer_reward_rate" SET DEFAULT 0.03;

-- AlterTable
ALTER TABLE "product_reward_rates" ALTER COLUMN "reviewer_reward_rate" SET DEFAULT 0.03,
ALTER COLUMN "platform_fee_rate" SET DEFAULT 0.0025;

-- AlterTable
ALTER TABLE "r2e_transactions" DROP COLUMN "order_id";

-- CreateIndex
CREATE INDEX "r2e_transactions_type_idx" ON "r2e_transactions"("type");

-- CreateIndex
CREATE INDEX "r2e_transactions_referral_code_idx" ON "r2e_transactions"("referral_code");

-- AddForeignKey
ALTER TABLE "r2e_transactions" ADD CONSTRAINT "r2e_transactions_r2e_user_id_fkey" FOREIGN KEY ("r2e_user_id") REFERENCES "r2e_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_r2e_user_id_fkey" FOREIGN KEY ("r2e_user_id") REFERENCES "r2e_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
