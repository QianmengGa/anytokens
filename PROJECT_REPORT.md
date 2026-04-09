# Anytokens — 项目报告

> AI Token 中转/聚合 API 平台
> 生成时间：2026-04-10
> 网站：https://anytokens.net | API：https://api.anytokens.net
> GitHub：https://github.com/QianmengGa/anytokens

---

## 1. 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 (App Router) + TailwindCSS + shadcn/ui + Zustand + React Query |
| 后端 | Node.js + Express 5 + TypeScript |
| 数据库 | PostgreSQL 16 (Prisma ORM) + Redis 7 (ioredis) |
| 认证 | JWT + NextAuth.js (Credentials / Google / GitHub / Discord OAuth) |
| 支付 | Stripe (信用卡) + NOWPayments (USDT/BTC/ETH) |
| 邮件 | Resend API (noreply@anytokens.net) |
| 部署 | Docker Compose + Nginx 反向代理 + Let's Encrypt SSL |
| 监控 | Uptime Kuma (status.anytokens.net) |
| 日志 | Winston + daily-rotate-file (30 天保留) |
| 国际化 | 11 种语言 (zh-CN/zh-TW/en/ja/ko/ms/th/es/fr/de/ru) |

---

## 2. 目录结构

```
anytokens/
├── backend/                          # Express 后端
│   ├── Dockerfile
│   ├── prisma/
│   │   └── schema.prisma             # 数据库模型定义
│   ├── prisma.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                  # 启动入口
│       ├── app.ts                    # Express 应用配置
│       ├── config/
│       │   ├── index.ts              # 环境变量集中管理
│       │   ├── database.ts           # Prisma 客户端
│       │   ├── redis.ts              # Redis 连接
│       │   └── models.ts             # 模型路由表 + 定价配置
│       ├── controllers/
│       │   ├── admin.controller.ts
│       │   ├── auth.controller.ts
│       │   ├── health.controller.ts
│       │   ├── keys.controller.ts
│       │   ├── team.controller.ts
│       │   └── user.controller.ts
│       ├── middleware/
│       │   ├── auth.ts               # JWT 认证中间件
│       │   ├── errorHandler.ts       # 全局错误处理
│       │   ├── rateLimit.ts          # Redis 限流
│       │   └── requestLogger.ts      # 请求日志
│       ├── routes/
│       │   ├── index.ts              # 路由注册入口
│       │   ├── auth.ts               # 认证路由
│       │   ├── keys.ts               # API Key 管理
│       │   ├── proxy.ts              # AI 中转核心
│       │   ├── user.ts               # 用户设置
│       │   ├── admin.ts              # 管理后台
│       │   ├── payment.ts            # Stripe 支付
│       │   ├── crypto-payment.ts     # 加密货币支付
│       │   ├── team.ts               # 团队管理
│       │   ├── audit.ts              # 审计日志
│       │   ├── reseller.ts           # 分销系统
│       │   ├── embeddings.ts         # Embeddings API
│       │   ├── images.ts             # 图片生成 API
│       │   ├── audio.ts              # TTS 语音 API
│       │   ├── playground.ts         # Playground 中转
│       │   └── health.ts             # 健康检查
│       ├── services/
│       │   ├── auth.service.ts       # 注册/登录/OAuth/密码重置
│       │   ├── keys.service.ts       # API Key CRUD + 验证
│       │   ├── proxy.service.ts      # 智能路由 + 计费 + 返佣
│       │   ├── email.service.ts      # 邮件通知（欢迎/收据/提醒/邀请）
│       │   ├── user.service.ts       # 用户信息/限额
│       │   ├── admin.service.ts      # 管理后台业务逻辑
│       │   ├── team.service.ts       # 团队 CRUD + 邀请
│       │   ├── reseller.service.ts   # Reseller 申请/子账户/加价
│       │   ├── audit.service.ts      # 审计日志 + SLA 统计
│       │   └── provider-health.ts    # 供应商健康追踪 + 故障转移
│       ├── types/
│       │   └── index.ts              # 全局类型定义
│       └── utils/
│           ├── errors.ts             # 自定义错误类
│           ├── logger.ts             # Winston 日志配置
│           ├── password.ts           # 密码强度校验
│           └── response.ts           # 统一响应格式
│
├── frontend/                         # Next.js 前端
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── layout.tsx            # 根布局（主题/AuthProvider/i18n）
│       │   ├── page.tsx              # 首页（Hero/模型/定价/快速开始）
│       │   ├── globals.css           # 全局样式
│       │   ├── (auth)/
│       │   │   ├── layout.tsx        # 认证页布局
│       │   │   ├── login/page.tsx    # 登录页
│       │   │   ├── register/page.tsx # 注册页
│       │   │   └── forgot-password/page.tsx
│       │   ├── (dashboard)/
│       │   │   ├── layout.tsx        # 仪表盘布局（侧边栏+导航栏）
│       │   │   ├── dashboard/page.tsx    # 概览
│       │   │   ├── api-keys/page.tsx     # API 密钥管理
│       │   │   ├── billing/page.tsx      # 充值/账单
│       │   │   ├── chat/page.tsx         # 聊天界面
│       │   │   ├── settings/page.tsx     # 个人设置
│       │   │   ├── team/page.tsx         # 团队管理
│       │   │   ├── reseller/page.tsx     # 分销系统
│       │   │   ├── audit/page.tsx        # 审计日志 + SLA
│       │   │   └── admin/page.tsx        # 管理后台
│       │   ├── apps/page.tsx         # AI 应用市场
│       │   ├── models/page.tsx       # 模型对比
│       │   ├── pricing/page.tsx      # 定价页
│       │   ├── docs/page.tsx         # API 文档
│       │   ├── playground/page.tsx   # Playground
│       │   ├── enterprise/page.tsx   # 企业版
│       │   └── api/auth/[...nextauth]/route.ts  # NextAuth API
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.tsx        # 仪表盘顶栏
│       │   │   ├── Sidebar.tsx       # 仪表盘侧边栏
│       │   │   └── PublicNavbar.tsx   # 公共页面导航栏
│       │   ├── providers/
│       │   │   ├── AuthProvider.tsx   # NextAuth SessionProvider
│       │   │   ├── QueryProvider.tsx  # React Query Provider
│       │   │   └── I18nProvider.tsx   # 国际化 Provider
│       │   ├── ui/                   # shadcn/ui 组件库
│       │   │   ├── alert-dialog.tsx
│       │   │   ├── avatar.tsx
│       │   │   ├── badge.tsx
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── dropdown-menu.tsx
│       │   │   ├── input.tsx
│       │   │   ├── label.tsx
│       │   │   ├── scroll-area.tsx
│       │   │   ├── select.tsx
│       │   │   ├── separator.tsx
│       │   │   ├── slider.tsx
│       │   │   ├── textarea.tsx
│       │   │   └── tooltip.tsx
│       │   ├── CustomerService.tsx   # 客服悬浮按钮
│       │   ├── LanguageSwitcher.tsx  # 语言切换器（11 语言）
│       │   ├── PasswordStrength.tsx  # 密码强度指示器
│       │   └── ThemeToggle.tsx       # 明暗主题切换
│       ├── data/
│       │   └── ai-apps.ts           # AI 应用数据
│       ├── lib/
│       │   ├── api.ts               # Axios 实例 + 拦截器
│       │   ├── auth.ts              # NextAuth 配置
│       │   ├── country-codes.ts     # 国际区号
│       │   ├── i18n.ts              # Zustand i18n Store
│       │   └── utils.ts             # cn() 工具函数
│       ├── locales/
│       │   └── index.ts             # 11 语言翻译文件（~600 个 key）
│       └── types/
│           └── index.ts             # 前端类型定义
│
├── nginx/
│   └── nginx.conf                   # Nginx 反向代理配置
├── scripts/
│   └── backup-db.sh                 # PostgreSQL 自动备份脚本
├── tests/
│   ├── smoke-test.sh                # 线上冒烟测试（9 项）
│   └── deep-test.sh                 # 深度测试（59 项）
├── docker-compose.yml               # 开发环境
├── docker-compose.prod.yml          # 生产环境（6 个服务）
├── deploy.sh                        # 一键部署脚本
├── .env.example                     # 环境变量模板
├── .env.production.example          # 生产环境变量模板
├── .gitignore
├── CLAUDE.md                        # 开发规范 + AI 助手指令
└── package.json                     # 根目录脚手架
```

