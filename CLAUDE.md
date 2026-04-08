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

\- \[x] 用户注册/登录系统

\- \[ ] API Key 生成与管理

\- \[ ] 模型中转核心逻辑

\- \[ ] Stripe 支付集成

\- \[ ] USDT 收款集成

\- \[ ] 普通用户聊天界面

\- \[ ] 管理后台



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
\- 最后更新：2026-04-08
\- 已完成模块：项目脚手架、数据库 Schema、用户注册/登录、前端页面骨架、Docker 配置
\- 当前进行：脚手架搭建完成
\- 下次继续：API Key 管理、模型中转核心逻辑、支付集成

\## 备注

\- 优先完成 MVP：注册 → 充值 → 调用 API 完整流程

\- \*\*⚠️ 加密货币收款在马来西亚属灰色地带，建议咨询当地法律\*\*

\- \*\*⚠️ Gemini 免费额度需确认 Google 条款是否允许转售\*\*

