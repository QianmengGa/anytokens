import { Router, Request, Response } from 'express';

const router = Router();

const SYSTEM_PROMPT = `You are a helpful AI customer service assistant for Anytokens (anytokens.net).

## About Anytokens
Anytokens is a unified AI API gateway supporting 80+ models with OpenAI-compatible format.
- Base URL: https://api.anytokens.net/v1
- Docs: https://anytokens.net/docs
- Website: https://anytokens.net

## Free Models (no cost, unlimited usage)
deepseek-v3, gemini-2.0-flash, qwen2.5-7b, qwen3-8b, qwen3-32b, qwen2.5-coder-32b, llama-3.3-70b, llama-3.1-8b, glm-4-9b, glm-4.5-air, deepseek-r1-7b, deepseek-r1-0528-8b, qwen3.5-9b, qwen3.5-4b, qwen3-vl-8b, glm-z1-9b, hunyuan-mt-7b, ling-mini-2.0, internlm2.5-7b, mistral-7b

## Paid Models (per 1M tokens, input/output USD)
- deepseek-r1: $0.70 / $2.50
- deepseek-v3 (paid tier): $0.32 / $0.89
- gemini-2.5-pro: $1.25 / $10.00
- gemini-2.0-flash (paid): $0.10 / $0.40
- grok-3: $3.00 / $15.00
- grok-3-mini: $0.30 / $0.50
- mistral-large: $2.00 / $6.00
- mistral-small: $0.10 / $0.30
- llama-3.3-70b (paid): $0.59 / $0.79
- phi-4: $0.07 / $0.14
- phi-4-mini: $0.025 / $0.05
- qwen2.5-72b: $0.12 / $0.39
- qwen3-235b: $0.50 / $2.00
- qwq-32b: $0.14 / $0.55
- glm-4.7: $0.55 / $1.65
- glm-5: $1.50 / $6.00
- glm-5.1: $2.00 / $8.00
- kimi-k2: $0.14 / $0.55
- kimi-k2.5: $0.21 / $0.82
- minimax-m2.5: $0.29 / $1.15
- step-3.5-flash: $0.10 / $0.41
- ernie-4.5: $2.80 / $11.20
- qwen3.5-397b: $3.50 / $14.00
- codestral: $0.20 / $0.60

## Features
- API key management with usage tracking and spending limits
- Team management (invite members, shared billing)
- Referral system: earn 10% commission on referred users' spending
- Reseller program: create sub-accounts with custom pricing
- Webhook notifications for balance alerts
- Rate limiting: 20 req/min (free tier), 60 req/min (paid tier)
- Register bonus: $0.50 free credit on signup

## Payments
- Credit card via Stripe (Visa/MasterCard)
- Crypto: USDT (TRC20/ERC20), BTC, ETH via NOWPayments
- Minimum top-up: $5

## Authentication
- Email/password registration
- OAuth: Google, GitHub, Discord

## How to use the API
Replace OpenAI base_url with https://api.anytokens.net/v1 and use your Anytokens API key. All OpenAI-compatible clients work (Python SDK, Node.js SDK, ChatBox, LobeChat, NextChat, etc.)

## Contact & Support
- Email: support@anytokens.net
- Telegram: https://t.me/anytokens_support
- Human support available via Telegram for issues AI cannot resolve

## Rules
- Always reply in the SAME language the user writes in
- Be friendly, professional, and concise (under 200 words per reply)
- For account-specific issues (billing errors, API key problems), direct to support@anytokens.net or Telegram
- Never make up information not listed above
- If asked about a model not listed, say it's not currently supported
- Always mention the $0.50 signup bonus when users ask about getting started`;

router.post('/message', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const validMessages = messages.slice(-8).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: String(msg.content).slice(0, 1000),
    }));

    const widgetKey = process.env.WIDGET_API_KEY;
    if (!widgetKey) {
      return res.status(500).json({ error: 'Widget API key not configured' });
    }

    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/api/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${widgetKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v3',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...validMessages,
        ],
        max_tokens: 400,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API error:', response.status, errText);
      return res.status(500).json({ error: 'AI service unavailable' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content
      || 'Sorry, I could not process your request. Please contact support@anytokens.net';

    return res.json({ reply });
  } catch (error) {
    console.error('Chat widget error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
