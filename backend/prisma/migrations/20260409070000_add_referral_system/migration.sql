-- 1. 添加 referral_code 和 referred_by 字段（先可选）
ALTER TABLE "users" ADD COLUMN "referral_code" TEXT;
ALTER TABLE "users" ADD COLUMN "referred_by" TEXT;

-- 2. 为现有用户生成唯一邀请码
UPDATE "users" SET "referral_code" = SUBSTRING(gen_random_uuid()::TEXT, 1, 12) WHERE "referral_code" IS NULL;

-- 3. 设置为 NOT NULL 并加唯一约束
ALTER TABLE "users" ALTER COLUMN "referral_code" SET NOT NULL;
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- 4. 创建返佣记录表
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referee_id" TEXT NOT NULL,
    "usage_log_id" TEXT NOT NULL,
    "usage_cost" DECIMAL(12,8) NOT NULL,
    "commission" DECIMAL(12,8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "commissions_referrer_id_created_at_idx" ON "commissions"("referrer_id", "created_at");
CREATE INDEX "commissions_referee_id_idx" ON "commissions"("referee_id");
