\# Anytokens — Token 中转站平台



\## 项目概述

\- 项目名称：Anytokens

\- 类型：AI Token 中转/聚合 API 平台

\- 目标用户：开发者、企业、AI 应用搭建者、普通用户（无需技术背景）

\- 目标市场：东南亚（马来西亚为主）

\- 结算货币：USD / MYR / USDT



\## 技术栈

\- 前端：Next.js 14 (App Router) + TailwindCSS + shadcn/ui

\- 后端：Node.js + Express / Fastify

\- 数据库：PostgreSQL（主数据）+ Redis（缓存/限流）

\- 部署：Docker + VPS（推荐 Hetzner / Contabo，节点建议新加坡）

\- 认证：JWT + NextAuth.js



\## 支持模型列表



\### 🆓 免费模型（新用户试用 / 长期免费）

| 模型 | 厂商 | 特点 |

|------|------|------|

| gemini-2.0-flash | Google | 快速、免费额度大 |

| gemini-1.5-flash | Google | 长上下文免费 |

| llama-3.3-70b | Meta | 开源强模型 |

| llama-3.1-8b | Meta | 轻量快速免费 |

| deepseek-v3 | DeepSeek | 国产免费旗舰 ⭐ |

| qwen-turbo | Alibaba | 低价引流款 |

| glm-4-flash | Zhipu | 国产免费模型 |

| mistral-7b | Mistral | 欧洲开源免费 |



\### ⭐ 国产主力模型（重点推广）

| 模型 | 厂商 | 定位 |

|------|------|------|

| deepseek-r1 | DeepSeek | 推理旗舰，媲美 o1 |

| deepseek-v3 | DeepSeek | 性价比最高 |

| deepseek-v2.5 | DeepSeek | 经济实惠 |

| qwen-max | Alibaba | 阿里旗舰 |

| qwen-plus | Alibaba | 均衡性价比 |

| qwen-turbo | Alibaba | 极速低价 |

| qwen-vl-max | Alibaba | 多模态视觉 |

| glm-4 | Zhipu | 清华智谱旗舰 |

| glm-4-flash | Zhipu | 免费引流 |

| ernie-4.0 | Baidu | 百度文心 |

| hunyuan-pro | Tencent | 腾讯混元 |

| moonshot-v1-128k | Moonshot | 超长上下文 |

| yi-large | 01.AI | 零一万物 |



\### 🌍 国际主流模型（付费高端）

| 模型 | 厂商 | 定位 |

|------|------|------|

| gpt-4o | OpenAI | 多模态旗舰 |

| gpt-4o-mini | OpenAI | 性价比之选 |

| gpt-4-turbo | OpenAI | 经典强模型 |

| o1 | OpenAI | 顶级推理 |

| o3-mini | OpenAI | 快速推理 |

| claude-opus-4 | Anthropic | 最强综合 |

| claude-sonnet-4 | Anthropic | 均衡首选 |

| claude-haiku-4 | Anthropic | 极速低价 |

| gemini-2.5-pro | Google | 长上下文强 |

| gemini-2.0-pro | Google | 多模态 |

| grok-3 | xAI | 马斯克旗下 |

| mistral-large | Mistral | 欧洲旗舰 |



\## 核心功能模块



\### 1. 用户系统

\- 邮箱注册/登录（普通用户友好）

\- Google / GitHub OAuth 一键登录

\- 用户仪表盘（余额、用量、账单）

\- 多语言界面（中文 / English / Bahasa Malaysia）



\### 2. API 管理（开发者）

\- API Key 生成、重置、删除

\- 每个 Key 可设置限额、过期时间

\- 调用日志与统计图表

\- 子账号/团队管理



\### 3. 模型路由中转

\- 统一 OpenAI 格式接口（/v1/chat/completions）

\- 智能路由：按价格/速度/可用性自动切换

\- 流式输出（Streaming SSE）支持

\- 国产模型中转节点：新加坡 VPS



\### 4. 计费系统