---

## 3. 数据库表结构

### 3.1 枚举类型

| 枚举 | 值 | 说明 |
|------|-----|------|
| Role | USER, RESELLER, ADMIN | 用户角色 |
| TransactionType | TOPUP, USAGE, REFUND, BONUS | 交易类型 |
| TransactionStatus | PENDING, COMPLETED, FAILED | 交易状态 |
| PaymentMethod | STRIPE, CRYPTO, ADMIN, SYSTEM | 支付方式 |
| TeamRole | OWNER, ADMIN, MEMBER | 团队角色 |
| ResellerStatus | PENDING, APPROVED, REJECTED | Reseller 申请状态 |

### 3.2 数据表（14 张）

#### users — 用户表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 用户 ID |
| email | String (UNIQUE) | 邮箱 |
| password_hash | String | bcrypt 哈希密码 |
| name | String? | 用户名 |
| phone | String? | 手机号 |
| role | Role | 角色（默认 USER） |
| balance | Decimal(12,6) | 余额（美元） |
| max_per_request | Decimal(12,6)? | 单次调用限额 |
| max_per_day | Decimal(12,6)? | 日消费限额 |
| max_per_month | Decimal(12,6)? | 月消费限额 |
| routing_strategy | String | 路由策略（price/speed/quality） |
| referral_code | String (UNIQUE) | 邀请码（自动生成） |
| referred_by | String? | 邀请人 ID |
| is_active | Boolean | 是否启用 |
| register_ip | String? | 注册 IP |
| last_login_ip | String? | 最后登录 IP |
| last_login_at | DateTime? | 最后登录时间 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

