-- 扩展 Role 枚举
ALTER TYPE "Role" ADD VALUE 'RESELLER';

-- 创建申请状态枚举
CREATE TYPE "ResellerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Reseller 申请表
CREATE TABLE "reseller_applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "monthly_usage" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ResellerStatus" NOT NULL DEFAULT 'PENDING',
    "review_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reseller_applications_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "reseller_applications_user_id_key" ON "reseller_applications"("user_id");
CREATE INDEX "reseller_applications_status_idx" ON "reseller_applications"("status");

-- Reseller 子账户表
CREATE TABLE "reseller_sub_accounts" (
    "id" TEXT NOT NULL,
    "reseller_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "balance" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "price_markup" DECIMAL(4,2) NOT NULL DEFAULT 1.5,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reseller_sub_accounts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "reseller_sub_accounts_reseller_id_idx" ON "reseller_sub_accounts"("reseller_id");

-- Reseller 子账户 API Key
CREATE TABLE "reseller_api_keys" (
    "id" TEXT NOT NULL,
    "sub_account_id" TEXT NOT NULL,
    "reseller_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default Key',
    "key_hash" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reseller_api_keys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "reseller_api_keys_key_hash_key" ON "reseller_api_keys"("key_hash");

ALTER TABLE "reseller_api_keys" ADD CONSTRAINT "reseller_api_keys_sub_account_id_fkey"
    FOREIGN KEY ("sub_account_id") REFERENCES "reseller_sub_accounts"("id") ON DELETE CASCADE;
