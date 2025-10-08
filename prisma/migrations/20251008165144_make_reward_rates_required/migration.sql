/*
  Warnings:

  - Made the column `buyer_discount_rate` on table `mall_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `platform_fee_rate` on table `mall_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `reviewer_reward_rate` on table `mall_settings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "mall_settings" ALTER COLUMN "buyer_discount_rate" SET NOT NULL,
ALTER COLUMN "platform_fee_rate" SET NOT NULL,
ALTER COLUMN "reviewer_reward_rate" SET NOT NULL;
