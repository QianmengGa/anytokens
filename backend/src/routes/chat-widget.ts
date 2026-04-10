import { Router, Request, Response } from 'express';

const router = Router();

const SYSTEM_PROMPT = `You are a helpful AI customer service assistant for Anytokens (anytokens.net).

About Anytokens:
- Unified AI API platform supporting 30+ models with OpenAI-compatible format
- Base URL: https://api.anytokens.net/v1
- Free models: deepseek-v3, qwen2.5-7b, qwen3-8b, glm-4-9b, deepseek-r1-7b, gemini-1.5-flash
- Paid models: deepseek-r1, qwen2.5-72b, gemini-1.5-pro, llama3-70b, mixtral-8x7b
- Features: API key management, usage tracking, spending limits, team management, referral system (10% commission), reseller program
- Payments: Stripe (credit card), USDT/BTC/ETH crypto via NOWPayments
- Auth: Email + OAuth (Google, GitHub, Discord)
- Contact: support@anytokens.net | Telegram: https://t.me/anytokens_support
- Website: https://anytokens.net | API docs: https://anytokens.net/docs

Rules:
- Always reply in the SAME language the user writes in
- Be friendly, professional, concise (under 150 words)
- For issues you cannot solve, direct to support@anytokens.net
- Never make up information`;

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
    const response = await fetch(`${backendUrl}/v1/chat/completions`, {
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
