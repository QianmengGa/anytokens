# Anytokens

**One API, All AI Models** — 统一 OpenAI 格式接口，无缝接入 30+ 主流 AI 模型。

<!-- VERSION -->
[![Version](https://img.shields.io/badge/Version-v1.0.0-blue)](#changelog)
<!-- /VERSION -->
<!-- LAST_UPDATED -->
[![Last Updated](https://img.shields.io/badge/Updated-2026--04--10-gray)](#changelog)
<!-- /LAST_UPDATED -->
[![Website](https://img.shields.io/badge/Website-anytokens.net-6366f1)](https://anytokens.net)
[![API Docs](https://img.shields.io/badge/Docs-api.anytokens.net-8b5cf6)](https://anytokens.net/docs)
[![Status](https://img.shields.io/badge/Uptime-status.anytokens.net-22c55e)](https://status.anytokens.net)

---

## Quick Start

```bash
# cURL
curl https://api.anytokens.net/v1/chat/completions \
  -H "Authorization: Bearer sk-any-..." \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v3","messages":[{"role":"user","content":"Hello!"}]}'
```

```python
# Python (OpenAI SDK)
from openai import OpenAI

client = OpenAI(base_url="https://api.anytokens.net/v1", api_key="sk-any-...")
r = client.chat.completions.create(model="deepseek-v3", messages=[{"role":"user","content":"Hello!"}])
print(r.choices[0].message.content)
```

```javascript
// Node.js (OpenAI SDK)
import OpenAI from "openai";

const client = new OpenAI({ baseURL: "https://api.anytokens.net/v1", apiKey: "sk-any-..." });
const r = await client.chat.completions.create({
  model: "deepseek-v3",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(r.choices[0].message.content);
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TailwindCSS, shadcn/ui, Zustand, React Query |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL 16 (Prisma ORM), Redis 7 (ioredis) |
| Auth | JWT, NextAuth.js (Credentials + Google / GitHub / Discord OAuth) |
| Payments | Stripe (credit card), NOWPayments (USDT / BTC / ETH) |
| Email | Resend API |
| Deployment | Docker Compose (6 services), Nginx, Let's Encrypt SSL |
| Monitoring | Uptime Kuma, Winston logger (30-day rotation) |
| i18n | 11 languages — zh-CN, zh-TW, en, ja, ko, ms, th, es, fr, de, ru |

---

## Completed Features

<!-- COMPLETED_FEATURES -->
| # | Feature | Date |
|---|---------|------|
| 1 | Project scaffolding — Next.js 14 + Express 5 + PostgreSQL + Redis + Docker | 2026-04-08 |
| 2 | Database schema — 14 tables, Prisma ORM | 2026-04-08 |
| 3 | User registration / login — email verification code + password strength | 2026-04-08 |
| 4 | Homepage + public pages — Hero, models, pricing, quickstart, footer | 2026-04-08 |
| 5 | Multi-language i18n — 11 languages, auto-detect, Zustand store | 2026-04-08 |
| 6 | API Key management — create / delete / per-key usage stats | 2026-04-08 |
| 7 | AI model proxy — SiliconFlow provider, `/v1/chat/completions`, streaming SSE | 2026-04-08 |
| 8 | Dashboard — balance, usage charts, today/month stats | 2026-04-08 |
| 9 | API docs page — quickstart, auth, models, streaming, errors, FAQ | 2026-04-08 |
| 10 | Admin panel — user management, revenue stats, system settings | 2026-04-09 |
| 11 | Stripe payment — checkout session + webhook + auto balance topup | 2026-04-09 |
| 12 | Crypto payment — NOWPayments (USDT/BTC/ETH), IPN webhook | 2026-04-09 |
| 13 | Production Docker deployment + Nginx reverse proxy | 2026-04-09 |
| 14 | HTTPS / SSL — Let's Encrypt auto-renewal (certbot) | 2026-04-09 |
| 15 | OAuth login — Google / GitHub / Discord one-click sign-in | 2026-04-09 |
| 16 | Spending limits — per-request / daily / monthly caps, progress bars | 2026-04-09 |
| 17 | Multi-provider — Google Gemini + Groq added (4 providers total) | 2026-04-09 |
| 18 | Smart routing — price / speed / quality strategies + auto-failover | 2026-04-09 |
| 19 | Referral system — invite code + 10% commission on referee spending | 2026-04-09 |
| 20 | Models comparison page — `/models` with sort, filter, try-now | 2026-04-09 |
| 21 | Team management — create team, invite members, shared balance, team keys | 2026-04-09 |
| 22 | Embeddings / Images / TTS API — OpenAI-compatible extra endpoints | 2026-04-09 |
| 23 | Audit logs + SLA dashboard — availability / latency / error rate / 90-day cleanup | 2026-04-09 |
| 24 | Reseller system — application / approval / sub-accounts / custom markup / revenue | 2026-04-09 |
| 25 | Database auto-backup — daily cron, 7-day retention | 2026-04-09 |
| 26 | Uptime Kuma monitoring — status.anytokens.net | 2026-04-09 |
| 27 | Deep test suite — 59 test cases covering all endpoints + pages | 2026-04-09 |
| 28 | Docker WARN fix — remove redundant `${VAR}` interpolation | 2026-04-10 |
| 29 | status.anytokens.net SSL fix — independent certificate for status subdomain | 2026-04-10 |
| 30 | Pricing page — `/pricing` with plan comparison + detailed model pricing tables | 2026-04-10 |
| 31 | Email notifications — welcome / topup receipt / low balance / team invite (Resend) | 2026-04-10 |
| 32 | Privacy Policy + Terms of Service — /privacy + /terms, bilingual EN/ZH, Stripe-compliant | 2026-04-10 |
| 33 | API Key rate limiting — per-minute/daily/monthly caps, Redis counters, dashboard UI | 2026-04-10 |
<!-- /COMPLETED_FEATURES -->

---

## TODO

<!-- TODO -->
- [ ] Marketing & growth plan — SEO, social media, partnerships
- [ ] Webhook notifications for users (balance events)
- [ ] More AI providers (Anthropic, OpenAI direct, Mistral)
- [ ] File upload in chat (PDF / images)
- [ ] Conversation history persistence
- [ ] Mobile-responsive optimization
- [ ] Usage export (CSV / PDF invoices)
<!-- /TODO -->

---

## Model Pricing

### Free Models (no charge)

| Model | Provider | Notes |
|-------|----------|-------|
| deepseek-v3 | DeepSeek | Flagship free model |
| qwen2.5-7b | Alibaba | Lightweight |
| qwen3-8b | Alibaba | Latest generation |
| glm-4-9b | Zhipu | Tsinghua research |
| deepseek-r1-7b | DeepSeek | Reasoning distill |
| gemini-1.5-flash | Google | Long context |

### Paid Chat Models (USD per 1M tokens)

| Model | Provider | Input | Output |
|-------|----------|------:|-------:|
| deepseek-v3 | DeepSeek | $0.42 | $1.68 |
| deepseek-r1 | DeepSeek | $0.66 | $2.64 |
| qwen2.5-72b | Alibaba | $0.84 | $0.84 |
| gemini-1.5-pro | Google | $1.25 | $5.00 |
| llama3-70b | Groq / SiliconFlow | $0.59 | $0.79 |
| mixtral-8x7b | Groq / SiliconFlow | $0.24 | $0.24 |

### Extra APIs

| Model | Type | Price |
|-------|------|-------|
| text-embedding-3-small | Embeddings | $0.02 / 1M tokens |
| text-embedding-3-large | Embeddings | $0.13 / 1M tokens |
| dall-e-3 | Image Generation | $0.04 / image |
| dall-e-3-hd | Image Generation | $0.08 / image |
| tts-1 | Text-to-Speech | $15.00 / 1M chars |
| tts-1-hd | Text-to-Speech | $30.00 / 1M chars |

Full interactive pricing: [anytokens.net/pricing](https://anytokens.net/pricing)

---

## API Overview

Base URL: `https://api.anytokens.net/api/v1`

### AI Proxy (OpenAI-compatible)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/chat/completions` | API Key | Chat completions (streaming SSE) |
| POST | `/embeddings` | API Key | Text embeddings |
| POST | `/images/generations` | API Key | Image generation |
| POST | `/audio/speech` | API Key | Text-to-speech |

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register (email + verification code) |
| POST | `/auth/login` | Login |
| POST | `/auth/oauth-login` | OAuth (Google / GitHub / Discord) |
| GET | `/auth/me` | Current user info |

### Platform

56 endpoints total across 10 modules (keys, user, admin, payment, crypto-payment, team, reseller, audit, playground, health).

Full endpoint list: [PROJECT_REPORT.md](./PROJECT_REPORT.md#4-api-端点列表)

---

## Project Structure

```
anytokens/
├── backend/                    # Express API server (TypeScript)
│   ├── prisma/schema.prisma    #   14 database tables
│   └── src/
│       ├── routes/             #   16 route modules (56 endpoints)
│       ├── services/           #   10 service classes
│       ├── middleware/         #   auth, rateLimit, errorHandler, requestLogger
│       ├── config/             #   env, database, redis, models (routing + pricing)
│       └── utils/              #   errors, logger, password, response
├── frontend/                   # Next.js 14 web app
│   └── src/
│       ├── app/                #   21 pages (10 public + 11 dashboard)
│       ├── components/         #   layout, providers, 15 shadcn/ui components
│       ├── locales/            #   11 languages (~600 translation keys)
│       └── lib/                #   api, auth, i18n, utils
├── nginx/nginx.conf            # Reverse proxy (3 domains, SSL, rate limiting)
├── scripts/backup-db.sh        # PostgreSQL daily backup
├── tests/
│   ├── smoke-test.sh           #   9 production smoke tests
│   └── deep-test.sh            #   59 comprehensive test cases
├── docker-compose.prod.yml     # Production: 6 services
├── docker-compose.yml          # Development: PostgreSQL + Redis
└── deploy.sh                   # One-click deployment
```

---

## Deployment

### Architecture

```
Internet
  │
  ▼
Nginx (:80/443) ─── SSL termination
  ├── anytokens.net        → Frontend (:3000)
  ├── api.anytokens.net    → Backend  (:4000)
  └── status.anytokens.net → Uptime Kuma (:3001)
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
              PostgreSQL (:5432)      Redis (:6379)
```

### Production Deploy

```bash
git clone https://github.com/QianmengGa/anytokens.git && cd anytokens
cp .env.production.example .env.production   # fill in real values
docker compose -f docker-compose.prod.yml --env-file .env.production build
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
docker exec anytokens-backend-1 npx prisma migrate deploy
```

### SSH Deploy (updates)

```bash
ssh root@43.160.221.19 "cd /opt/anytokens && git pull && \
  docker compose -f docker-compose.prod.yml --env-file .env.production build && \
  docker compose -f docker-compose.prod.yml --env-file .env.production up -d"
```

---

## Common Commands

### Development

```bash
# Start backend (hot reload)
cd backend && npm run dev              # http://localhost:4000

# Start frontend (hot reload)
cd frontend && npm run dev             # http://localhost:3000

# Start databases (Docker)
docker compose up -d                   # PostgreSQL + Redis

# Generate Prisma client after schema changes
cd backend && npx prisma generate

# Create database migration
cd backend && npx prisma migrate dev --name <name>
```

### Testing

```bash
# Smoke test (production, 9 cases)
bash tests/smoke-test.sh https://anytokens.net

# Deep test (production, 59 cases)
bash tests/deep-test.sh https://anytokens.net

# TypeScript compilation check
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

### Database

```bash
# Manual backup
bash scripts/backup-db.sh

# Prisma Studio (GUI)
cd backend && npx prisma studio

# Deploy migrations on production
docker exec anytokens-backend-1 npx prisma migrate deploy
```

### Monitoring

```bash
# Check all containers
docker compose -f docker-compose.prod.yml ps

# View backend logs
docker logs anytokens-backend-1 --tail 100 -f

# Check SSL certificates
ssh root@43.160.221.19 "certbot certificates"
```

---

## Changelog

<!-- CHANGELOG -->
### v1.0.0 — 2026-04-10

Full platform launch with all core features:

- AI model proxy with smart routing and auto-failover (4 providers, 15 models)
- User system with email + OAuth (Google/GitHub/Discord)
- Billing: Stripe + Crypto (NOWPayments), per-token pricing
- Team management, Reseller system, Referral commissions
- Admin panel, Audit logs, SLA monitoring
- Email notifications (Resend API)
- 21 frontend pages, 11 languages, dark mode
- Docker deployment, SSL, auto-backup, Uptime Kuma monitoring
- 68 automated test cases (9 smoke + 59 deep)
<!-- /CHANGELOG -->

---

## License

Proprietary. All rights reserved.

---

> Built with Next.js, Express, PostgreSQL, and Docker.
> Maintained by [@QianmengGa](https://github.com/QianmengGa)
