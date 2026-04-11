#!/usr/bin/env node
// 每日平台报表 - 每天早上8点发送前一天数据
// cron: 0 8 * * *

const https = require('https');
const { execSync } = require('child_process');

function sendTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) { console.log(message); return Promise.resolve(); }
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => { res.on('data', () => {}); res.on('end', resolve); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function queryDB(sql) {
  // 通过 docker exec 调用 postgres 容器的 psql（宿主机和 backend 容器都没有 psql）
  const cmd = `docker exec anytokens-postgres-1 psql -U anytokens -d anytokens -t -A -c "${sql}" 2>/dev/null`;
  const result = execSync(cmd).toString().trim();
  return result;
}

async function main() {
  // 昨天的日期范围
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().slice(0, 10);
  const startOf = `${dateStr} 00:00:00`;
  const endOf   = `${dateStr} 23:59:59`;
  const displayDate = yesterday.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });

  try {
    // 1. 新注册用户数
    const newUsers = (await queryDB(
      `SELECT COUNT(*) FROM users WHERE created_at BETWEEN '${startOf}' AND '${endOf}'`
    )).trim() || '0';

    // 2. 活跃用户数（昨天有调用的）
    const activeUsers = (await queryDB(
      `SELECT COUNT(DISTINCT user_id) FROM usage_logs WHERE created_at BETWEEN '${startOf}' AND '${endOf}'`
    )).trim() || '0';

    // 3. 总请求次数
    const totalRequests = (await queryDB(
      `SELECT COUNT(*) FROM usage_logs WHERE created_at BETWEEN '${startOf}' AND '${endOf}'`
    )).trim() || '0';

    // 4. 总收入（用户消费金额）
    const revenue = (await queryDB(
      `SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type='USAGE' AND status='COMPLETED' AND created_at BETWEEN '${startOf}' AND '${endOf}'`
    )).trim() || '0';

    // 5. 总充值金额
    const topup = (await queryDB(
      `SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type='TOPUP' AND status='COMPLETED' AND created_at BETWEEN '${startOf}' AND '${endOf}'`
    )).trim() || '0';

    // 6. 累计用户总数
    const totalUsers = (await queryDB(
      `SELECT COUNT(*) FROM users`
    )).trim() || '0';

    // 7. 各模型调用次数 Top 5
    const topModels = (await queryDB(
      `SELECT model, COUNT(*) as cnt FROM usage_logs WHERE created_at BETWEEN '${startOf}' AND '${endOf}' GROUP BY model ORDER BY cnt DESC LIMIT 5`
    )).trim() || '暂无数据';

    // 8. 平台余额（所有用户余额总和）
    const totalBalance = (await queryDB(
      `SELECT COALESCE(SUM(balance), 0) FROM users`
    )).trim() || '0';

    // 格式化收入（去掉多余空格）
    const revenueNum = parseFloat(revenue.replace(/\s/g, '')) || 0;
    const topupNum   = parseFloat(topup.replace(/\s/g, ''))   || 0;
    const balanceNum = parseFloat(totalBalance.replace(/\s/g, '')) || 0;

    // 格式化 Top 模型
    let topModelsStr = '';
    topModels.split('\n').forEach((line, i) => {
      const parts = line.trim().split(/\s*\|\s*/);
      if (parts.length >= 2) {
        topModelsStr += `  ${i + 1}. ${parts[0].trim()}: ${parts[1].trim()} 次\n`;
      }
    });
    if (!topModelsStr) topModelsStr = '  暂无调用数据\n';

    const msg = `📊 <b>Anytokens 每日报表</b>
📅 ${displayDate}（${dateStr}）
━━━━━━━━━━━━━━━━
👥 <b>用户</b>
  昨日新注册：${newUsers} 人
  昨日活跃：${activeUsers} 人
  累计用户：${totalUsers} 人

💰 <b>财务</b>
  昨日收入：$${revenueNum.toFixed(4)}
  昨日充值：$${topupNum.toFixed(2)}
  用户余额总计：$${balanceNum.toFixed(2)}

🤖 <b>API 调用</b>
  昨日总请求：${parseInt(totalRequests).toLocaleString()} 次

🏆 <b>热门模型 Top 5</b>
${topModelsStr}
━━━━━━━━━━━━━━━━
<i>数据范围：${dateStr} 00:00 - 23:59 (UTC)</i>`;

    // 检查未回复询盘（最近7天）
    try {
      const unrepliedInquiries = (await queryDB(
        `SELECT detail FROM audit_logs WHERE action='ENTERPRISE_INQUIRY' AND created_at > NOW() - INTERVAL '7 days' ORDER BY created_at DESC LIMIT 5`
      )).trim();

      if (unrepliedInquiries && unrepliedInquiries !== '') {
        const lines = unrepliedInquiries.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          msg += '\n\n📬 <b>未回复询盘提醒（7天内）</b>\n';
          lines.forEach(line => {
            try {
              const d = JSON.parse(line.trim());
              msg += `  • ${d.company} - ${d.email}\n`;
            } catch(e) {}
          });
          msg += '  ⚠️ 请及时回复！';
        }
      }
    } catch(e) { /* 无询盘数据，忽略 */ }

    await sendTelegram(msg);
    console.log('✅ 报表发送成功');
    console.log(`新用户:${newUsers} 活跃:${activeUsers} 请求:${totalRequests} 收入:$${revenueNum.toFixed(4)}`);

  } catch (err) {
    const errMsg = `❌ Anytokens 报表生成失败\n${dateStr}\n错误：${err.message}`;
    await sendTelegram(errMsg);
    console.error('报表错误:', err.message);
  }
}

main().catch(console.error);
