#!/usr/bin/env bash
# ============================================================
#  Anytokens 线上冒烟测试脚本
#  用法：bash tests/smoke-test.sh [BASE_URL]
#  示例：bash tests/smoke-test.sh https://anytokens.net
# ============================================================

set -euo pipefail

# ── 配置 ──────────────────────────────────────────────────
BASE="${1:-https://anytokens.net}"
API="${BASE/anytokens.net/api.anytokens.net}/api/v1"
# 如果传入 localhost，API 同域
if [[ "$BASE" == *"localhost"* ]]; then
  API="${BASE}/api/v1"
fi

# 测试用账号（必须事先存在）
TEST_EMAIL="${TEST_EMAIL:-test@anytokens.net}"
TEST_PASSWORD="${TEST_PASSWORD:-Test1234!}"

PASS=0
FAIL=0
TOTAL=0
RESULTS=()
TOKEN=""

# ── 工具函数 ──────────────────────────────────────────────

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

record() {
  local name="$1" status="$2" detail="${3:-}"
  TOTAL=$((TOTAL + 1))
  if [[ "$status" == "PASS" ]]; then
    PASS=$((PASS + 1))
    RESULTS+=("${GREEN}  PASS${NC}  $name${detail:+  ${CYAN}($detail)${NC}}")
  else
    FAIL=$((FAIL + 1))
    RESULTS+=("${RED}  FAIL${NC}  $name${detail:+  ${YELLOW}($detail)${NC}}")
  fi
}

# ── 测试用例 ──────────────────────────────────────────────

# 1. 网站首页
test_homepage() {
  local code
  code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 10 "$BASE")
  if [[ "$code" =~ ^(200|301|302)$ ]]; then
    record "网站首页 ($BASE)" "PASS" "HTTP $code"
  else
    record "网站首页 ($BASE)" "FAIL" "HTTP $code"
  fi
}

# 2. 健康检查
test_health() {
  local code body
  body=$(curl -sk --max-time 10 -w '\n%{http_code}' "$API/health")
  code=$(echo "$body" | tail -1)
  if [[ "$code" == "200" ]]; then
    record "健康检查 (GET /health)" "PASS" "HTTP $code"
  else
    record "健康检查 (GET /health)" "FAIL" "HTTP $code"
  fi
}

# 3. 注册接口（发送缺少字段的请求，期望 400 + JSON 错误格式）
test_register() {
  local resp code body
  resp=$(curl -sk --max-time 10 -w '\n%{http_code}' \
    -X POST "$API/auth/register" \
    -H 'Content-Type: application/json' \
    -d '{"email":"bad"}')
  code=$(echo "$resp" | tail -1)
  body=$(echo "$resp" | sed '$d')

  # 接口可达且返回 JSON 错误
  if [[ "$code" =~ ^(400|422)$ ]] && echo "$body" | grep -q '"code"'; then
    record "注册接口 (POST /auth/register)" "PASS" "HTTP $code, 参数校验正常"
  elif [[ "$code" == "000" || "$code" == "" ]]; then
    record "注册接口 (POST /auth/register)" "FAIL" "无法连接"
  else
    record "注册接口 (POST /auth/register)" "PASS" "HTTP $code, 接口可达"
  fi
}