\- 按 Token 实时计费

\- 余额预警通知（邮件 / Telegram）

\- 详细账单明细（模型 / 时间 / 用量）

\- 管理员定价配置面板



\### 5. 支付集成

\- Stripe（国际信用卡 / Debit Card）

\- 加密货币：USDT (TRC20 / ERC20)、ETH、BTC

\- 推荐使用 NOWPayments API（避免自管私钥）

\- 充值套餐 + 自定义金额

\- 自动到账确认



\### 6. 普通用户界面

\- 简易 Web 聊天界面（无需 API 知识）

\- 模型选择器（一键切换）

\- 对话历史保存

\- 文件上传支持（PDF / 图片）



\### 7. 管理后台

\- 用户管理（封禁 / 充值 / 查询）

\- 模型上下游成本配置

\- 收入统计仪表盘

\- 系统公告与通知



\## 新用户免费试用方案

\- 注册即送：$0.5 美元试用额度

\- 可用模型：仅限免费模型（Gemini Flash / Llama / GLM-4-flash / Qwen-turbo）

\- 有效期：7 天

\- 邀请好友：每成功邀请 1 人额外送 $0.2

\- 目的：体验完整流程 → 引导充值付费



\## 开发规范

\- 代码注释用中文

\- 所有敏感信息放 .env，不提交 Git

\- API 接口统一 /api/v1/ 前缀

\- 错误返回统一格式：{ code, message, data }

\- 日志使用 Winston，保留 30 天

\- 修改前必须先检查所有相关文件，分析潜在冲突，确认修改方案不会影响其他模块，再统一修改，避免改了一处又破坏另一处



\## 当前优先任务

\- \[x] 项目脚手架搭建（Next.js + Node.js）
\- \[x] 数据库 Schema 设计
\- \[x] 用户注册/登录系统（邮箱 + Google/GitHub/Discord OAuth）
\- \[x] API Key 生成与管理
\- \[x] 模型中转核心逻辑（智能路由 + 故障转移）
\- \[x] Stripe 支付集成
\- \[x] USDT/Crypto 收款集成（NOWPayments）
\- \[x] 普通用户聊天界面
\- \[x] 管理后台
\- \[x] 团队管理系统
\- \[x] Reseller 分销系统
\- \[x] 审计日志 + SLA 监控
\- \[x] 邮件通知系统（Resend）
\- \[x] 定价页面 + API 文档
\- \[x] Docker 部署 + SSL + 自动备份 + Uptime Kuma 监控
\- \[x] API Key 速率限制（per-minute/daily/monthly，Redis 计数器，Dashboard 可配置）
\- \[x] 新增端点：PUT /api/v1/keys/:id/rate-limit，GET /api/v1/keys/:id/rate-limit-usage
\- \[x] 用量导出：CSV 下载（用量记录 + 充值账单），日期范围筛选，最多 10000 条
\- \[x] 新增端点：GET /api/v1/user/export/usage，GET /api/v1/user/export/invoices
\- \[x] 移动端响应式优化（汉堡菜单、Sidebar 滑入抽屉、PublicNavbar 下拉菜单、响应式布局）
\- \[x] SiliconFlow 余额监控：每小时自动检查，低于阈值触发邮件 + Webhook 告警
\- \[x] 模型扩充：新增 6 个模型（llama-3.3-70b / llama-3.1-8b / qwen2.5-coder-32b / qwen3-32b / yi-lightning / mistral-7b）
\- \[x] 注意：不直接接入 OpenAI/Anthropic API（违反其转售条款），通过 SiliconFlow 合法代理
\- \[x] 定价修正：gemini-1.5-flash 修复亏损定价，OpenAI Embeddings/Images/TTS 全部迁移至 SiliconFlow（规避转售条款），Groq 模型加价 20%
\- \[x] 注意：tts-1-hd 暂留 OpenAI，待 SiliconFlow 高清 TTS 上线后替换
\- \[ ] 推广计划



