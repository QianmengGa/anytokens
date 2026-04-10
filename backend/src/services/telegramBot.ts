import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const SYSTEM_PROMPT = `你是 Anytokens 的 AI 客服助手。Anytokens 是一个 AI API 代理平台，提供 DeepSeek、Qwen、Llama、Gemini 等模型的统一 API 接入，支持 OpenAI 格式，价格比官方便宜。
你的职责是回答用户关于平台的问题，包括：如何注册、如何充值、如何获取 API Key、支持哪些模型、价格是多少、如何使用 API 等。
网站：https://anytokens.net
如果遇到无法回答的问题，请引导用户发送邮件至 support@anytokens.net。
请用用户发消息的语言回复（中文消息用中文回复，英文消息用英文回复）。`;

async function callAI(userMessage: string): Promise<string> {
  try {
    const response = await fetch(`${config.siliconflowBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.siliconflowApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V3',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || '抱歉，我暂时无法回答，请发邮件至 support@anytokens.net';
  } catch (error) {
    logger.error('Telegram Bot AI error:', error);
    return '抱歉，我暂时无法回答，请发邮件至 support@anytokens.net';
  }
}

export function startTelegramBot(): void {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.warn('TELEGRAM_BOT_TOKEN not set, Telegram Bot disabled');
    return;
  }

  const bot = new TelegramBot(token, { polling: true });
  logger.info('Telegram Bot started');

  bot.onText(/\/start/, (msg) => {
    const welcome = `👋 你好！我是 Anytokens AI 客服助手。

我可以帮你解答关于 Anytokens 平台的问题，包括：
- 如何注册和充值
- 支持哪些 AI 模型
- 如何获取和使用 API Key
- 价格和计费说明

请直接发送你的问题！
🌐 网站：https://anytokens.net`;
    bot.sendMessage(msg.chat.id, welcome);
  });

  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    const chatId = msg.chat.id;
    const thinking = await bot.sendMessage(chatId, '🤔 正在思考...');
    const reply = await callAI(msg.text);
    await bot.deleteMessage(chatId, thinking.message_id);
    bot.sendMessage(chatId, reply);
  });

  bot.on('error', (error) => {
    logger.error('Telegram Bot error:', error);
  });
}
