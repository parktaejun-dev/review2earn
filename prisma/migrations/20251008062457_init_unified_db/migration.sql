-- CreateTable
CREATE TABLE "mall_settings" (
    "id" SERIAL NOT NULL,
    "mall_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mall_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" SERIAL NOT NULL,
    "member_id" TEXT NOT NULL,
    "mall_id" TEXT NOT NULL,
    "consented" BOOLEAN NOT NULL DEFAULT false,
    "consented_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "cafe24_board_no" INTEGER NOT NULL,
    "product_no" INTEGER NOT NULL,
    "member_id" TEXT NOT NULL,
    "mall_id" TEXT NOT NULL,
    "content" TEXT,
    "rating" INTEGER,
    "referral_code" TEXT NOT NULL,
    "participate_r2e" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "review_id" INTEGER NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "mall_id" TEXT NOT NULL,
    "order_amount" INTEGER NOT NULL,
    "reviewer_reward" INTEGER NOT NULL,
    "buyer_discount" INTEGER NOT NULL,
    "platform_fee" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mall_settings_mall_id_key" ON "mall_settings"("mall_id");

-- CreateIndex
CREATE INDEX "consents_member_id_mall_id_idx" ON "consents"("member_id", "mall_id");

-- CreateIndex
CREATE UNIQUE INDEX "consents_member_id_mall_id_key" ON "consents"("member_id", "mall_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_referral_code_key" ON "reviews"("referral_code");

-- CreateIndex
CREATE INDEX "reviews_product_no_mall_id_idx" ON "reviews"("product_no", "mall_id");

-- CreateIndex
CREATE INDEX "reviews_member_id_idx" ON "reviews"("member_id");

-- CreateIndex
CREATE INDEX "reviews_referral_code_idx" ON "reviews"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_cafe24_board_no_mall_id_key" ON "reviews"("cafe24_board_no", "mall_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_order_id_key" ON "transactions"("order_id");

-- CreateIndex
CREATE INDEX "transactions_reviewer_id_idx" ON "transactions"("reviewer_id");

-- CreateIndex
CREATE INDEX "transactions_buyer_id_idx" ON "transactions"("buyer_id");

-- CreateIndex
CREATE INDEX "transactions_order_id_idx" ON "transactions"("order_id");

-- CreateIndex
CREATE INDEX "transactions_mall_id_created_at_idx" ON "transactions"("mall_id", "created_at");

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_mall_id_fkey" FOREIGN KEY ("mall_id") REFERENCES "mall_settings"("mall_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_mall_id_fkey" FOREIGN KEY ("mall_id") REFERENCES "mall_settings"("mall_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_member_id_mall_id_fkey" FOREIGN KEY ("member_id", "mall_id") REFERENCES "consents"("member_id", "mall_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_mall_id_fkey" FOREIGN KEY ("mall_id") REFERENCES "mall_settings"("mall_id") ON DELETE CASCADE ON UPDATE CASCADE;