#### api_keys — API 密钥表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 密钥 ID |
| user_id | UUID (FK → users) | 所属用户 |
| team_id | UUID? (FK → teams) | 所属团队（可选） |
| name | String | 密钥名称 |
| key_hash | String (UNIQUE) | bcrypt 哈希值 |
| key_prefix | String | 明文前缀 (sk-any-xxxx) |
| is_active | Boolean | 是否启用 |
| rate_limit | Int | 每分钟请求限制（默认 60） |
| expires_at | DateTime? | 过期时间 |
| last_used_at | DateTime? | 最后使用时间 |
| created_at | DateTime | 创建时间 |

#### transactions — 交易/账单表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 交易 ID |
| user_id | UUID (FK → users) | 所属用户 |
| type | TransactionType | 交易类型 |
| amount | Decimal(12,6) | 金额 |
| balance_before | Decimal(12,6) | 交易前余额 |
| balance_after | Decimal(12,6) | 交易后余额 |
| status | TransactionStatus | 状态 |
| payment_method | PaymentMethod? | 支付方式 |
| external_id | String? | 外部订单 ID |
| description | String? | 描述 |
| metadata | Json? | 扩展数据 |
| created_at | DateTime | 创建时间 |

#### usage_logs — API 调用日志表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 日志 ID |
| user_id | UUID (FK → users) | 调用用户 |
| api_key_id | UUID? (FK → api_keys) | 使用的密钥 |
| model | String | 模型名称 |
| prompt_tokens | Int | 输入 Token 数 |
| completion_tokens | Int | 输出 Token 数 |
| total_tokens | Int | 总 Token 数 |
| cost | Decimal(12,8) | 费用（美元） |
| latency_ms | Int? | 延迟（毫秒） |
| status | String | success / error |
| error_message | String? | 错误信息 |
| client_ip | String? | 客户端 IP |
| created_at | DateTime | 创建时间 |

#### commissions — 返佣记录表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 记录 ID |
| referrer_id | String | 邀请人 ID |
| referee_id | String | 被邀请人 ID |
| usage_log_id | String | 关联调用日志 |
| usage_cost | Decimal(12,8) | 被邀请人消费金额 |
| commission | Decimal(12,8) | 返佣金额（消费 × 10%） |
| created_at | DateTime | 创建时间 |

#### teams — 团队表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 团队 ID |
| name | String | 团队名称 |
| balance | Decimal(12,6) | 团队余额 |
| owner_id | String | 创建者 ID |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

#### team_members — 团队成员表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 记录 ID |
| team_id | UUID (FK → teams) | 团队 ID |
| user_id | UUID | 用户 ID |
| role | TeamRole | 角色 |
| max_per_day | Decimal(12,6)? | 日限额 |
| max_per_month | Decimal(12,6)? | 月限额 |
| created_at | DateTime | 加入时间 |

#### team_invites — 团队邀请表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | CUID (PK) | 邀请 ID |
| team_id | UUID (FK → teams) | 团队 ID |
| email | String | 被邀请邮箱 |
| role | TeamRole | 邀请角色 |
| token | String (UNIQUE) | 邀请令牌 |
| used | Boolean | 是否已使用 |
| expires_at | DateTime | 过期时间（7 天） |
| created_at | DateTime | 创建时间 |

