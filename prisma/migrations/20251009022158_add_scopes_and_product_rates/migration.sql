-- AlterTable
ALTER TABLE "mall_settings" ADD COLUMN     "scopes" TEXT;

-- CreateTable
CREATE TABLE "product_reward_rates" (
    "id" SERIAL NOT NULL,
    "mall_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "reviewer_reward_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.015,
    "buyer_discount_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.07,
    "platform_fee_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.005,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_reward_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_reward_rates_mall_id_idx" ON "product_reward_rates"("mall_id");

-- CreateIndex
CREATE INDEX "product_reward_rates_product_id_idx" ON "product_reward_rates"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_reward_rates_mall_id_product_id_key" ON "product_reward_rates"("mall_id", "product_id");
