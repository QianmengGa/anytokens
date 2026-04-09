'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { useI18nStore } from '@/lib/i18n';
import { Shield, ChevronRight } from 'lucide-react';

const EFFECTIVE_DATE = '2026-04-10';

// 章节定义
const SECTIONS = [
  'info-collected',
  'how-we-use',
  'info-sharing',
  'data-retention',
  'security',
  'cookies',
  'third-party',
  'children',
  'international',
  'your-rights',
  'changes',
  'contact',
] as const;

type SectionId = (typeof SECTIONS)[number];

// 中英文内容
function useLang() {
  const { locale } = useI18nStore();
  return locale === 'zh-CN' || locale === 'zh-TW' ? 'zh' : 'en';
}

const LABELS: Record<string, Record<SectionId, string>> = {
  zh: {
    'info-collected': '1. 收集的信息',
    'how-we-use': '2. 使用方式',
    'info-sharing': '3. 信息共享',
    'data-retention': '4. 数据保留',
    'security': '5. 安全措施',
    'cookies': '6. Cookie 政策',
    'third-party': '7. 第三方服务',
    'children': '8. 儿童隐私',
    'international': '9. 国际数据传输',
    'your-rights': '10. 用户权利',
    'changes': '11. 政策变更',
    'contact': '12. 联系方式',
  },
  en: {
    'info-collected': '1. Information We Collect',
    'how-we-use': '2. How We Use Your Information',
    'info-sharing': '3. Information Sharing',
    'data-retention': '4. Data Retention',
    'security': '5. Security Measures',
    'cookies': '6. Cookie Policy',
    'third-party': '7. Third-Party Services',
    'children': '8. Children\'s Privacy',
    'international': '9. International Data Transfers',
    'your-rights': '10. Your Rights',
    'changes': '11. Changes to This Policy',
    'contact': '12. Contact Us',
  },
};