#### email_verifications — 邮箱验证码表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | CUID (PK) | 记录 ID |
| email | String | 邮箱 |
| code | String | 6 位验证码 |
| expires_at | DateTime | 过期时间（10 分钟） |
| used | Boolean | 是否已使用 |
| created_at | DateTime | 创建时间 |

#### password_resets — 密码重置表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | CUID (PK) | 记录 ID |
| email | String | 邮箱 |
| token | String (UNIQUE) | 重置验证码 |
| expires_at | DateTime | 过期时间（10 分钟） |
| used | Boolean | 是否已使用 |
| created_at | DateTime | 创建时间 |

#### audit_logs — 审计日志表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 日志 ID |
| user_id | String? | 操作人 ID |
| action | String | 操作类型 |
| detail | Text? | 操作详情（JSON） |
| ip | String? | 操作 IP |
| user_agent | String? | UA |
| result | String | success / error |
| created_at | DateTime | 创建时间（90 天自动清理） |

#### reseller_applications — Reseller 申请表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 申请 ID |
| user_id | String (UNIQUE) | 申请人 ID |
| company_name | String | 公司名称 |
| monthly_usage | String | 预计月用量 |
| description | Text | 用途说明 |
| status | ResellerStatus | 审核状态 |
| review_note | String? | 审核备注 |
| reviewed_at | DateTime? | 审核时间 |
| created_at | DateTime | 申请时间 |

#### reseller_sub_accounts — Reseller 子账户表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 子账户 ID |
| reseller_id | String | Reseller 用户 ID |
| name | String | 子账户名称 |
| email | String? | 邮箱 |
| balance | Decimal(12,6) | 余额 |
| price_markup | Decimal(4,2) | 加价倍率（默认 1.5） |
| is_active | Boolean | 是否启用 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

#### reseller_api_keys — Reseller 子账户 API Key
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | Key ID |
| sub_account_id | UUID (FK) | 子账户 ID |
| reseller_id | String | Reseller ID |
| name | String | Key 名称 |
| key_hash | String (UNIQUE) | 哈希值 |
| key_prefix | String | 明文前缀 |
| is_active | Boolean | 是否启用 |
| last_used_at | DateTime? | 最后使用时间 |
| created_at | DateTime | 创建时间 |

#### system_settings — 系统设置表
| 字段 | 类型 | 说明 |
|------|------|------|
| key | String (PK) | 设置键名 |
| value | String | 设置值 |
| updated_at | DateTime | 更新时间 |

---

## 4. API 端点列表

所有接口统一前缀 `/api/v1`，返回格式 `{ code, message, data }`。

### 4.1 认证 — `/api/v1/auth`

| 方法 | 路径 | 认证 | 说明 |
|------|------|:----:|------|
| POST | /auth/send-code | — | 发送注册验证码 |
| POST | /auth/register | — | 用户注册（邮箱+验证码+密码） |
| POST | /auth/login | — | 邮箱密码登录 |
| POST | /auth/oauth-login | — | OAuth 社交登录 |
| POST | /auth/forgot-password | — | 发送密码重置验证码 |
| POST | /auth/reset-password | — | 重置密码 |
| GET  | /auth/me | JWT | 获取当前用户信息 |

### 4.2 API Key 管理 — `/api/v1/keys`

| 方法 | 路径 | 认证 | 说明 |
|------|------|:----:|------|
| POST | /keys | JWT | 创建新 API Key |
| GET  | /keys | JWT | 列出用户所有 Key |
| DELETE | /keys/:id | JWT | 删除 Key（软删除） |
| GET  | /keys/:id/usage | JWT | 查看 Key 用量统计 |

### 4.3 AI 中转 — OpenAI 兼容接口

| 方法 | 路径 | 认证 | 说明 |
|------|------|:----:|------|
| POST | /chat/completions | API Key | 聊天补全（核心接口，支持 Streaming SSE） |
| POST | /embeddings | API Key | 文本向量化 |
| POST | /images/generations | API Key | 图片生成 (DALL-E 3) |
| POST | /audio/speech | API Key | 文字转语音 (TTS) |
| POST | /playground/completions | JWT | Playground 专用中转 |

### 4.4 用户设置 — `/api/v1/user`

