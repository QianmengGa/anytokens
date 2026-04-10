import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const SYSTEM_PROMPT = `你是 Anytokens 的 AI 客服助手。Anytokens 是一个 AI API 代理平台，提供 DeepSeek、Qwen、Llama、Gemini 等模型的统一 API 接入，支持 OpenAI 格式，价格比官方便宜。
你的职责是回答用户关于平台的问题，包括：如何注册、如何充值、如何获取 API Key、支持哪些模型、价格是多少、如何使用 API 等。
网站：https://anytokens.net
如果遇到无法回答的问题，请引导用户发送邮件至 support@anytokens.net。`;

// 用户语言偏好（chatId → language）
const userLanguages = new Map<number, string>();

// 语言名称映射（用于 system prompt 指令）
const LANG_NAMES: Record<string, string> = {
  en: 'English',
  zh: '中文',
  ms: 'Bahasa Malaysia',
  ja: '日本語',
};

// 欢迎语
const WELCOME_MESSAGES: Record<string, string> = {
  en: '👋 Hello! I\'m the Anytokens AI support assistant. I can help you with questions about the platform including registration, top-up, API keys, supported models, and pricing. Just send me your question!\n🌐 Website: https://anytokens.net',
  zh: '👋 你好！我是 Anytokens AI 客服助手。我可以帮你解答注册、充值、API Key、支持模型、价格等问题。请直接发送你的问题！\n🌐 网站：https://anytokens.net',
  ms: '👋 Halo! Saya pembantu sokongan AI Anytokens. Saya boleh membantu anda dengan soalan tentang pendaftaran, tambah nilai, kunci API, model yang disokong, dan harga.\n🌐 Laman web: https://anytokens.net',
  ja: '👋 こんにちは！Anytokens AIサポートアシスタントです。登録、チャージ、APIキー、対応モデル、料金についてのご質問にお答えします。\n🌐 ウェブサイト：https://anytokens.net',
};

async function callAI(userMessage: string, language?: string): Promise<string> {
  try {
    // 构建 system prompt，加入语言指令
    let systemContent = SYSTEM_PROMPT;
    if (language && LANG_NAMES[language]) {
      systemContent += `\n请用${LANG_NAMES[language]}回复用户。`;
    } else {
      systemContent += '\n请用用户发消息的语言回复（中文消息用中文回复，英文消息用英文回复）。';
    }

    const response = await fetch(`${config.siliconflowBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.siliconflowApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V3',
        messages: [
          { role: 'system', content: systemContent },
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

  // /start 命令：发送语言选择
  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, '🌐 Please select your language / 请选择语言', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🇬🇧 English', callback_data: 'lang_en' },
            { text: '🇨🇳 中文', callback_data: 'lang_zh' },
          ],
          [
            { text: '🇲🇾 Bahasa Malaysia', callback_data: 'lang_ms' },
            { text: '🇯🇵 日本語', callback_data: 'lang_ja' },
          ],
        ],
      },
    });
  });

  // 处理语言选择回调
  bot.on('callback_query', (query) => {
    if (!query.data?.startsWith('lang_') || !query.message) return;
    const lang = query.data.slice(5); // 'en' | 'zh' | 'ms' | 'ja'
    const chatId = query.message.chat.id;

    // 保存语言偏好
    userLanguages.set(chatId, lang);

    // 回复欢迎语
    const welcome = WELCOME_MESSAGES[lang] || WELCOME_MESSAGES.en;
    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, welcome);
  });

  // 处理普通消息
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    const chatId = msg.chat.id;
    const language = userLanguages.get(chatId);
    const thinking = await bot.sendMessage(chatId, '🤔 ...');
    const reply = await callAI(msg.text, language);
    await bot.deleteMessage(chatId, thinking.message_id);
    bot.sendMessage(chatId, reply);
  });

  bot.on('error', (error) => {
    logger.error('Telegram Bot error:', error);
  });
}
