-- AlterTable
ALTER TABLE "usage_logs" ADD COLUMN     "client_ip" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "last_login_ip" TEXT,
ADD COLUMN     "register_ip" TEXT;