| 方法 | 路径 | 认证 | 说明 |
|------|------|:----:|------|
| GET  | /user/dashboard-stats | JWT | Dashboard 统计数据 |
| PATCH | /user/profile | JWT | 更新用户名/电话 |
| POST | /user/send-email-code | JWT | 发送修改邮箱验证码 |
| PATCH | /user/email | JWT | 修改邮箱 |
| PATCH | /user/password | JWT | 修改密码 |
| GET  | /user/spending-limits | JWT | 获取消费限额 |
| PATCH | /user/spending-limits | JWT | 更新消费限额 |
| GET  | /user/referral | JWT | 邀请统计 |
| GET  | /user/routing-strategy | JWT | 获取路由策略 |
| PATCH | /user/routing-strategy | JWT | 更新路由策略 |

### 4.5 支付 — `/api/v1/payment` + `/api/v1/crypto-payment`

| 方法 | 路径 | 认证 | 说明 |
|------|------|:----:|------|
| POST | /payment/create-checkout-session | JWT | 创建 Stripe 支付链接 |
| POST | /payment/webhook | — | Stripe Webhook 回调 |
| POST | /crypto-payment/create | JWT | 创建加密货币支付订单 |
| GET  | /crypto-payment/status/:paymentId | JWT | 查询加密支付状态 |
| POST | /crypto-payment/webhook | — | NOWPayments IPN 回调 |

### 4.6 团队管理 — `/api/v1/team`

| 方法 | 路径 | 认证 | 说明 |
|------|------|:----:|------|
| POST | /team | JWT | 创建团队 |
| GET  | /team | JWT | 列出用户所有团队 |
| GET  | /team/:teamId | JWT | 获取团队详情 |
| POST | /team/:teamId/invite | JWT | 邀请成员 |
| POST | /team/accept-invite | JWT | 接受邀请 |
| DELETE | /team/:teamId/members/:userId | JWT | 移除成员 |
| PATCH | /team/:teamId/members/:userId/limits | JWT | 更新成员限额 |
| POST | /team/:teamId/keys | JWT | 创建团队 API Key |
| GET  | /team/:teamId/keys | JWT | 列出团队 Key |
| DELETE | /team/:teamId/keys/:keyId | JWT | 删除团队 Key |

### 4.7 分销系统 — `/api/v1/reseller`

| 方法 | 路径 | 认证 | 说明 |
|------|------|:----:|------|
| POST | /reseller/apply | JWT | 提交 Reseller 申请 |
| GET  | /reseller/application | JWT | 查看申请状态 |
| GET  | /reseller/stats | JWT | Reseller 收入统计 |
| POST | /reseller/sub-accounts | JWT | 创建子账户 |
| GET  | /reseller/sub-accounts | JWT | 列出子账户 |
| POST | /reseller/sub-accounts/:id/topup | JWT | 子账户充值 |
| PATCH | /reseller/sub-accounts/:id/markup | JWT | 更新加价倍率 |
| GET  | /reseller/admin/applications | JWT+Admin | 列出所有申请 |
| PATCH | /reseller/admin/applications/:id | JWT+Admin | 审批申请 |
| GET  | /reseller/admin/resellers | JWT+Admin | 列出所有 Reseller |

### 4.8 审计日志 — `/api/v1/audit`

| 方法 | 路径 | 认证 | 说明 |
|------|------|:----:|------|
| GET  | /audit/my | JWT | 当前用户审计日志 |
| GET  | /audit/sla | JWT | SLA 监控统计 |
| GET  | /audit/all | JWT+Admin | 所有用户日志 |
| POST | /audit/cleanup | JWT+Admin | 手动清理过期日志 |

### 4.9 管理后台 — `/api/v1/admin`

| 方法 | 路径 | 认证 | 说明 |
|------|------|:----:|------|
| GET  | /admin/users | JWT+Admin | 用户列表 |
| PATCH | /admin/users/:id/balance | JWT+Admin | 调整余额 |
| PATCH | /admin/users/:id/ban | JWT+Admin | 封禁/解封 |
| GET  | /admin/stats | JWT+Admin | 平台总览统计 |
| GET  | /admin/stats/daily | JWT+Admin | 每日统计趋势 |
| GET  | /admin/stats/token-ranking | JWT+Admin | Token 排行榜 |
| GET  | /admin/transactions | JWT+Admin | 充值记录 |
| GET  | /admin/usage | JWT+Admin | 使用记录 |
| GET  | /admin/my-usage | JWT+Admin | 管理员个人消耗 |
| GET  | /admin/providers/balance | JWT+Admin | 供应商余额 |
| GET  | /admin/settings | JWT+Admin | 系统设置 |
| PATCH | /admin/settings | JWT+Admin | 更新设置 |

