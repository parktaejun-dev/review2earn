-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('REFERRAL_REWARD', 'WITHDRAW', 'EXPIRE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ACCOUNT_ACTIVATION', 'POINT_EARNED', 'POINT_EXPIRY_WARNING', 'WITHDRAWAL_COMPLETED', 'BALANCE_LOW');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('SENT', 'FAILED', 'OPENED');

-- CreateTable
CREATE TABLE "mall_settings" (
    "id" SERIAL NOT NULL,
    "mall_id" TEXT NOT NULL,
    "script_tag_no" INTEGER,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "scopes" TEXT,
    "reviewer_reward_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "buyer_discount_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "platform_fee_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.005,
    "prepaid_balance" INTEGER NOT NULL DEFAULT 0,
    "min_balance_threshold" INTEGER NOT NULL DEFAULT 50000,
    "consent_service_terms" TIMESTAMP(3),
    "consent_privacy" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mall_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "r2e_accounts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "referral_code" TEXT NOT NULL,
    "password" TEXT,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "available_points" INTEGER NOT NULL DEFAULT 0,
    "phone_number" TEXT,
    "ci_value" TEXT,
    "consent_marketing" BOOLEAN NOT NULL DEFAULT false,
    "consent_data_sharing" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "r2e_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "r2e_mall_links" (
    "id" TEXT NOT NULL,
    "r2e_account_id" TEXT NOT NULL,
    "mall_id" TEXT NOT NULL,
    "mall_email" TEXT,
    "mall_member_id" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "r2e_mall_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "cafe24_board_no" INTEGER NOT NULL,
    "product_no" INTEGER NOT NULL,
    "mall_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "member_email" TEXT,
    "r2e_user_id" TEXT,
    "content" TEXT,
    "rating" INTEGER,
    "referral_code" TEXT NOT NULL,
    "participate_r2e" BOOLEAN NOT NULL DEFAULT true,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "conversion_count" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "review_id" INTEGER NOT NULL,
    "mall_id" TEXT NOT NULL,
    "cafe24_order_id" TEXT NOT NULL,
    "product_no" INTEGER NOT NULL,
    "order_amount" DOUBLE PRECISION NOT NULL,
    "reward_amount" DOUBLE PRECISION NOT NULL,
    "reward_rate" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "r2e_transactions" (
    "id" TEXT NOT NULL,
    "r2e_user_id" TEXT NOT NULL,
    "review_id" INTEGER,
    "mall_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "related_order_id" TEXT,
    "related_review_id" INTEGER,
    "referral_code" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "product_reward_rates" (
    "id" SERIAL NOT NULL,
    "mall_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "reviewer_reward_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "buyer_discount_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "platform_fee_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.005,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_reward_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mall_settings_mall_id_key" ON "mall_settings"("mall_id");

-- CreateIndex
CREATE UNIQUE INDEX "r2e_accounts_email_key" ON "r2e_accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "r2e_accounts_referral_code_key" ON "r2e_accounts"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "r2e_accounts_ci_value_key" ON "r2e_accounts"("ci_value");

-- CreateIndex
CREATE INDEX "r2e_accounts_email_idx" ON "r2e_accounts"("email");

-- CreateIndex
CREATE INDEX "r2e_accounts_referral_code_idx" ON "r2e_accounts"("referral_code");

-- CreateIndex
CREATE INDEX "r2e_mall_links_mall_id_idx" ON "r2e_mall_links"("mall_id");

-- CreateIndex
CREATE INDEX "r2e_mall_links_r2e_account_id_idx" ON "r2e_mall_links"("r2e_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "r2e_mall_links_r2e_account_id_mall_id_key" ON "r2e_mall_links"("r2e_account_id", "mall_id");

-- CreateIndex
CREATE INDEX "reviews_mall_id_idx" ON "reviews"("mall_id");

-- CreateIndex
CREATE INDEX "reviews_product_no_mall_id_idx" ON "reviews"("product_no", "mall_id");

-- CreateIndex
CREATE INDEX "reviews_member_id_idx" ON "reviews"("member_id");

-- CreateIndex
CREATE INDEX "reviews_member_email_idx" ON "reviews"("member_email");

-- CreateIndex
CREATE INDEX "reviews_referral_code_idx" ON "reviews"("referral_code");

-- CreateIndex
CREATE INDEX "reviews_r2e_user_id_idx" ON "reviews"("r2e_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_cafe24_board_no_mall_id_key" ON "reviews"("cafe24_board_no", "mall_id");

-- CreateIndex
CREATE INDEX "transactions_review_id_idx" ON "transactions"("review_id");

-- CreateIndex
CREATE INDEX "transactions_mall_id_idx" ON "transactions"("mall_id");

-- CreateIndex
CREATE INDEX "transactions_cafe24_order_id_idx" ON "transactions"("cafe24_order_id");

-- CreateIndex
CREATE INDEX "transactions_mall_id_created_at_idx" ON "transactions"("mall_id", "created_at");

-- CreateIndex
CREATE INDEX "r2e_transactions_r2e_user_id_idx" ON "r2e_transactions"("r2e_user_id");

-- CreateIndex
CREATE INDEX "r2e_transactions_mall_id_idx" ON "r2e_transactions"("mall_id");

-- CreateIndex
CREATE INDEX "r2e_transactions_status_idx" ON "r2e_transactions"("status");

-- CreateIndex
CREATE INDEX "r2e_transactions_type_idx" ON "r2e_transactions"("type");

-- CreateIndex
CREATE INDEX "r2e_transactions_settlement_date_idx" ON "r2e_transactions"("settlement_date");

-- CreateIndex
CREATE INDEX "r2e_transactions_expiry_date_idx" ON "r2e_transactions"("expiry_date");

-- CreateIndex
CREATE INDEX "r2e_transactions_related_order_id_idx" ON "r2e_transactions"("related_order_id");

-- CreateIndex
CREATE INDEX "r2e_transactions_referral_code_idx" ON "r2e_transactions"("referral_code");

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
CREATE INDEX "product_reward_rates_mall_id_idx" ON "product_reward_rates"("mall_id");

-- CreateIndex
CREATE INDEX "product_reward_rates_product_id_idx" ON "product_reward_rates"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_reward_rates_mall_id_product_id_key" ON "product_reward_rates"("mall_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_token_key" ON "auth_tokens"("token");

-- CreateIndex
CREATE INDEX "auth_tokens_email_idx" ON "auth_tokens"("email");

-- CreateIndex
CREATE INDEX "auth_tokens_token_idx" ON "auth_tokens"("token");

-- AddForeignKey
ALTER TABLE "r2e_mall_links" ADD CONSTRAINT "r2e_mall_links_r2e_account_id_fkey" FOREIGN KEY ("r2e_account_id") REFERENCES "r2e_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_mall_id_fkey" FOREIGN KEY ("mall_id") REFERENCES "mall_settings"("mall_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_r2e_user_id_fkey" FOREIGN KEY ("r2e_user_id") REFERENCES "r2e_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_mall_id_fkey" FOREIGN KEY ("mall_id") REFERENCES "mall_settings"("mall_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r2e_transactions" ADD CONSTRAINT "r2e_transactions_r2e_user_id_fkey" FOREIGN KEY ("r2e_user_id") REFERENCES "r2e_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r2e_transactions" ADD CONSTRAINT "r2e_transactions_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_r2e_user_id_fkey" FOREIGN KEY ("r2e_user_id") REFERENCES "r2e_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
