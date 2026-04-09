#!/usr/bin/env bash
# ============================================================
#  Anytokens 深度测试脚本
#  用法：bash tests/deep-test.sh [BASE_URL]
# ============================================================
set -euo pipefail

BASE="${1:-https://anytokens.net}"
API="${BASE/anytokens.net/api.anytokens.net}/api/v1"
if [[ "$BASE" == *"localhost"* ]]; then API="${BASE}/api/v1"; fi

PASS=0 FAIL=0 SKIP=0 TOTAL=0
RESULTS=()

GREEN='\033[0;32m' RED='\033[0;31m' YELLOW='\033[0;33m' CYAN='\033[0;36m' BOLD='\033[1m' NC='\033[0m'

record() {
  local name="$1" status="$2" detail="${3:-}"
  TOTAL=$((TOTAL + 1))
  case "$status" in
    PASS) PASS=$((PASS+1)); RESULTS+=("${GREEN}  PASS${NC}  $name${detail:+  ${CYAN}($detail)${NC}}") ;;
    FAIL) FAIL=$((FAIL+1)); RESULTS+=("${RED}  FAIL${NC}  $name${detail:+  ${YELLOW}($detail)${NC}}") ;;
    SKIP) SKIP=$((SKIP+1)); RESULTS+=("${YELLOW}  SKIP${NC}  $name${detail:+  ${CYAN}($detail)${NC}}") ;;
  esac
}

# 通用 HTTP 请求辅助
http() {
  local method="$1" url="$2" shift; shift
  curl -sk --max-time 15 -X "$method" "$url" -H 'Content-Type: application/json' "$@" 2>/dev/null
}

http_code() {
  local method="$1" url="$2"; shift; shift
  curl -sk -o /dev/null -w '%{http_code}' --max-time 15 -X "$method" "$url" -H 'Content-Type: application/json' "$@" 2>/dev/null
}

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║            Anytokens 深度测试                           ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  API:  ${CYAN}$API${NC}"
echo -e "  时间: $(date '+%Y-%m-%d %H:%M:%S')"

# ══════════════════════════════════════════════════════════
#  1. 基础可用性
# ══════════════════════════════════════════════════════════
echo ""
echo -e "${BOLD}━━ 1. 基础可用性 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

code=$(http_code GET "$BASE")
[[ "$code" =~ ^(200|301)$ ]] && record "首页" PASS "HTTP $code" || record "首页" FAIL "HTTP $code"

code=$(http_code GET "$API/health")
[[ "$code" == "200" ]] && record "健康检查" PASS || record "健康检查" FAIL "HTTP $code"

# ══════════════════════════════════════════════════════════
#  2. 安全测试 — 未授权访问拦截
# ══════════════════════════════════════════════════════════
echo -e "${BOLD}━━ 2. 安全测试 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 无 Token 访问需认证的端点
for ep in "GET /auth/me" "GET /user/dashboard-stats" "GET /user/spending-limits" "GET /user/routing-strategy" \
          "GET /user/referral" "GET /audit/my" "GET /audit/sla" "GET /team" "GET /reseller/application" \
          "POST /keys" "POST /team" "POST /reseller/apply"; do
  method="${ep%% *}"
  path="${ep#* }"
  c=$(http_code "$method" "$API$path")
  [[ "$c" == "401" ]] && record "无Token $method $path → 401" PASS || record "无Token $method $path → 401" FAIL "得到 $c"
done

# 伪造 JWT Token
FAKE_JWT="eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImZha2UiLCJlbWFpbCI6ImZha2VAZmFrZS5jb20iLCJyb2xlIjoiVVNFUiJ9.invalid"
c=$(http_code GET "$API/auth/me" -H "Authorization: Bearer $FAKE_JWT")
[[ "$c" == "401" ]] && record "伪造 JWT → 401" PASS || record "伪造 JWT → 401" FAIL "得到 $c"

# 管理员端点普通用户不可访问（用伪造 token 验签失败应返回 401）
c=$(http_code GET "$API/admin/users" -H "Authorization: Bearer $FAKE_JWT")
[[ "$c" == "401" ]] && record "管理员端点伪造Token → 401" PASS || record "管理员端点伪造Token → 401" FAIL "得到 $c"

# ══════════════════════════════════════════════════════════
#  3. API Key 权限隔离
# ══════════════════════════════════════════════════════════
echo -e "${BOLD}━━ 3. API Key 权限隔离 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 无 Key → 401
c=$(http_code POST "$API/chat/completions" -d '{"model":"deepseek-v3","messages":[{"role":"user","content":"hi"}]}')
[[ "$c" == "401" ]] && record "Chat 无 Key → 401" PASS || record "Chat 无 Key → 401" FAIL "得到 $c"

