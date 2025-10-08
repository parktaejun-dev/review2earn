/*
  Warnings:

  - You are about to drop the column `buyer_discount` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `buyer_id` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `order_id` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `platform_fee` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `reviewer_id` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `reviewer_reward` on the `transactions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[referral_code,mall_id]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cafe24_order_id` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_no` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reward_amount` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reward_rate` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."transactions" DROP CONSTRAINT "transactions_review_id_fkey";

-- DropIndex
DROP INDEX "public"."transactions_buyer_id_idx";

-- DropIndex
DROP INDEX "public"."transactions_order_id_idx";

-- DropIndex
DROP INDEX "public"."transactions_order_id_key";

-- DropIndex
DROP INDEX "public"."transactions_reviewer_id_idx";

-- AlterTable
ALTER TABLE "mall_settings" ADD COLUMN     "buyer_discount_rate" DOUBLE PRECISION DEFAULT 0.05,
ADD COLUMN     "platform_fee_rate" DOUBLE PRECISION DEFAULT 0.005,
ADD COLUMN     "reviewer_reward_rate" DOUBLE PRECISION DEFAULT 0.01;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "buyer_discount",
DROP COLUMN "buyer_id",
DROP COLUMN "order_id",
DROP COLUMN "platform_fee",
DROP COLUMN "reviewer_id",
DROP COLUMN "reviewer_reward",
ADD COLUMN     "cafe24_order_id" TEXT NOT NULL,
ADD COLUMN     "product_no" INTEGER NOT NULL,
ADD COLUMN     "reward_amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "reward_rate" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "order_amount" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "reviews_referral_code_mall_id_key" ON "reviews"("referral_code", "mall_id");

-- CreateIndex
CREATE INDEX "transactions_review_id_idx" ON "transactions"("review_id");

-- CreateIndex
CREATE INDEX "transactions_mall_id_idx" ON "transactions"("mall_id");

-- CreateIndex
CREATE INDEX "transactions_cafe24_order_id_idx" ON "transactions"("cafe24_order_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
