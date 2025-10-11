/*
  Warnings:

  - The values [EARN] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "TransactionStatus" ADD VALUE 'FAILED';

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('REFERRAL_REWARD', 'WITHDRAW', 'EXPIRE', 'ADJUSTMENT');
ALTER TABLE "r2e_transactions" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "public"."TransactionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "r2e_transactions" ADD COLUMN     "description" TEXT,
ADD COLUMN     "related_order_id" TEXT,
ADD COLUMN     "related_review_id" INTEGER;

-- CreateIndex
CREATE INDEX "r2e_transactions_related_order_id_idx" ON "r2e_transactions"("related_order_id");
