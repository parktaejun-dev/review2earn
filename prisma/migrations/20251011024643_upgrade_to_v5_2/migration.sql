/*
  Warnings:

  - You are about to drop the `consents` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EARN', 'WITHDRAW', 'EXPIRE');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ACCOUNT_ACTIVATION', 'POINT_EARNED', 'POINT_EXPIRY_WARNING', 'WITHDRAWAL_COMPLETED', 'BALANCE_LOW');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('SENT', 'FAILED', 'OPENED');

-- DropForeignKey
ALTER TABLE "public"."consents" DROP CONSTRAINT "consents_mall_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reviews" DROP CONSTRAINT "reviews_member_id_mall_id_fkey";

-- AlterTable
ALTER TABLE "mall_settings" ADD COLUMN     "consent_privacy" TIMESTAMP(3),
ADD COLUMN     "consent_service_terms" TIMESTAMP(3),
ADD COLUMN     "min_balance_threshold" INTEGER NOT NULL DEFAULT 50000,
ADD COLUMN     "prepaid_balance" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "buyer_discount_rate" SET DEFAULT 0.03,
ALTER COLUMN "platform_fee_rate" SET DEFAULT 0.01,
ALTER COLUMN "reviewer_reward_rate" SET DEFAULT 0.02;

-- AlterTable
ALTER TABLE "product_reward_rates" ALTER COLUMN "reviewer_reward_rate" SET DEFAULT 0.02,
ALTER COLUMN "buyer_discount_rate" SET DEFAULT 0.03,
ALTER COLUMN "platform_fee_rate" SET DEFAULT 0.01;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "r2e_user_id" TEXT;

-- DropTable
DROP TABLE "public"."consents";

-- CreateTable
CREATE TABLE "r2e_accounts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "ci_value" TEXT,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "available_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),
    "consent_marketing" BOOLEAN NOT NULL DEFAULT false,
    "consent_data_sharing" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "r2e_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "r2e_transactions" (
    "id" TEXT NOT NULL,
    "r2e_user_id" TEXT NOT NULL,
    "review_id" INTEGER,
    "mall_id" TEXT NOT NULL,
    "order_id" TEXT,
    "referral_code" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "type" "TransactionType" NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settlement_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "r2e_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL,
    "r2e_user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_holder" TEXT NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "admin_note" TEXT,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "NotificationStatus" NOT NULL DEFAULT 'SENT',
    "content" TEXT NOT NULL,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "r2e_accounts_email_key" ON "r2e_accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "r2e_accounts_ci_value_key" ON "r2e_accounts"("ci_value");

-- CreateIndex
CREATE INDEX "r2e_transactions_r2e_user_id_idx" ON "r2e_transactions"("r2e_user_id");

-- CreateIndex
CREATE INDEX "r2e_transactions_status_idx" ON "r2e_transactions"("status");

-- CreateIndex
CREATE INDEX "r2e_transactions_settlement_date_idx" ON "r2e_transactions"("settlement_date");

-- CreateIndex
CREATE INDEX "r2e_transactions_expiry_date_idx" ON "r2e_transactions"("expiry_date");

-- CreateIndex
CREATE INDEX "withdrawal_requests_r2e_user_id_idx" ON "withdrawal_requests"("r2e_user_id");

-- CreateIndex
CREATE INDEX "withdrawal_requests_status_idx" ON "withdrawal_requests"("status");

-- CreateIndex
CREATE INDEX "notification_logs_user_id_idx" ON "notification_logs"("user_id");

-- CreateIndex
CREATE INDEX "notification_logs_type_idx" ON "notification_logs"("type");

-- CreateIndex
CREATE INDEX "notification_logs_sent_at_idx" ON "notification_logs"("sent_at");

-- CreateIndex
CREATE INDEX "reviews_r2e_user_id_idx" ON "reviews"("r2e_user_id");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_r2e_user_id_fkey" FOREIGN KEY ("r2e_user_id") REFERENCES "r2e_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r2e_transactions" ADD CONSTRAINT "r2e_transactions_r2e_user_id_fkey" FOREIGN KEY ("r2e_user_id") REFERENCES "r2e_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r2e_transactions" ADD CONSTRAINT "r2e_transactions_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_r2e_user_id_fkey" FOREIGN KEY ("r2e_user_id") REFERENCES "r2e_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