\## 安全要求

\- API Key 加密存储（bcrypt hash）

\- 请求频率限制（Redis）

\- SQL 注入防护（ORM 参数化查询）

\- HTTPS 强制跳转

\- 加密货币收款地址每笔独立生成



\## 竞品参考

\- OpenRouter

\- API2D

\- ChatAnywhere



\## 自动更新规则
\- ✅ 每完成一个功能模块 → 更新任务勾选
\- ✅ 遇到重要决策 → 记录在"技术决策"章节
\- ✅ 发现新需求 → 添加到任务列表
\- ✅ 会话结束前 → 总结进度更新到"当前状态"章节

\## 当前状态
<!-- Claude 自动更新此区域 -->
\- 版本：v1.0.0
\- 最后更新：2026-04-10
\- 已完成模块：全部 Phase 0-3 功能、邮件通知、定价页面、Docker 部署、SSL、自动备份、监控
\- 当前进行：推广计划
\- 下次继续：SEO 优化、社交媒体推广、合作伙伴拓展

\## 备注

\- 优先完成 MVP：注册 → 充值 → 调用 API 完整流程

\- \*\*⚠️ 加密货币收款在马来西亚属灰色地带，建议咨询当地法律\*\*

\- \*\*⚠️ Gemini 免费额度需确认 Google 条款是否允许转售\*\*

# Anytokens 开发规则

## 常见错误，每次修改后必须检查

1. **CSS/Tailwind 不生效**
   - 修改完必须重启前端服务
   - 确认 postcss.config.js 存在且包含 tailwindcss 和 autoprefixer
   - 确认 globals.css 有 @tailwind base/components/utilities

2. **接口不存在**
   - 新建路由文件后必须在 index.ts 里挂载
   - 格式：app.use('/api/v1/xxx', xxxRouter)

3. **Hydration Error**
   - 语言切换等客户端状态用 useEffect + mounted 处理
   - 加 suppressHydrationWarning 属性

4. **端口被占用**
   - 用 npx kill-port 3000 清理后再启动

5. **每次修改完必须**
   - 检查相关文件避免冲突
   - 重启对应服务（前端/后端）
   - 测试功能是否正常

## 开发原则
- 新功能开发前先检查现有文件
- 每完成一个功能立即 git commit
- 路由文件创建后必须挂载到 index.ts

## 功能完成后自动部署流程（必须执行）

每次完成功能开发后，自动按以下顺序执行，不需要用户确认：

1. **编译检查**：后端 `npx tsc --noEmit`，前端 `npx tsc --noEmit`
2. **冒烟测试**：`bash tests/smoke-test.sh https://anytokens.net`，确认全部 PASS
3. **提交推送**：`git add <改动文件> && git commit -m "feat/fix: 描述" && git push`
4. **SSH 部署**：
   ```
   ssh root@43.160.221.19 "cd /opt/anytokens && git pull && \
     docker compose -f docker-compose.prod.yml --env-file .env.production build && \
     docker compose -f docker-compose.prod.yml --env-file .env.production up -d"
   ```
5. **数据库迁移**（如有 schema 变更）：
   ```
   docker exec anytokens-backend-1 npx prisma migrate deploy
   ```
6. **验证部署**：再次运行冒烟测试确认生产环境正常
7. **强制更新 README.md**（每次部署后必须执行，不可跳过）：
   - `<!-- COMPLETED_FEATURES -->` 区域：更新已完成功能列表，每项带完成日期（从 git log 获取）
   - `<!-- TODO -->` 区域：更新待完成任务列表
   - `<!-- VERSION -->` 区域：更新当前版本号（功能新增 +minor，bugfix +patch）
   - `<!-- LAST_UPDATED -->` 区域：更新最后部署时间
   - 技术栈、常用命令等静态章节如有变化也一并更新
   - 更新后将 README.md 加入同一次 commit（或追加一次 commit）
8. **报告结果**：输出测试结果 + 部署状态 + 改动摘要