### 4.10 其他

| 方法 | 路径 | 认证 | 说明 |
|------|------|:----:|------|
| GET  | /health | — | 健康检查 |

---

## 5. 前端页面

### 5.1 公开页面

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | Hero + 模型列表 + 定价 + 快速开始 + 支付方式 |
| `/login` | 登录 | 邮箱密码 + Google/GitHub/Discord OAuth |
| `/register` | 注册 | 邮箱验证码 + 密码强度检测 + 邀请码 |
| `/forgot-password` | 忘记密码 | 邮箱验证码重置密码 |
| `/apps` | 应用市场 | 100+ AI 应用推荐 + 搜索筛选 |
| `/models` | 模型对比 | 所有模型排序/筛选/对比 |
| `/pricing` | 定价 | 三档计划 + 详细模型定价表 |
| `/docs` | API 文档 | 快速开始/认证/模型/Chat/Streaming/错误/计费/FAQ |
| `/playground` | Playground | 在线调试 AI 模型（登录用户可用） |
| `/enterprise` | 企业版 | 企业功能介绍 + 联系表单 |

### 5.2 仪表盘页面（需登录）

| 路径 | 页面 | 说明 |
|------|------|------|
| `/dashboard` | 概览 | 余额/Key 数/调用量/Token 消耗/邀请返佣 |
| `/api-keys` | API 密钥 | 创建/删除 Key + 每个 Key 用量统计 |
| `/billing` | 充值/账单 | Stripe/USDT 充值 + 交易记录 |
| `/chat` | 聊天 | 简易 Web 聊天界面（选择模型对话） |
| `/settings` | 设置 | 个人信息/修改邮箱/修改密码/路由策略/消费限额 |
| `/team` | 团队 | 创建团队/邀请成员/共享余额/团队 Key |
| `/reseller` | 分销 | 申请 Reseller/子账户管理/加价设置/收入统计 |
| `/audit` | 审计 | 操作日志/SLA 可用性/平均延迟/错误率 |
| `/admin` | 管理后台 | 用户管理/充值记录/用量统计/供应商余额/系统设置（仅 Admin） |

---

## 6. 支持的 AI 模型

### 6.1 Chat Completions 模型

| 模型 | 供应商 | Input/1M | Output/1M | 免费 |
|------|--------|----------|-----------|:----:|
| deepseek-v3 | SiliconFlow | $0.42 | $1.68 | — |
| deepseek-r1 | SiliconFlow | $0.66 | $2.64 | — |
| qwen2.5-72b | SiliconFlow | $0.84 | $0.84 | — |
| qwen2.5-7b | SiliconFlow | — | — | ✅ |
| qwen3-8b | SiliconFlow | — | — | ✅ |
| glm-4-9b | SiliconFlow | — | — | ✅ |
| deepseek-r1-7b | SiliconFlow | — | — | ✅ |
| gemini-1.5-pro | Google | $1.25 | $5.00 | — |
| gemini-1.5-flash | Google | — | — | ✅ |
| llama3-70b | Groq + SiliconFlow | $0.59 | $0.79 | — |
| mixtral-8x7b | Groq + SiliconFlow | $0.24 | $0.24 | — |

### 6.2 Embeddings 模型

| 模型 | 供应商 | 定价 |
|------|--------|------|
| text-embedding-3-small | OpenAI | $0.02 / 1M tokens |
| text-embedding-3-large | OpenAI | $0.13 / 1M tokens |

### 6.3 图片生成模型

| 模型 | 供应商 | 定价 |
|------|--------|------|
| dall-e-3 | OpenAI | $0.04 / 张 |
| dall-e-3-hd | OpenAI | $0.08 / 张 |

### 6.4 TTS 语音模型

| 模型 | 供应商 | 定价 |
|------|--------|------|
| tts-1 | OpenAI | $15.00 / 1M chars |
| tts-1-hd | OpenAI | $30.00 / 1M chars |

---

## 7. 核心功能模块

### 7.1 智能路由引擎
- 三种路由策略：价格优先 / 速度优先 / 质量优先
- 每个模型支持多个供应商，按策略排序
- 供应商健康追踪：记录成功率、延迟、故障
- 自动故障转移：当前供应商失败自动切换到备用

