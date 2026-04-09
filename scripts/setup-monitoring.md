# Uptime Kuma 监控配置指南

## 部署后首次配置

1. 访问 https://status.anytokens.net（或 http://服务器IP:3001）
2. 创建管理员账号

## 添加监控项

### 网站监控
- 名称: `Website`
- 类型: HTTP(s)
- URL: `https://anytokens.net`
- 检查间隔: 60 秒

### API 健康检查
- 名称: `API Health`
- 类型: HTTP(s)
- URL: `https://api.anytokens.net/api/v1/health`
- 检查间隔: 30 秒
- 期望状态码: 200

### Chat Completions 端点
- 名称: `Chat API`
- 类型: HTTP(s) - Keyword
- URL: `https://api.anytokens.net/api/v1/chat/completions`
- 方法: POST
- 期望关键字: `"code"`（401 响应也包含 code 字段，说明服务正常）
- 检查间隔: 60 秒

### 数据库（通过 API 间接检测）
- 名称: `Database (via API)`
- 类型: HTTP(s)
- URL: `https://api.anytokens.net/api/v1/health`
- 检查间隔: 30 秒

## 配置 Telegram 告警

1. 在 Uptime Kuma → Settings → Notifications
2. 选择 Telegram
3. 填写:
   - Bot Token: 从 @BotFather 获取
   - Chat ID: 从 @userinfobot 获取
4. 测试发送确认可用

## DNS 配置

确保 `status.anytokens.net` 的 A 记录指向服务器 IP `43.160.221.19`

## SSL 证书

需要为 status.anytokens.net 签发证书：
```bash
certbot certonly --webroot -w /var/www/certbot \
  -d anytokens.net -d api.anytokens.net -d status.anytokens.net
```