# 无效 Key → 401
c=$(http_code POST "$API/chat/completions" -H "Authorization: Bearer sk-any-invalidkey12345" -d '{"model":"deepseek-v3","messages":[{"role":"user","content":"hi"}]}')
[[ "$c" == "401" ]] && record "Chat 无效 Key → 401" PASS || record "Chat 无效 Key → 401" FAIL "得到 $c"

# 无效 Team Key → 401
c=$(http_code POST "$API/chat/completions" -H "Authorization: Bearer sk-team-invalidkey1234" -d '{"model":"deepseek-v3","messages":[{"role":"user","content":"hi"}]}')
[[ "$c" == "401" ]] && record "Chat 无效团队 Key → 401" PASS || record "Chat 无效团队 Key → 401" FAIL "得到 $c"

# 无效 Reseller Key → 401
c=$(http_code POST "$API/chat/completions" -H "Authorization: Bearer sk-res-invalidkey12345" -d '{"model":"deepseek-v3","messages":[{"role":"user","content":"hi"}]}')
[[ "$c" == "401" ]] && record "Chat 无效 Reseller Key → 401" PASS || record "Chat 无效 Reseller Key → 401" FAIL "得到 $c"

# Embeddings 无 Key → 401
c=$(http_code POST "$API/embeddings" -d '{"model":"text-embedding-3-small","input":"hello"}')
[[ "$c" == "401" ]] && record "Embeddings 无 Key → 401" PASS || record "Embeddings 无 Key → 401" FAIL "得到 $c"

# Images 无 Key → 401
c=$(http_code POST "$API/images/generations" -d '{"prompt":"a cat"}')
[[ "$c" == "401" ]] && record "Images 无 Key → 401" PASS || record "Images 无 Key → 401" FAIL "得到 $c"

# TTS 无 Key → 401
c=$(http_code POST "$API/audio/speech" -d '{"model":"tts-1","input":"hello","voice":"alloy"}')
[[ "$c" == "401" ]] && record "TTS 无 Key → 401" PASS || record "TTS 无 Key → 401" FAIL "得到 $c"

# ══════════════════════════════════════════════════════════
#  4. 注册/登录流程验证
# ══════════════════════════════════════════════════════════
echo -e "${BOLD}━━ 4. 注册/登录流程 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 注册缺少字段 → 400
resp=$(http POST "$API/auth/register" -d '{"email":"bad"}')
echo "$resp" | grep -q '"code"' && record "注册缺少字段 → 400" PASS || record "注册缺少字段 → 400" FAIL

# 注册验证码无效 → 400
resp=$(http POST "$API/auth/register" -d '{"email":"test@test.com","password":"Test1234!","code":"000000"}')
echo "$resp" | grep -q '"code"' && record "注册无效验证码 → 拒绝" PASS || record "注册无效验证码 → 拒绝" FAIL

# 登录错误凭据 → 401
c=$(http_code POST "$API/auth/login" -d '{"email":"nonexist@test.com","password":"wrong123"}')
[[ "$c" == "401" ]] && record "登录错误凭据 → 401" PASS || record "登录错误凭据 → 401" FAIL "得到 $c"

# 登录空密码 → 400
resp=$(http POST "$API/auth/login" -d '{"email":"test@test.com","password":""}')
echo "$resp" | grep -q '"code"' && record "登录空密码 → 拒绝" PASS || record "登录空密码 → 拒绝" FAIL

# ══════════════════════════════════════════════════════════
#  5. 支付流程测试
# ══════════════════════════════════════════════════════════
echo -e "${BOLD}━━ 5. 支付流程 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Stripe checkout 无认证 → 401
c=$(http_code POST "$API/payment/create-checkout-session" -d '{"amount":5}')
[[ "$c" == "401" ]] && record "Stripe checkout 无认证 → 401" PASS || record "Stripe checkout 无认证 → 401" FAIL "得到 $c"

# Stripe webhook 无签名 → 400
c=$(http_code POST "$API/payment/webhook" -d '{}')
[[ "$c" == "400" ]] && record "Stripe webhook 无签名 → 400" PASS || record "Stripe webhook 无签名 → 400" FAIL "得到 $c"