export default function PrivacyPage() {
  const lang = useLang();
  const [active, setActive] = useState<SectionId>('info-collected');
  const labels = LABELS[lang];

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      {/* Header */}
      <div className="border-b border-border/40 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-950/20">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {lang === 'zh' ? '隐私政策' : 'Privacy Policy'}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {lang === 'zh'
              ? `生效日期：${EFFECTIVE_DATE} · Anytokens (anytokens.net)`
              : `Effective: ${EFFECTIVE_DATE} · Anytokens (anytokens.net)`}
          </p>
        </div>
      </div>

      <div className="flex">
        {/* 左侧目录 */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 overflow-y-auto border-r border-border/40 p-4 lg:block">
          <nav className="space-y-0.5">
            {SECTIONS.map((id) => (
              <button
                key={id}
                onClick={() => {
                  setActive(id);
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-left text-[13px] transition-colors ${
                  active === id
                    ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {labels[id]}
              </button>
            ))}
          </nav>
        </aside>

        {/* 内容 */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-3xl space-y-12 px-6 py-12">

            {/* 1. 收集的信息 */}
            <Section id="info-collected" title={labels['info-collected']}>
              {lang === 'zh' ? (<>
                <p>当您使用 Anytokens 时，我们可能收集以下信息：</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li><strong>账户信息</strong>：邮箱地址、用户名、密码哈希值</li>
                  <li><strong>支付信息</strong>：由 Stripe 或 NOWPayments 处理，我们不存储完整的信用卡号或加密钱包私钥</li>
                  <li><strong>使用数据</strong>：API 调用记录、模型名称、Token 用量、延迟、IP 地址</li>
                  <li><strong>设备信息</strong>：浏览器类型、操作系统（通过 User-Agent）</li>
                  <li><strong>OAuth 数据</strong>：如您通过 Google/GitHub/Discord 登录，我们会收到您的公开资料和邮箱</li>
                </ul>
              </>) : (<>
                <p>When you use Anytokens, we may collect the following information:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li><strong>Account Information</strong>: Email address, username, hashed password</li>
                  <li><strong>Payment Information</strong>: Processed by Stripe or NOWPayments — we do not store full card numbers or crypto wallet private keys</li>
                  <li><strong>Usage Data</strong>: API call logs, model name, token usage, latency, IP address</li>
                  <li><strong>Device Information</strong>: Browser type, operating system (via User-Agent)</li>
                  <li><strong>OAuth Data</strong>: If you sign in via Google/GitHub/Discord, we receive your public profile and email</li>
                </ul>
              </>)}
            </Section>

            {/* 2. 使用方式 */}
            <Section id="how-we-use" title={labels['how-we-use']}>
              {lang === 'zh' ? (<>
                <p>我们使用收集的信息用于：</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>提供、维护和改进我们的服务</li>
                  <li>处理支付和充值交易</li>
                  <li>按 Token 计算和记录 API 调用费用</li>
                  <li>发送服务通知（欢迎邮件、充值收据、余额提醒）</li>
                  <li>防止欺诈和滥用（频率限制、异常检测）</li>
                  <li>生成匿名聚合统计数据</li>
                </ul>
              </>) : (<>
                <p>We use the information we collect to:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process payment and top-up transactions</li>
                  <li>Calculate and log per-token API call costs</li>
                  <li>Send service notifications (welcome emails, receipts, balance alerts)</li>
                  <li>Prevent fraud and abuse (rate limiting, anomaly detection)</li>
                  <li>Generate anonymous, aggregated statistics</li>
                </ul>
              </>)}
            </Section>

            {/* 3. 信息共享 */}
            <Section id="info-sharing" title={labels['info-sharing']}>
              {lang === 'zh' ? (<>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                  <p className="font-medium text-green-800 dark:text-green-300">我们不会出售您的个人数据。</p>
                </div>
                <p className="mt-4">我们仅在以下必要情况下与第三方共享信息：</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li><strong>Stripe</strong> — 处理信用卡支付</li>
                  <li><strong>NOWPayments</strong> — 处理加密货币支付</li>
                  <li><strong>Resend</strong> — 发送交易邮件通知</li>
                  <li><strong>AI 模型供应商</strong>（SiliconFlow / Google / Groq / OpenAI）— 转发您的 API 请求以获得模型响应</li>
                </ul>
                <p className="mt-2">这些提供商仅按照处理请求所需接收数据，并受其各自隐私政策约束。</p>
              </>) : (<>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                  <p className="font-medium text-green-800 dark:text-green-300">We do not sell your personal data.</p>
                </div>
                <p className="mt-4">We share information with third parties only when necessary:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li><strong>Stripe</strong> — credit card payment processing</li>
                  <li><strong>NOWPayments</strong> — cryptocurrency payment processing</li>
                  <li><strong>Resend</strong> — transactional email delivery</li>
                  <li><strong>AI Model Providers</strong> (SiliconFlow / Google / Groq / OpenAI) — forwarding your API requests to obtain model responses</li>
                </ul>
                <p className="mt-2">These providers receive only the data necessary to process requests and are governed by their respective privacy policies.</p>
              </>)}
            </Section>

            {/* 4. 数据保留 */}
            <Section id="data-retention" title={labels['data-retention']}>
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2.5 text-left font-medium">{lang === 'zh' ? '数据类型' : 'Data Type'}</th>
                      <th className="px-4 py-2.5 text-left font-medium">{lang === 'zh' ? '保留期限' : 'Retention Period'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b"><td className="px-4 py-2.5">{lang === 'zh' ? 'API 调用日志 / 审计日志' : 'API call logs / audit logs'}</td><td className="px-4 py-2.5 font-mono">90 {lang === 'zh' ? '天' : 'days'}</td></tr>
                    <tr className="border-b"><td className="px-4 py-2.5">{lang === 'zh' ? '支付/交易记录' : 'Payment / transaction records'}</td><td className="px-4 py-2.5 font-mono">7 {lang === 'zh' ? '年（合规要求）' : 'years (regulatory compliance)'}</td></tr>
                    <tr className="border-b"><td className="px-4 py-2.5">{lang === 'zh' ? '数据库备份' : 'Database backups'}</td><td className="px-4 py-2.5 font-mono">7 {lang === 'zh' ? '天（自动滚动删除）' : 'days (auto-rotated)'}</td></tr>
                    <tr><td className="px-4 py-2.5">{lang === 'zh' ? '账户数据' : 'Account data'}</td><td className="px-4 py-2.5">{lang === 'zh' ? '直到账户删除' : 'Until account deletion'}</td></tr>
                  </tbody>
                </table>
              </div>
            </Section>

            {/* 5. 安全措施 */}
            <Section id="security" title={labels['security']}>
              {lang === 'zh' ? (<>
                <p>我们采取行业标准的安全措施保护您的数据：</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li><strong>传输加密</strong>：全站 HTTPS，TLS 1.2/1.3</li>
                  <li><strong>密码存储</strong>：bcrypt 哈希（salt round 12），明文永不存储</li>
                  <li><strong>API Key 存储</strong>：bcrypt 哈希，完整 Key 仅创建时展示一次</li>
                  <li><strong>会话管理</strong>：JWT 签名认证，7 天过期</li>
                  <li><strong>频率限制</strong>：Redis 令牌桶算法防止暴力攻击</li>
                  <li><strong>安全头</strong>：Helmet.js (X-Frame-Options, CSP, HSTS)</li>
                </ul>
              </>) : (<>
                <p>We employ industry-standard security measures to protect your data:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li><strong>Encryption in Transit</strong>: Site-wide HTTPS with TLS 1.2/1.3</li>
                  <li><strong>Password Storage</strong>: bcrypt hash (salt round 12), plaintext is never stored</li>
                  <li><strong>API Key Storage</strong>: bcrypt hashed; the full key is shown only once at creation</li>
                  <li><strong>Session Management</strong>: JWT signed tokens, 7-day expiration</li>
                  <li><strong>Rate Limiting</strong>: Redis token-bucket algorithm to prevent brute force</li>
                  <li><strong>Security Headers</strong>: Helmet.js (X-Frame-Options, CSP, HSTS)</li>
                </ul>
              </>)}
            </Section>

            {/* 6. Cookie */}
            <Section id="cookies" title={labels['cookies']}>
              {lang === 'zh' ? (<>
                <p>我们仅使用<strong>必要的功能性 Cookie</strong>：</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li><code>next-auth.session-token</code> — 维持登录会话</li>
                  <li><code>anytokens-locale</code> — 记住语言偏好（localStorage）</li>
                  <li><code>anytokens-theme</code> — 记住主题偏好（localStorage）</li>
                </ul>
                <p className="mt-2">我们不使用任何广告追踪 Cookie 或第三方分析 Cookie。</p>
              </>) : (<>
                <p>We use only <strong>essential, functional cookies</strong>:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li><code>next-auth.session-token</code> — maintains login session</li>
                  <li><code>anytokens-locale</code> — remembers language preference (localStorage)</li>
                  <li><code>anytokens-theme</code> — remembers theme preference (localStorage)</li>
                </ul>
                <p className="mt-2">We do not use advertising tracking cookies or third-party analytics cookies.</p>
              </>)}
            </Section>

            {/* 7. 第三方服务 */}
            <Section id="third-party" title={labels['third-party']}>
              <p className="mb-3">{lang === 'zh' ? '我们使用以下第三方服务，每个服务有其各自的隐私政策：' : 'We use the following third-party services, each with its own privacy policy:'}</p>
              <div className="space-y-2">
                {[
                  { name: 'Stripe', url: 'https://stripe.com/privacy', desc: lang === 'zh' ? '信用卡支付处理' : 'Credit card processing' },
                  { name: 'NOWPayments', url: 'https://nowpayments.io/privacy-policy', desc: lang === 'zh' ? '加密货币支付' : 'Crypto payments' },
                  { name: 'Resend', url: 'https://resend.com/legal/privacy-policy', desc: lang === 'zh' ? '邮件发送服务' : 'Email delivery' },
                  { name: 'Google (Gemini API & OAuth)', url: 'https://policies.google.com/privacy', desc: lang === 'zh' ? 'AI 模型 & 社交登录' : 'AI models & OAuth' },
                  { name: 'GitHub (OAuth)', url: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement', desc: lang === 'zh' ? '社交登录' : 'OAuth sign-in' },
                ].map((s) => (
                  <div key={s.name} className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
                    <div>
                      <span className="text-sm font-medium">{s.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{s.desc}</span>
                    </div>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400">
                      {lang === 'zh' ? '隐私政策' : 'Privacy Policy'} <ChevronRight className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            </Section>

            {/* 8. 儿童隐私 */}
            <Section id="children" title={labels['children']}>
              {lang === 'zh' ? (
                <p>Anytokens 不面向 13 岁以下的儿童。我们不会故意收集 13 岁以下儿童的个人信息。如果您认为我们无意中收集了儿童的数据，请联系我们，我们将及时删除。</p>
              ) : (
                <p>Anytokens is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected data from a child, please contact us and we will promptly delete it.</p>
              )}
            </Section>

            {/* 9. 国际传输 */}
            <Section id="international" title={labels['international']}>
              {lang === 'zh' ? (
                <p>我们的服务器位于<strong>新加坡</strong>。当您从其他地区访问 Anytokens 时，您的数据将被传输到新加坡处理和存储。我们通过使用加密传输和访问控制措施来确保您的数据在传输过程中受到保护。</p>
              ) : (
                <p>Our servers are located in <strong>Singapore</strong>. When you access Anytokens from other regions, your data is transferred to Singapore for processing and storage. We ensure your data is protected during transfer through encrypted transmission and access control measures.</p>
              )}
            </Section>

            {/* 10. 用户权利 */}
            <Section id="your-rights" title={labels['your-rights']}>
              {lang === 'zh' ? (<>
                <p>您对您的个人数据拥有以下权利：</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {[
                    { title: '访问权', desc: '查看我们持有的您的个人数据' },
                    { title: '更正权', desc: '更正不准确或不完整的数据' },
                    { title: '删除权', desc: '请求删除您的账户和相关数据' },
                    { title: '导出权', desc: '以 CSV 格式导出您的数据' },
                  ].map((r) => (
                    <div key={r.title} className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{r.title}</p>
                      <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">{r.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">如需行使以上权利，请发邮件至 <a href="mailto:privacy@anytokens.net" className="text-blue-600 hover:underline dark:text-blue-400">privacy@anytokens.net</a>，我们将在 30 天内回复。</p>
              </>) : (<>
                <p>You have the following rights regarding your personal data:</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {[
                    { title: 'Access', desc: 'View personal data we hold about you' },
                    { title: 'Correction', desc: 'Correct inaccurate or incomplete data' },
                    { title: 'Deletion', desc: 'Request deletion of your account and data' },
                    { title: 'Export', desc: 'Export your data in CSV format' },
                  ].map((r) => (
                    <div key={r.title} className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{r.title}</p>
                      <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">{r.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">To exercise any of these rights, email <a href="mailto:privacy@anytokens.net" className="text-blue-600 hover:underline dark:text-blue-400">privacy@anytokens.net</a>. We will respond within 30 days.</p>
              </>)}
            </Section>

            {/* 11. 政策变更 */}
            <Section id="changes" title={labels['changes']}>
              {lang === 'zh' ? (
                <p>我们可能会不时更新本隐私政策。如有重大变更，我们将通过电子邮件提前 <strong>7 天</strong>通知您，并在网站上发布更新版本。继续使用我们的服务即表示您接受更新后的政策。</p>
              ) : (
                <p>We may update this Privacy Policy from time to time. For material changes, we will notify you by email at least <strong>7 days</strong> in advance and post the updated version on our website. Continued use of our services constitutes acceptance of the updated policy.</p>
              )}
            </Section>

            {/* 12. 联系方式 */}
            <Section id="contact" title={labels['contact']}>
              {lang === 'zh' ? (<>
                <p>如果您对本隐私政策有任何疑问，请通过以下方式联系我们：</p>
                <div className="mt-3 rounded-lg border border-border/60 bg-card/30 p-4">
                  <p className="text-sm"><strong>邮箱：</strong><a href="mailto:privacy@anytokens.net" className="text-blue-600 hover:underline dark:text-blue-400">privacy@anytokens.net</a></p>
                  <p className="mt-1 text-sm"><strong>网站：</strong><a href="https://anytokens.net" className="text-blue-600 hover:underline dark:text-blue-400">anytokens.net</a></p>
                </div>
              </>) : (<>
                <p>If you have any questions about this Privacy Policy, please contact us:</p>
                <div className="mt-3 rounded-lg border border-border/60 bg-card/30 p-4">
                  <p className="text-sm"><strong>Email:</strong> <a href="mailto:privacy@anytokens.net" className="text-blue-600 hover:underline dark:text-blue-400">privacy@anytokens.net</a></p>
                  <p className="mt-1 text-sm"><strong>Website:</strong> <a href="https://anytokens.net" className="text-blue-600 hover:underline dark:text-blue-400">anytokens.net</a></p>
                </div>
              </>)}
            </Section>

            {/* 底部链接 */}
            <div className="border-t border-border/40 pt-8 text-center">
              <Link href="/terms" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                {lang === 'zh' ? '查看服务条款 →' : 'View Terms of Service →'}
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// 章节组件
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id}>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
