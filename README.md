# Anytokens

**One API, All AI Models** — 统一 OpenAI 格式接口，无缝接入 30+ 主流 AI 模型。

[![Website](https://img.shields.io/badge/Website-anytokens.net-6366f1)](https://anytokens.net)
[![Status](https://img.shields.io/badge/Status-status.anytokens.net-22c55e)](https://status.anytokens.net)
[![Version](https://img.shields.io/badge/Version-v1.0.0-blue)](#)
[![Last Updated](https://img.shields.io/badge/Updated-2026--04--10-gray)](#)

---

## What is Anytokens?

Anytokens 是一个 AI Token 中转/聚合 API 平台，提供统一的 OpenAI 兼容接口，让开发者只需修改一行 `base_url` 即可访问 GPT-4o、Claude、Gemini、DeepSeek 等 30+ AI 模型。

```bash
curl https://api.anytokens.net/v1/chat/completions \
  -H "Authorization: Bearer sk-any-..." \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v3","messages":[{"role":"user","content":"Hello!"}]}'
```

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.anytokens.net/v1",
    api_key="sk-any-...",
)
response = client.chat.completions.create(
    model="deepseek-v3",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response.choices[0].message.content)
```

---

## Features

### Core
- **Unified API** — OpenAI compatible format, supports Chat / Embeddings / Images / TTS
- **Smart Routing** — Auto-switch providers by price / speed / quality, with failover
- **Streaming SSE** — Real-time token streaming, compatible with all OpenAI SDKs
- **Pay-per-Token** — Transparent pricing, no subscriptions, no minimums

### Models
- **15 models** across 4 providers (SiliconFlow, Google, Groq, OpenAI)
- **6 free models** — DeepSeek V3, Qwen 2.5-7B, Qwen3-8B, GLM-4-9B, DeepSeek R1-7B, Gemini 1.5 Flash
- Embeddings (text-embedding-3), Images (DALL-E 3), TTS (tts-1/tts-1-hd)

### Platform
- **Auth** — Email + Google / GitHub / Discord OAuth
- **Dashboard** — Balance, usage stats, API call logs, referral tracking
- **API Key Management** — Create / delete keys with per-key usage stats
- **Billing** — Stripe (credit card) + Crypto (USDT/BTC/ETH via NOWPayments)
- **Team Management** — Shared balance, team API keys, member limits
- **Reseller System** — Sub-accounts, custom markup, independent keys
- **Admin Panel** — User management, revenue stats, provider monitoring, system settings
- **Audit Logs** — Operation logs + SLA dashboard (availability / latency / error rate)
- **Email Notifications** — Welcome / topup receipt / low balance / team invite (Resend API)
- **11 Languages** — zh-CN, zh-TW, en, ja, ko, ms, th, es, fr, de, ru
- **Dark Mode** — System / light / dark theme toggle

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TailwindCSS + shadcn/ui + Zustand |
| Backend | Node.js + Express 5 + TypeScript |
| Database | PostgreSQL 16 (Prisma ORM) + Redis 7 |
| Auth | JWT + NextAuth.js |
| Payments | Stripe + NOWPayments |
| Email | Resend API |
| Deploy | Docker Compose + Nginx + Let's Encrypt |
| Monitoring | Uptime Kuma |

---

## API Endpoints

Base URL: `https://api.anytokens.net/api/v1`

### AI Proxy (OpenAI Compatible)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/chat/completions` | API Key | Chat completions (streaming supported) |
| POST | `/embeddings` | API Key | Text embeddings |
| POST | `/images/generations` | API Key | Image generation (DALL-E 3) |
| POST | `/audio/speech` | API Key | Text-to-speech |

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/send-code` | Send verification code |
| POST | `/auth/register` | Register |
| POST | `/auth/login` | Login |
| POST | `/auth/oauth-login` | OAuth login |
| GET | `/auth/me` | Get current user |

### User / Keys / Billing / Team / Admin
56 endpoints total — see [PROJECT_REPORT.md](./PROJECT_REPORT.md) for the full list.

---

## Model Pricing

### Free Models
| Model | Provider |
|-------|----------|
| deepseek-v3 | DeepSeek |
| qwen2.5-7b | Alibaba |
| qwen3-8b | Alibaba |
| glm-4-9b | Zhipu |
| deepseek-r1-7b | DeepSeek |
| gemini-1.5-flash | Google |

### Paid Models (per 1M tokens, USD)
| Model | Provider | Input | Output |
|-------|----------|-------|--------|
| deepseek-r1 | DeepSeek | $0.66 | $2.64 |
| qwen2.5-72b | Alibaba | $0.84 | $0.84 |
| gemini-1.5-pro | Google | $1.25 | $5.00 |
| llama3-70b | Groq | $0.59 | $0.79 |
| mixtral-8x7b | Groq | $0.24 | $0.24 |

Full pricing at [anytokens.net/pricing](https://anytokens.net/pricing)

---

## Project Structure

```
anytokens/
├── backend/                # Express API server
│   ├── prisma/             #   Prisma schema (14 tables)
│   └── src/
│       ├── routes/         #   16 route modules
│       ├── services/       #   10 service classes
│       ├── middleware/      #   Auth, rate limit, error handler
│       └── config/         #   Models, providers, env
├── frontend/               # Next.js web app
│   └── src/
│       ├── app/            #   21 pages (App Router)
│       ├── components/     #   Layout + UI components
│       └── locales/        #   11 language translations
├── nginx/                  # Reverse proxy config
├── scripts/                # DB backup script
├── tests/                  # Smoke + deep tests (68 cases)
├── docker-compose.prod.yml # Production (6 services)
└── deploy.sh               # One-click deploy
```

---

## Deployment

### Architecture

```
Nginx (:80/443)
  ├── anytokens.net      → Frontend (:3000)
  ├── api.anytokens.net  → Backend  (:4000)
  └── status.anytokens.net → Uptime Kuma (:3001)

Backend → PostgreSQL (:5432) + Redis (:6379)
```

### Quick Deploy

```bash
# Clone
git clone https://github.com/QianmengGa/anytokens.git
cd anytokens

# Configure
cp .env.production.example .env.production
# Edit .env.production with your keys

# Deploy
docker compose -f docker-compose.prod.yml --env-file .env.production build
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Database migration
docker exec anytokens-backend-1 npx prisma migrate deploy
```

---

## Development

```bash
# Backend
cd backend
cp ../.env.example .env
npm install
npx prisma generate
npm run dev          # http://localhost:4000

# Frontend
cd frontend
npm install
npm run dev          # http://localhost:3000
```

---

## Completed Features

<!-- AUTO-UPDATED: Claude updates this section after each deployment -->

- [x] Project scaffolding (Next.js 14 + Express 5 + Docker)
- [x] Database schema (14 tables, Prisma ORM)
- [x] User auth (email + Google / GitHub / Discord OAuth)
- [x] API Key management (create / delete / usage stats)
- [x] AI proxy core (chat / embeddings / images / TTS)
- [x] Smart routing (price / speed / quality + failover)
- [x] Billing system (per-token, spending limits)
- [x] Stripe payment integration
- [x] Crypto payment (NOWPayments — USDT / BTC / ETH)
- [x] Web chat interface
- [x] Admin panel (users / stats / settings / providers)
- [x] Team management (shared balance, team keys)
- [x] Referral system (10% commission)
- [x] Reseller system (sub-accounts, custom markup)
- [x] Audit logs + SLA monitoring
- [x] Email notifications (welcome / receipt / low balance / invite)
- [x] Pricing page + API docs
- [x] 11 language i18n
- [x] Dark mode
- [x] Docker deployment + Nginx + SSL auto-renewal
- [x] Database auto-backup (daily, 7-day retention)
- [x] Uptime Kuma monitoring (status.anytokens.net)
- [x] Smoke tests (9 cases) + Deep tests (59 cases)
- [ ] Marketing & growth plan

---

## Version History

| Version | Date | Highlights |
|---------|------|-----------|
| v1.0.0 | 2026-04-10 | Full platform launch — all core features complete |

---

## License

Proprietary. All rights reserved.

---

> Built with Next.js, Express, PostgreSQL, and Docker.
> Maintained by [QianmengGa](https://github.com/QianmengGa).
