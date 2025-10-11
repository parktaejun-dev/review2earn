/*
  Warnings:

  - You are about to drop the column `is_verified` on the `r2e_mall_links` table. All the data in the column will be lost.
  - You are about to drop the column `mall_email` on the `r2e_mall_links` table. All the data in the column will be lost.
  - You are about to drop the column `mall_member_id` on the `r2e_mall_links` table. All the data in the column will be lost.
  - Made the column `member_email` on table `reviews` required. This step will fail if there are existing NULL values in that column.
  - Made the column `r2e_user_id` on table `reviews` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."reviews" DROP CONSTRAINT "reviews_r2e_user_id_fkey";

-- AlterTable
ALTER TABLE "r2e_mall_links" DROP COLUMN "is_verified",
DROP COLUMN "mall_email",
DROP COLUMN "mall_member_id",
ADD COLUMN     "member_id" TEXT;

-- AlterTable
ALTER TABLE "reviews" ALTER COLUMN "member_email" SET NOT NULL,
ALTER COLUMN "r2e_user_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "r2e_mall_links_member_id_idx" ON "r2e_mall_links"("member_id");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_r2e_user_id_fkey" FOREIGN KEY ("r2e_user_id") REFERENCES "r2e_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
