#!/bin/bash
# Anytokens 生产环境部署脚本
set -e

echo "=== Anytokens 部署 ==="

# 检查 .env.production
if [ ! -f .env.production ]; then
  echo "错误: .env.production 不存在"
  echo "请先复制并配置: cp .env.production.example .env.production"
  exit 1
fi

# 加载环境变量
export $(grep -v '^#' .env.production | grep -v '^\s*$' | xargs)

# 构建并启动
echo ">>> 构建镜像..."
docker compose -f docker-compose.prod.yml --env-file .env.production build

echo ">>> 启动服务..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# 等待数据库就绪
echo ">>> 等待数据库就绪..."
sleep 5

# 运行数据库迁移
echo ">>> 运行数据库迁移..."
docker compose -f docker-compose.prod.yml --env-file .env.production exec backend npx prisma migrate deploy

echo "=== 部署完成 ==="
echo "前端: http://anytokens.com"
echo "API:  http://api.anytokens.com"
echo ""
echo "查看日志: docker compose -f docker-compose.prod.yml logs -f"
echo "停止服务: docker compose -f docker-compose.prod.yml down"