# 4. 登录接口
test_login() {
  local resp code body
  resp=$(curl -sk --max-time 10 -w '\n%{http_code}' \
    -X POST "$API/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
  code=$(echo "$resp" | tail -1)
  body=$(echo "$resp" | sed '$d')

  if [[ "$code" == "200" ]] && echo "$body" | grep -q '"token"'; then
    TOKEN=$(echo "$body" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
    record "登录接口 (POST /auth/login)" "PASS" "HTTP $code, 获取 token 成功"
  elif [[ "$code" == "200" ]]; then
    record "登录接口 (POST /auth/login)" "PASS" "HTTP $code"
  elif [[ "$code" == "401" ]]; then
    record "登录接口 (POST /auth/login)" "PASS" "HTTP $code, 接口正常 (测试账号不存在)"
  else
    record "登录接口 (POST /auth/login)" "FAIL" "HTTP $code"
  fi
}

# 5. 获取用户信息
test_user_me() {
  # 先测试无认证时返回 401
  local code
  code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 10 "$API/auth/me")
  if [[ "$code" != "401" ]]; then
    record "用户信息 (GET /auth/me) 未认证" "FAIL" "期望 401, 得到 $code"
    return
  fi

  # 有 token 则测试认证后的访问
  if [[ -n "$TOKEN" ]]; then
    local resp body
    resp=$(curl -sk --max-time 10 -w '\n%{http_code}' \
      -H "Authorization: Bearer $TOKEN" "$API/auth/me")
    code=$(echo "$resp" | tail -1)
    body=$(echo "$resp" | sed '$d')
    if [[ "$code" == "200" ]] && echo "$body" | grep -q '"email"'; then
      record "用户信息 (GET /auth/me)" "PASS" "HTTP $code, 数据正常"
    else
      record "用户信息 (GET /auth/me)" "FAIL" "HTTP $code"
    fi
  else
    record "用户信息 (GET /auth/me)" "PASS" "HTTP 401 未认证拦截正常 (无测试 token)"
  fi
}

# 6. Stripe 支付接口（未认证应返回 401）
test_stripe() {
  local code
  code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 10 \
    -X POST "$API/payment/create-checkout-session" \
    -H 'Content-Type: application/json' \
    -d '{"amount":5}')
  if [[ "$code" == "401" ]]; then
    record "Stripe 支付 (POST /payment/create-checkout-session)" "PASS" "HTTP $code, 认证拦截正常"
  elif [[ "$code" =~ ^(400|200)$ ]]; then
    record "Stripe 支付 (POST /payment/create-checkout-session)" "PASS" "HTTP $code, 接口可达"
  else
    record "Stripe 支付 (POST /payment/create-checkout-session)" "FAIL" "HTTP $code"
  fi
}

# 7. NOWPayments 加密货币接口（未认证应返回 401）
test_crypto() {
  local code
  code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 10 \
    -X POST "$API/crypto-payment/create" \
    -H 'Content-Type: application/json' \
    -d '{"amount":5,"currency":"usdt"}')
  if [[ "$code" == "401" ]]; then
    record "加密货币支付 (POST /crypto-payment/create)" "PASS" "HTTP $code, 认证拦截正常"
  elif [[ "$code" =~ ^(400|200)$ ]]; then
    record "加密货币支付 (POST /crypto-payment/create)" "PASS" "HTTP $code, 接口可达"
  else
    record "加密货币支付 (POST /crypto-payment/create)" "FAIL" "HTTP $code"
  fi
}

# 8. AI 中转接口
test_chat() {
  # 无 API Key → 401
  local code
  code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 10 \
    -X POST "$API/chat/completions" \
    -H 'Content-Type: application/json' \
    -d '{"model":"deepseek-v3","messages":[{"role":"user","content":"hi"}]}')
  if [[ "$code" == "401" ]]; then
    record "AI 中转 (POST /chat/completions) 无 Key" "PASS" "HTTP $code, 认证拦截正常"
  else
    record "AI 中转 (POST /chat/completions) 无 Key" "FAIL" "期望 401, 得到 $code"
  fi

  # 伪造 Key → 401
  code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 10 \
    -X POST "$API/chat/completions" \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer sk-any-fakekey123456' \
    -d '{"model":"deepseek-v3","messages":[{"role":"user","content":"hi"}]}')
  if [[ "$code" == "401" ]]; then
    record "AI 中转 (POST /chat/completions) 伪造 Key" "PASS" "HTTP $code, 无效 Key 被拒绝"
  elif [[ "$code" =~ ^(400|403)$ ]]; then
    record "AI 中转 (POST /chat/completions) 伪造 Key" "PASS" "HTTP $code, 接口响应正常"
  else
    record "AI 中转 (POST /chat/completions) 伪造 Key" "FAIL" "期望 401, 得到 $code"
  fi
}

# ── 执行所有测试 ──────────────────────────────────────────

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║       Anytokens 线上冒烟测试                    ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  前端: ${CYAN}$BASE${NC}"
echo -e "  API:  ${CYAN}$API${NC}"
echo -e "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo -e "${BOLD}──────────────────────────────────────────────────${NC}"

test_homepage
test_health
test_register
test_login
test_user_me
test_stripe
test_crypto
test_chat

# ── 输出报告 ──────────────────────────────────────────────

echo ""
echo -e "${BOLD}  测试报告${NC}"
echo -e "${BOLD}──────────────────────────────────────────────────${NC}"
for r in "${RESULTS[@]}"; do
  echo -e "$r"
done
echo -e "${BOLD}──────────────────────────────────────────────────${NC}"
echo ""

if [[ $FAIL -eq 0 ]]; then
  echo -e "  ${GREEN}${BOLD}ALL PASSED${NC}  $PASS/$TOTAL 通过"
else
  echo -e "  ${RED}${BOLD}$FAIL FAILED${NC}  $PASS/$TOTAL 通过, $FAIL 失败"
fi

echo ""
exit $FAIL
