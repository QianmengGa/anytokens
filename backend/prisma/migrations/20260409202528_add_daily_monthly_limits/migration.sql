/*
  Warnings:

  - You are about to drop the column `usage_cost` on the `commissions` table. All the data in the column will be lost.
  - Added the required column `usageCost` to the `commissions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "api_keys" DROP CONSTRAINT "api_keys_team_id_fkey";

-- DropForeignKey
ALTER TABLE "reseller_api_keys" DROP CONSTRAINT "reseller_api_keys_sub_account_id_fkey";

-- DropForeignKey
ALTER TABLE "team_invites" DROP CONSTRAINT "team_invites_team_id_fkey";

-- DropForeignKey
ALTER TABLE "team_members" DROP CONSTRAINT "team_members_team_id_fkey";

-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "daily_limit" INTEGER,
ADD COLUMN     "monthly_limit" INTEGER,
ALTER COLUMN "rate_limit" DROP NOT NULL;

-- AlterTable
ALTER TABLE "commissions" DROP COLUMN "usage_cost",
ADD COLUMN     "usageCost" DECIMAL(12,8) NOT NULL;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reseller_api_keys" ADD CONSTRAINT "reseller_api_keys_sub_account_id_fkey" FOREIGN KEY ("sub_account_id") REFERENCES "reseller_sub_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