### 7.2 计费系统
- 按 Token 实时计费（精度 Decimal(12,8)）
- 事务内原子操作：扣费 + 记录交易 + 写日志
- 三种扣费渠道：个人余额 / 团队余额 / Reseller 子账户余额
- 消费限额：单次 / 日 / 月限额，超限自动拒绝
- 赠送余额保护：赠送额度限制高价模型调用

### 7.3 邀请返佣
- 每个用户自动生成邀请码
- 被邀请人消费后，邀请人获得 10% 返佣
- 返佣自动到账余额 + 记录返佣流水

### 7.4 邮件通知系统
- 发件人：noreply@anytokens.net (Resend API)
- 统一品牌模板（紫色渐变 Header + Logo + Footer）
- 触发场景：
  - 注册成功 → 欢迎邮件（含 $0.50 额度提示）
  - 充值成功 → 收据邮件（金额/支付方式/余额/交易号）
  - 余额 < $1 → 余额不足提醒（Redis 限频 24h/用户）
  - 团队邀请 → 邀请邮件（含一键接受链接）
- 所有邮件异步发送，失败仅记日志

### 7.5 Reseller 分销系统
- 申请 → 管理员审批 → 获得 RESELLER 角色
- 创建子账户 + 分配余额 + 自定义加价倍率
- 子账户独立 API Key，按加价后费率扣费
- Reseller 按批发价扣费，差价即利润

### 7.6 团队管理
- 创建团队 + 邀请成员（OWNER/ADMIN/MEMBER）
- 团队共享余额 + 团队 API Key
- 成员独立消费限额控制
- 邀请邮件自动发送

---

## 8. 部署架构

### 8.1 Docker Compose 服务（6 个）

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  Nginx   │───>│ Frontend │    │ Uptime   │
│  :80/443 │    │  :3000   │    │  Kuma    │
│          │───>│          │    │  :3001   │
│          │    └──────────┘    └──────────┘
│          │
│          │───>┌──────────┐
│          │    │ Backend  │
│          │    │  :4000   │
└──────────┘    └────┬─────┘
                     │
              ┌──────┴──────┐
              │             │
        ┌─────┴────┐  ┌────┴─────┐
        │PostgreSQL │  │  Redis   │
        │  :5432    │  │  :6379   │
        └──────────┘  └──────────┘
