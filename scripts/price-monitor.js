#!/usr/bin/env node

const https = require('https');

const CURRENT_PRICES = {
  'deepseek-v3':      { input: 0.27,  output: 1.10,  orId: 'deepseek/deepseek-chat' },
  'deepseek-r1':      { input: 0.55,  output: 2.19,  orId: 'deepseek/deepseek-r1' },
  'qwen2.5-72b':      { input: 0.57,  output: 0.57,  orId: 'qwen/qwen-2.5-72b-instruct' },
  'grok-3':           { input: 3.00,  output: 15.00, orId: 'x-ai/grok-3' },
  'grok-3-mini':      { input: 0.30,  output: 0.50,  orId: 'x-ai/grok-3-mini' },
  'mistral-large':    { input: 2.00,  output: 6.00,  orId: 'mistralai/mistral-large' },
  'gemini-2.5-pro':   { input: 1.25,  output: 5.00,  orId: 'google/gemini-2.5-pro' },
  'gemini-2.0-flash': { input: 0.10,  output: 0.40,  orId: 'google/gemini-2.0-flash-001' },
  'phi-4':            { input: 0.07,  output: 0.14,  orId: 'microsoft/phi-4' },
};

function fetchOpenRouterPrices() {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: 'openrouter.ai', path: '/api/v1/models', method: 'GET', headers: { 'Content-Type': 'application/json' } },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const prices = {};
            if (json.data) {
              json.data.forEach(model => {
                if (model.pricing) {
                  prices[model.id] = {
                    input: parseFloat(model.pricing.prompt) * 1e6,
                    output: parseFloat(model.pricing.completion) * 1e6
                  };
                }
              });
            }
            resolve(prices);
          } catch(e) { reject(e); }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function sendTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log('未配置 Telegram，通知内容如下：');
    console.log(message);
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' });
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        path: '/bot' + token + '/sendMessage',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
      },
      (res) => { res.on('data', () => {}); res.on('end', resolve); }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const today = new Date().toLocaleDateString('zh-CN');
  console.log('价格监控运行：' + today);

  let changes = [];
  let errors = [];

  try {
    const orPrices = await fetchOpenRouterPrices();

    for (const [myId, info] of Object.entries(CURRENT_PRICES)) {
      const latest = orPrices[info.orId];
      if (!latest) {
        errors.push(myId + ': OpenRouter未找到 ' + info.orId);
        continue;
      }
      const inputDiff = (latest.input - info.input) / info.input;
      const outputDiff = (latest.output - info.output) / info.output;
      if (Math.abs(inputDiff) > 0.05 || Math.abs(outputDiff) > 0.05) {
        changes.push({
          model: myId,
          curIn: info.input, curOut: info.output,
          newIn: latest.input, newOut: latest.output,
          inPct: (inputDiff * 100).toFixed(1),
          outPct: (outputDiff * 100).toFixed(1)
        });
      }
    }
  } catch(e) {
    errors.push('获取价格失败: ' + e.message);
  }

  const today2 = new Date().toLocaleString('zh-CN');
  let msg = '<b>Anytokens 价格监控报告</b>\n' + today2 + '\n\n';

  if (changes.length === 0 && errors.length === 0) {
    msg += '✅ 所有模型价格无变动，无需操作。';
    console.log('✅ 无变动');
  } else {
    if (changes.length > 0) {
      msg += '<b>发现 ' + changes.length + ' 个模型价格变动，请更新 models.ts：</b>\n\n';
      changes.forEach(c => {
        const icon = parseFloat(c.inPct) < 0 ? '📉' : '📈';
        msg += icon + ' <b>' + c.model + '</b>\n';
        msg += '  输入：$' + c.curIn + ' → $' + c.newIn.toFixed(4) + ' (' + c.inPct + '%)\n';
        msg += '  输出：$' + c.curOut + ' → $' + c.newOut.toFixed(4) + ' (' + c.outPct + '%)\n\n';
      });
      msg += '请打开 Claude 让它更新定价！';
    }
    if (errors.length > 0) {
      msg += '\n⚠️ 以下模型检查失败：\n' + errors.join('\n');
    }
  }

  await sendTelegram(msg);
}

main().catch(console.error);
