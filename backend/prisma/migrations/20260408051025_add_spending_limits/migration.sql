-- AlterTable
ALTER TABLE "users" ADD COLUMN     "max_per_day" DECIMAL(12,6),
ADD COLUMN     "max_per_month" DECIMAL(12,6),
ADD COLUMN     "max_per_request" DECIMAL(12,6);