```

### 8.2 域名配置

| 域名 | 指向 | 用途 |
|------|------|------|
| anytokens.net | frontend:3000 | 前端网站 |
| api.anytokens.net | backend:4000 | API 服务 |
| status.anytokens.net | uptime-kuma:3001 | 状态监控页 |

### 8.3 SSL

- Let's Encrypt 自动签发 + 自动续期
- anytokens.net + api.anytokens.net 共用证书
- status.anytokens.net 独立证书

### 8.4 自动备份

- 脚本：`scripts/backup-db.sh`
- 频率：每日凌晨 2 点（crontab）
- 保留：最近 7 天
- 路径：`/opt/anytokens/backups/`

---

## 9. 安全措施

| 措施 | 实现 |
|------|------|
| API Key 加密存储 | bcrypt hash（明文仅创建时返回一次） |
| 密码加密 | bcrypt (salt round 12) |
| 请求限流 | Redis 令牌桶（API 30r/s, Web 60r/s） |
| SQL 注入防护 | Prisma ORM 参数化查询 |
| XSS 防护 | Helmet 安全头 + CSP |
| HTTPS 强制 | Nginx 80→443 重定向 |
| CORS 限制 | 仅允许 anytokens.net |
| JWT 签名 | HS256 + 7 天过期 |
| Webhook 签名验证 | Stripe / NOWPayments 签名校验 |
| 审计日志 | 所有敏感操作记录（90 天自动清理） |

---

## 10. 环境变量

| 变量名 | 说明 |
|--------|------|
| DATABASE_URL | PostgreSQL 连接串 |
| REDIS_URL | Redis 连接串 |
| JWT_SECRET | JWT 签名密钥 |
| JWT_EXPIRES_IN | JWT 有效期（默认 7d） |
| CORS_ORIGIN | 允许的前端域名 |
| FRONTEND_URL | 前端地址（拼接邮件链接用） |
| NEXT_PUBLIC_API_URL | 前端访问的 API 地址 |
| NEXTAUTH_SECRET | NextAuth 加密密钥 |
| NEXTAUTH_URL | NextAuth 回调地址 |
| RESEND_API_KEY | Resend 邮件服务 Key |
| SILICONFLOW_API_KEY | 硅基流动 API Key |
| GOOGLE_API_KEY | Google Gemini API Key |
| GROQ_API_KEY | Groq API Key |
| OPENAI_API_KEY | OpenAI API Key |
| STRIPE_SECRET_KEY | Stripe 密钥 |
| STRIPE_WEBHOOK_SECRET | Stripe Webhook 签名密钥 |
| NOWPAYMENTS_API_KEY | NOWPayments API Key |
| NOWPAYMENTS_IPN_SECRET | NOWPayments IPN 签名密钥 |
| GOOGLE_CLIENT_ID / SECRET | Google OAuth |
| GITHUB_CLIENT_ID / SECRET | GitHub OAuth |
| DISCORD_CLIENT_ID / SECRET | Discord OAuth |
| ADMIN_EMAIL | 管理员邮箱（自动升级角色） |
| POSTGRES_USER / PASSWORD / DB | PostgreSQL 认证 |

---

## 11. 测试覆盖

### 冒烟测试（smoke-test.sh）— 9 项
- 网站首页可达
- 健康检查接口
- 注册/登录参数校验
- JWT 认证拦截
- 支付接口认证拦截
- AI 中转无 Key / 伪造 Key 拦截

### 深度测试（deep-test.sh）— 59 项
- 全部 API 端点可达性
- 注册完整流程（验证码 → 注册 → 登录 → 获取信息）
- API Key CRUD + 用量查询
- AI 中转（Chat/Embeddings/Images/TTS）
- 支付链路（Stripe/Crypto）
- 团队全流程（创建 → 邀请 → Key）
- 管理后台（用户/统计/设置）
- 审计日志 + SLA
- Reseller 完整流程
- 前端页面可达性（全部 20+ 页面）

---

## 12. Git 提交历史（最近 20 次）

```
b9e8b0f feat: 邮件通知系统 — 欢迎/充值收据/余额提醒/团队邀请
fccf8cb feat: Docker WARN 修复 + status SSL + 定价页面 + 域名修正
f405d52 feat: 数据库自动备份 + Uptime Kuma 监控 + 深度测试脚本
e656594 feat: Reseller 分销系统 — 申请审批/子账户/自定义加价/独立Key/收入统计
b89390a fix: audit 页面移除未使用的 Input import
c90283e feat: 审计日志 + SLA 监控面板 — 操作记录/可用性/延迟/错误率/90天自动清理
8b9b153 feat: 新增 Embeddings/Images/TTS 三种 API + OpenAI 供应商 + 用量统计
af5a879 fix: 移除 team 页面未使用的 import
7ae48d1 feat: 多租户团队系统 — 创建团队/邀请成员/共享余额/团队Key/用量统计
6bc140a docs: CLAUDE.md 添加功能完成后自动部署流程规范
9f1ad90 feat: 模型对比页面 /models — 排序筛选 + 立即试用 + 11语言
da3d978 fix: register 页面 useSearchParams 包裹 Suspense
ce5fa81 feat: 邀请返佣系统 — 邀请码 + 10%消费返佣 + Dashboard 统计
489fd5f feat: 智能路由 — 价格/速度/质量策略 + 故障自动转移 + 供应商健康追踪
cc88801 fix: nginx 支持 certbot webroot 验证，SSL 证书自动续期
a6562be feat: 接入 Google Gemini 和 Groq 供应商，新增 4 个模型
d4ceee4 fix: 健康检查使用 127.0.0.1 避免 IPv6 解析问题
9433267 fix: nginx DNS 解析失败 — 使用 Docker resolver + 健康检查
5b9ab69 feat: 消费限额进度条+警告提示
291f597 feat: add Google/GitHub/Discord OAuth login, remove phone registration
```

---

## 13. 统计数据

| 指标 | 数量 |
|------|------|
| 后端源文件 | 45 个 (.ts) |
| 前端源文件 | 40 个 (.tsx/.ts) |
| API 端点 | 56 个 |
| 数据库表 | 14 张 |
| 前端页面 | 21 个 |
| UI 组件 | 15 个 (shadcn/ui) |
| 支持语言 | 11 种 |
| 翻译 key | ~600 个 |
| AI 模型 | 15 个 (4 供应商) |
| Docker 服务 | 6 个 |
| 测试用例 | 68 项 (9 冒烟 + 59 深度) |