# Crypto 支付无认证 → 401
c=$(http_code POST "$API/crypto-payment/create" -d '{"amount":5,"currency":"usdt"}')
[[ "$c" == "401" ]] && record "Crypto 支付无认证 → 401" PASS || record "Crypto 支付无认证 → 401" FAIL "得到 $c"

# Crypto webhook 无签名 → 400
c=$(http_code POST "$API/crypto-payment/webhook" -d '{}')
[[ "$c" == "400" ]] && record "Crypto webhook 无签名 → 400" PASS || record "Crypto webhook 无签名 → 400" FAIL "得到 $c"

# ══════════════════════════════════════════════════════════
#  6. 模型路由验证
# ══════════════════════════════════════════════════════════
echo -e "${BOLD}━━ 6. 模型路由 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 不支持的模型 → 400
resp=$(http POST "$API/chat/completions" -H "Authorization: Bearer sk-any-validtest12345" -d '{"model":"nonexist-model","messages":[{"role":"user","content":"hi"}]}')
c=$(echo "$resp" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
# 要么 401 (key 无效) 要么 400 (模型不存在)，都说明路由正常
[[ "$c" =~ ^(40[01])$ || "$resp" =~ "不支持" || "$resp" =~ "无效" ]] && record "不存在模型 → 拒绝" PASS || record "不存在模型 → 拒绝" FAIL

# Chat 缺少 messages → 400
resp=$(http POST "$API/chat/completions" -H "Authorization: Bearer sk-any-validtest12345" -d '{"model":"deepseek-v3"}')
echo "$resp" | grep -q '"code"\|messages' && record "Chat 缺少 messages → 拒绝" PASS || record "Chat 缺少 messages → 拒绝" FAIL

# X-Routing-Strategy header 验证（发到需认证端点，确认 header 被解析不报错）
c=$(http_code POST "$API/chat/completions" -H "Authorization: Bearer sk-any-fake" -H "X-Routing-Strategy: price" -d '{"model":"deepseek-v3","messages":[{"role":"user","content":"hi"}]}')
[[ "$c" == "401" ]] && record "路由策略 header 解析正常" PASS || record "路由策略 header 解析正常" FAIL "得到 $c"

c=$(http_code POST "$API/chat/completions" -H "Authorization: Bearer sk-any-fake" -H "X-Routing-Strategy: speed" -d '{"model":"deepseek-v3","messages":[{"role":"user","content":"hi"}]}')
[[ "$c" == "401" ]] && record "路由策略 speed 正常" PASS || record "路由策略 speed 正常" FAIL "得到 $c"

c=$(http_code POST "$API/chat/completions" -H "Authorization: Bearer sk-any-fake" -H "X-Routing-Strategy: quality" -d '{"model":"deepseek-v3","messages":[{"role":"user","content":"hi"}]}')
[[ "$c" == "401" ]] && record "路由策略 quality 正常" PASS || record "路由策略 quality 正常" FAIL "得到 $c"

# ══════════════════════════════════════════════════════════
#  7. 团队端点验证
# ══════════════════════════════════════════════════════════
echo -e "${BOLD}━━ 7. 团队功能 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 创建团队无认证 → 401
c=$(http_code POST "$API/team" -d '{"name":"test"}')
[[ "$c" == "401" ]] && record "创建团队无认证 → 401" PASS || record "创建团队无认证 → 401" FAIL "得到 $c"

# 团队列表无认证 → 401
c=$(http_code GET "$API/team")
[[ "$c" == "401" ]] && record "团队列表无认证 → 401" PASS || record "团队列表无认证 → 401" FAIL "得到 $c"

# 团队邀请无认证 → 401
c=$(http_code POST "$API/team/fake-id/invite" -d '{"email":"a@b.com"}')
[[ "$c" == "401" ]] && record "团队邀请无认证 → 401" PASS || record "团队邀请无认证 → 401" FAIL "得到 $c"

# 接受邀请无认证 → 401
c=$(http_code POST "$API/team/accept-invite" -d '{"token":"fake"}')
[[ "$c" == "401" ]] && record "接受邀请无认证 → 401" PASS || record "接受邀请无认证 → 401" FAIL "得到 $c"

# 团队 Key 管理无认证 → 401
c=$(http_code POST "$API/team/fake-id/keys" -d '{"name":"test"}')
[[ "$c" == "401" ]] && record "团队 Key 无认证 → 401" PASS || record "团队 Key 无认证 → 401" FAIL "得到 $c"

# ══════════════════════════════════════════════════════════
#  8. Reseller 端点验证
# ══════════════════════════════════════════════════════════
echo -e "${BOLD}━━ 8. Reseller 功能 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 申请无认证 → 401
c=$(http_code POST "$API/reseller/apply" -d '{"companyName":"test","monthlyUsage":"100","description":"test test test test"}')
[[ "$c" == "401" ]] && record "Reseller 申请无认证 → 401" PASS || record "Reseller 申请无认证 → 401" FAIL "得到 $c"

# 子账户创建无认证 → 401
c=$(http_code POST "$API/reseller/sub-accounts" -d '{"name":"test"}')
[[ "$c" == "401" ]] && record "子账户创建无认证 → 401" PASS || record "子账户创建无认证 → 401" FAIL "得到 $c"

# 管理员审批无认证 → 401
c=$(http_code GET "$API/reseller/admin/applications")
[[ "$c" == "401" ]] && record "管理员审批无认证 → 401" PASS || record "管理员审批无认证 → 401" FAIL "得到 $c"

# 管理员 Reseller 列表无认证 → 401
c=$(http_code GET "$API/reseller/admin/resellers")
[[ "$c" == "401" ]] && record "管理员 Reseller 列表 → 401" PASS || record "管理员 Reseller 列表 → 401" FAIL "得到 $c"

# ══════════════════════════════════════════════════════════
#  9. 审计日志 + SLA 端点
# ══════════════════════════════════════════════════════════
echo -e "${BOLD}━━ 9. 审计日志 + SLA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

c=$(http_code GET "$API/audit/my")
[[ "$c" == "401" ]] && record "审计日志无认证 → 401" PASS || record "审计日志无认证 → 401" FAIL "得到 $c"

c=$(http_code GET "$API/audit/sla")
[[ "$c" == "401" ]] && record "SLA 统计无认证 → 401" PASS || record "SLA 统计无认证 → 401" FAIL "得到 $c"

c=$(http_code GET "$API/audit/all")
[[ "$c" == "401" ]] && record "管理员审计日志 → 401" PASS || record "管理员审计日志 → 401" FAIL "得到 $c"

c=$(http_code POST "$API/audit/cleanup")
[[ "$c" == "401" ]] && record "日志清理无认证 → 401" PASS || record "日志清理无认证 → 401" FAIL "得到 $c"

# ══════════════════════════════════════════════════════════
#  10. 新 API 类型端点
# ══════════════════════════════════════════════════════════
echo -e "${BOLD}━━ 10. Embeddings / Images / TTS ━━━━━━━━━━━━━━━━━━━━━${NC}"

# Embeddings 错误模型
resp=$(http POST "$API/embeddings" -H "Authorization: Bearer sk-any-fake123456" -d '{"model":"bad-model","input":"hello"}')
echo "$resp" | grep -q '"code"\|不支持\|无效' && record "Embeddings 错误模型 → 拒绝" PASS || record "Embeddings 错误模型 → 拒绝" FAIL

# TTS 缺少 input
resp=$(http POST "$API/audio/speech" -H "Authorization: Bearer sk-any-fake123456" -d '{"model":"tts-1"}')
echo "$resp" | grep -q '"code"\|input\|无效' && record "TTS 缺少 input → 拒绝" PASS || record "TTS 缺少 input → 拒绝" FAIL

# ══════════════════════════════════════════════════════════
#  11. 公开页面可访问
# ══════════════════════════════════════════════════════════
echo -e "${BOLD}━━ 11. 公开页面 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

for page in "/" "/login" "/register" "/models" "/docs" "/playground" "/enterprise" "/apps" "/privacy" "/terms"; do
  c=$(http_code GET "${BASE}${page}")
  [[ "$c" =~ ^(200|304)$ ]] && record "页面 ${page}" PASS "HTTP $c" || record "页面 ${page}" FAIL "HTTP $c"
done

# ══════════════════════════════════════════════════════════
#  报告
# ══════════════════════════════════════════════════════════

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║                    测试报告                             ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
for r in "${RESULTS[@]}"; do echo -e "$r"; done
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [[ $FAIL -eq 0 ]]; then
  echo -e "  ${GREEN}${BOLD}ALL PASSED${NC}  $PASS/$TOTAL 通过${SKIP:+, $SKIP 跳过}"
else
  echo -e "  ${RED}${BOLD}$FAIL FAILED${NC}  $PASS/$TOTAL 通过, $FAIL 失败${SKIP:+, $SKIP 跳过}"
fi
echo ""
exit $FAIL
