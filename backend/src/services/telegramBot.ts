import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const SYSTEM_PROMPT = `你是 Anytokens 的 AI 客服助手。Anytokens 是一个统一 AI API 网关，支持 80+ 个模型，兼容 OpenAI 格式。

## 平台基本信息
- 网站：https://anytokens.net
- API 地址：https://api.anytokens.net/v1
- 文档：https://anytokens.net/docs
- 注册即送 $0.50 免费额度

## 免费模型（完全免费，无限使用）
deepseek-v3、gemini-2.0-flash、qwen2.5-7b、qwen3-8b、qwen3-32b、qwen2.5-coder-32b、llama-3.3-70b、llama-3.1-8b、glm-4-9b、glm-4.5-air、deepseek-r1-7b、deepseek-r1-0528-8b、qwen3.5-9b、qwen3.5-4b、qwen3-vl-8b、glm-z1-9b、hunyuan-mt-7b、ling-mini-2.0、internlm2.5-7b、mistral-7b（共20个）

## 付费模型价格（每百万 token，输入/输出，美元）
- deepseek-r1: $0.70 / $2.50（推理模型）
- gemini-2.5-pro: $1.25 / $10.00
- grok-3: $3.00 / $15.00
- grok-3-mini: $0.30 / $0.50
- mistral-large: $2.00 / $6.00
- llama-3.3-70b: $0.59 / $0.79
- phi-4: $0.07 / $0.14（极低价）
- qwen2.5-72b: $0.12 / $0.39
- qwen3-235b: $0.50 / $2.00
- glm-5.1: $2.00 / $8.00
- kimi-k2: $0.14 / $0.55
- minimax-m2.5: $0.29 / $1.15

## 平台功能
- API Key 管理、用量追踪、消费限额
- 团队管理（邀请成员、共享账单）
- 推荐返佣：推荐好友消费获 10% 佣金
- Reseller 分销系统：可创建子账号自定义加价
- Webhook 余额提醒
- 支持所有兼容 OpenAI 格式的客户端（Python/JS SDK、ChatBox、LobeChat 等）

## 支付方式
- 信用卡（Stripe，Visa/MasterCard）
- 加密货币（USDT TRC20/ERC20、BTC、ETH）
- 最低充值：$5

## 使用方法
只需把 base_url 改成 https://api.anytokens.net/v1，API key 换成 Anytokens 的 key，其他代码不变。

## 联系方式
- 邮件：support@anytokens.net
- Telegram 人工客服：https://t.me/anytokens_support

## 回复规则
- 用用户发消息的语言回复（中文问就中文答，英文问就英文答）
- 简洁专业，不超过200字
- 账单问题、API 报错等具体问题，引导去 Telegram 或邮件联系人工客服
- 不要编造平台没有的功能或模型`;

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
