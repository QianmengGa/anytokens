'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { useI18nStore } from '@/lib/i18n';
import { FileText, AlertTriangle } from 'lucide-react';

const EFFECTIVE_DATE = '2026-04-10';

const SECTIONS = [
  'acceptance',
  'service',
  'registration',
  'prohibited',
  'payment',
  'rate-limits',
  'ip',
  'privacy',
  'disclaimer',
  'liability',
  'indemnification',
  'termination',
  'governing-law',
  'changes',
  'contact',
] as const;

type SectionId = (typeof SECTIONS)[number];

function useLang() {
  const { locale } = useI18nStore();
  return locale === 'zh-CN' || locale === 'zh-TW' ? 'zh' : 'en';
}

const LABELS: Record<string, Record<SectionId, string>> = {
  zh: {
    acceptance: '1. 条款接受',
    service: '2. 服务描述',
    registration: '3. 账户注册',
    prohibited: '4. 禁止使用',
    payment: '5. 支付与计费',
    'rate-limits': '6. API 限速',
    ip: '7. 知识产权',
    privacy: '8. 隐私',
    disclaimer: '9. 免责声明',
    liability: '10. 责任限制',
    indemnification: '11. 赔偿',
    termination: '12. 终止',
    'governing-law': '13. 适用法律',
    changes: '14. 条款变更',
    contact: '15. 联系方式',
  },
  en: {
    acceptance: '1. Acceptance of Terms',
    service: '2. Service Description',
    registration: '3. Account Registration',
    prohibited: '4. Prohibited Uses',
    payment: '5. Payment & Billing',
    'rate-limits': '6. API Rate Limits',
    ip: '7. Intellectual Property',
    privacy: '8. Privacy',
    disclaimer: '9. Disclaimer of Warranties',
    liability: '10. Limitation of Liability',
    indemnification: '11. Indemnification',
    termination: '12. Termination',
    'governing-law': '13. Governing Law',
    changes: '14. Changes to Terms',
    contact: '15. Contact Us',
  },
};

export default function TermsPage() {
  const lang = useLang();
  const [active, setActive] = useState<SectionId>('acceptance');
  const labels = LABELS[lang];

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      {/* Header */}
      <div className="border-b border-border/40 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
            <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {lang === 'zh' ? '服务条款' : 'Terms of Service'}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {lang === 'zh'
              ? `生效日期：${EFFECTIVE_DATE} · Anytokens (anytokens.net)`
              : `Effective: ${EFFECTIVE_DATE} · Anytokens (anytokens.net)`}
          </p>
        </div>
      </div>

      {/* 黄色警告横幅 */}
      <div className="border-b border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            {lang === 'zh'
              ? '使用 Anytokens 服务即表示您同意以下条款。请仔细阅读。'
              : 'By using Anytokens, you agree to these terms. Please read them carefully.'}
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
                    ? 'bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
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

            {/* 1. 条款接受 */}
            <Section id="acceptance" title={labels.acceptance}>
              {lang === 'zh' ? (
                <p>访问或使用 Anytokens（以下简称"服务"）即表示您同意受本服务条款（以下简称"条款"）的约束。如果您不同意这些条款，请勿使用本服务。</p>
              ) : (
                <p>By accessing or using Anytokens (the &quot;Service&quot;), you agree to be bound by these Terms of Service (the &quot;Terms&quot;). If you do not agree, do not use the Service.</p>
              )}
            </Section>

            {/* 2. 服务描述 */}
            <Section id="service" title={labels.service}>
              {lang === 'zh' ? (<>
                <p>Anytokens 提供以下服务：</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li><strong>API 代理</strong>：统一 OpenAI 兼容格式转发 AI 模型请求（Chat / Embeddings / Images / TTS）</li>
                  <li><strong>预付费余额系统</strong>：充值后按 Token 用量扣费</li>
                  <li><strong>团队管理</strong>：共享余额、团队 API Key</li>
                  <li><strong>经销商（Reseller）系统</strong>：子账户管理、自定义加价</li>
                </ul>
                <p className="mt-2">我们保留随时修改、暂停或终止服务的权利。</p>
              </>) : (<>
                <p>Anytokens provides the following services:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li><strong>API Proxy</strong>: Unified OpenAI-compatible forwarding for AI model requests (Chat / Embeddings / Images / TTS)</li>
                  <li><strong>Prepaid Balance System</strong>: Pay-per-token billing after top-up</li>
                  <li><strong>Team Management</strong>: Shared balance, team API keys</li>
                  <li><strong>Reseller System</strong>: Sub-account management, custom markup pricing</li>
                </ul>
                <p className="mt-2">We reserve the right to modify, suspend, or discontinue the Service at any time.</p>
              </>)}
            </Section>

            {/* 3. 账户注册 */}
            <Section id="registration" title={labels.registration}>
              {lang === 'zh' ? (<>
                <ul className="ml-4 list-disc space-y-1">
                  <li>您必须年满 <strong>18 岁</strong>方可创建账户</li>
                  <li>您有责任维护账户安全和 API Key 的保密性</li>
                  <li>您对在您账户下发生的所有活动负责</li>
                  <li>您必须提供真实准确的注册信息</li>
                  <li>每人仅可创建一个账户，禁止多号注册</li>
                </ul>
              </>) : (<>
                <ul className="ml-4 list-disc space-y-1">
                  <li>You must be at least <strong>18 years old</strong> to create an account</li>
                  <li>You are responsible for maintaining the security of your account and API keys</li>
                  <li>You are responsible for all activity under your account</li>
                  <li>You must provide accurate registration information</li>
                  <li>One account per person — duplicate registrations are prohibited</li>
                </ul>
              </>)}
            </Section>

            {/* 4. 禁止使用 — 红色框 */}
            <Section id="prohibited" title={labels.prohibited}>
              <div className="rounded-lg border border-red-300 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
                {lang === 'zh' ? (<>
                  <p className="mb-3 font-medium text-red-800 dark:text-red-300">以下行为被严格禁止：</p>
                  <ul className="ml-4 list-disc space-y-1.5 text-red-700 dark:text-red-400">
                    <li>生成违法、有害、仇恨、暴力、色情或侵权内容</li>
                    <li>发送垃圾邮件、钓鱼攻击或恶意软件</li>
                    <li>对服务进行逆向工程、反编译或解密</li>
                    <li>未经授权转售 API 访问权限（Reseller 计划除外）</li>
                    <li>试图绕过频率限制、认证或安全措施</li>
                    <li>使用自动化手段批量注册账户</li>
                    <li>冒充他人或虚假陈述与任何实体的关系</li>
                  </ul>
                  <p className="mt-3 text-xs text-red-600 dark:text-red-500">违反以上条款将导致账户立即暂停或永久封禁，已充值余额不予退还。</p>
                </>) : (<>
                  <p className="mb-3 font-medium text-red-800 dark:text-red-300">The following uses are strictly prohibited:</p>
                  <ul className="ml-4 list-disc space-y-1.5 text-red-700 dark:text-red-400">
                    <li>Generating illegal, harmful, hateful, violent, pornographic, or infringing content</li>
                    <li>Sending spam, phishing, or malware</li>
                    <li>Reverse-engineering, decompiling, or decrypting the Service</li>
                    <li>Unauthorized resale of API access (except through the Reseller program)</li>
                    <li>Attempting to bypass rate limits, authentication, or security measures</li>
                    <li>Automated bulk registration of accounts</li>
                    <li>Impersonating others or misrepresenting affiliation with any entity</li>
                  </ul>
                  <p className="mt-3 text-xs text-red-600 dark:text-red-500">Violation of these terms will result in immediate suspension or permanent ban. Remaining balance is non-refundable.</p>
                </>)}
              </div>
            </Section>

            {/* 5. 支付与计费 */}
            <Section id="payment" title={labels.payment}>
              {lang === 'zh' ? (<>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Anytokens 采用<strong>预付费</strong>模式，充值后按 Token 用量实时扣费</li>
                  <li>充值余额<strong>不可退款</strong>，除法律另有规定</li>
                  <li>我们接受 <strong>Stripe</strong>（信用卡/借记卡）和 <strong>NOWPayments</strong>（USDT/BTC/ETH）支付</li>
                  <li>最低充值金额为 $5 USD</li>
                  <li>如发生拒付（chargeback），您的账户将被立即暂停，直到争议解决</li>
                  <li>我们保留随时调整模型定价的权利，价格变更将提前公告</li>
                </ul>
              </>) : (<>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Anytokens uses a <strong>prepaid</strong> model — you top up first, then pay per-token in real time</li>
                  <li>Account balance is <strong>non-refundable</strong> except as required by law</li>
                  <li>We accept <strong>Stripe</strong> (credit/debit cards) and <strong>NOWPayments</strong> (USDT/BTC/ETH)</li>
                  <li>Minimum top-up amount is $5 USD</li>
                  <li>Chargebacks will result in immediate account suspension until the dispute is resolved</li>
                  <li>We reserve the right to adjust model pricing; changes will be announced in advance</li>
                </ul>
              </>)}
            </Section>

            {/* 6. API 限速 */}
            <Section id="rate-limits" title={labels['rate-limits']}>
              {lang === 'zh' ? (<>
                <p>为保证服务质量和公平使用，我们实施以下默认限速：</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>免费用户：每分钟 20 次请求</li>
                  <li>付费用户：每分钟 60 次请求</li>
                  <li>企业用户：可自定义速率限制</li>
                </ul>
                <p className="mt-2">超出限速的请求将返回 HTTP 429 状态码。</p>
              </>) : (<>
                <p>To ensure service quality and fair usage, the following default rate limits apply:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Free tier: 20 requests per minute</li>
                  <li>Paid tier: 60 requests per minute</li>
                  <li>Enterprise: Custom rate limits available</li>
                </ul>
                <p className="mt-2">Requests exceeding the rate limit will receive an HTTP 429 response.</p>
              </>)}
            </Section>

            {/* 7. 知识产权 */}
            <Section id="ip" title={labels.ip}>
              {lang === 'zh' ? (<>
                <p>Anytokens 服务本身（包括网站、API 接口、文档）的所有知识产权归 Anytokens 所有。您通过 API 生成的内容的所有权取决于相应 AI 模型提供商的条款。</p>
              </>) : (<>
                <p>All intellectual property in the Anytokens service (including the website, API, and documentation) belongs to Anytokens. Ownership of content generated through the API is subject to the terms of the respective AI model providers.</p>
              </>)}
            </Section>

            {/* 8. 隐私 */}
            <Section id="privacy" title={labels.privacy}>
              {lang === 'zh' ? (
                <p>您的隐私对我们很重要。请参阅我们的 <Link href="/privacy" className="text-indigo-600 hover:underline dark:text-indigo-400">隐私政策</Link> 了解我们如何收集、使用和保护您的个人信息。</p>
              ) : (
                <p>Your privacy is important to us. Please review our <Link href="/privacy" className="text-indigo-600 hover:underline dark:text-indigo-400">Privacy Policy</Link> for details on how we collect, use, and protect your personal information.</p>
              )}
            </Section>

            {/* 9. 免责声明 — code block 全大写 */}
            <Section id="disclaimer" title={labels.disclaimer}>
              <div className="rounded-lg bg-muted/60 p-4">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
{lang === 'zh'
  ? `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

服务按"原样"和"可用"基础提供，不附带任何明示或默示保证，包括但不限于适销性、特定用途适用性和不侵权保证。

WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. AI MODEL RESPONSES MAY CONTAIN INACCURACIES.`
  : `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. AI MODEL RESPONSES MAY CONTAIN INACCURACIES.`}
                </pre>
              </div>
            </Section>

            {/* 10. 责任限制 — 全大写 */}
            <Section id="liability" title={labels.liability}>
              <div className="rounded-lg bg-muted/60 p-4">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
{lang === 'zh'
  ? `IN NO EVENT SHALL ANYTOKENS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE.

OUR TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE AMOUNTS PAID BY YOU TO ANYTOKENS IN THE 12 MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM.

在任何情况下，ANYTOKENS 对因使用服务而产生的间接、附带、特殊、后果性或惩罚性损害赔偿不承担责任。我们的总累计赔偿责任不超过您在引起索赔的事件发生前 12 个月内支付给 ANYTOKENS 的金额。`
  : `IN NO EVENT SHALL ANYTOKENS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE.

OUR TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE AMOUNTS PAID BY YOU TO ANYTOKENS IN THE 12 MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM.`}
                </pre>
              </div>
            </Section>

            {/* 11. 赔偿 */}
            <Section id="indemnification" title={labels.indemnification}>
              {lang === 'zh' ? (
                <p>您同意赔偿并使 Anytokens 及其管理人员、董事和员工免受因您使用服务或违反本条款而引起的任何索赔、损害、损失或费用（包括合理的律师费）。</p>
              ) : (
                <p>You agree to indemnify and hold harmless Anytokens and its officers, directors, and employees from any claims, damages, losses, or expenses (including reasonable attorney fees) arising from your use of the Service or violation of these Terms.</p>
              )}
            </Section>

            {/* 12. 终止 */}
            <Section id="termination" title={labels.termination}>
              {lang === 'zh' ? (<>
                <ul className="ml-4 list-disc space-y-1">
                  <li>您可以随时通过删除账户来终止使用服务</li>
                  <li>我们可以在您违反条款时暂停或终止您的账户</li>
                  <li>终止后，您的未使用余额不予退还</li>
                  <li>条款中关于免责声明、责任限制和赔偿的条款在终止后仍然有效</li>
                </ul>
              </>) : (<>
                <ul className="ml-4 list-disc space-y-1">
                  <li>You may terminate your use of the Service at any time by deleting your account</li>
                  <li>We may suspend or terminate your account if you violate these Terms</li>
                  <li>Upon termination, unused balance is non-refundable</li>
                  <li>Provisions regarding disclaimers, liability limitations, and indemnification survive termination</li>
                </ul>
              </>)}
            </Section>

            {/* 13. 适用法律 */}
            <Section id="governing-law" title={labels['governing-law']}>
              {lang === 'zh' ? (
                <p>本条款受<strong>新加坡共和国</strong>法律管辖并据其解释。因本条款引起的任何争议应提交至新加坡有管辖权的法院解决。</p>
              ) : (
                <p>These Terms shall be governed by and construed in accordance with the laws of the <strong>Republic of Singapore</strong>. Any disputes arising from these Terms shall be submitted to the competent courts of Singapore.</p>
              )}
            </Section>

            {/* 14. 条款变更 */}
            <Section id="changes" title={labels.changes}>
              {lang === 'zh' ? (
                <p>我们可能会不时更新本服务条款。如有重大变更，我们将通过电子邮件提前 <strong>7 天</strong>通知您，并在网站上发布更新版本。继续使用服务即表示您接受更新后的条款。</p>
              ) : (
                <p>We may update these Terms from time to time. For material changes, we will notify you by email at least <strong>7 days</strong> in advance and post the updated version on our website. Continued use of the Service constitutes acceptance of the updated Terms.</p>
              )}
            </Section>

            {/* 15. 联系方式 */}
            <Section id="contact" title={labels.contact}>
              {lang === 'zh' ? (<>
                <p>如果您对本服务条款有任何疑问，请联系我们：</p>
                <div className="mt-3 rounded-lg border border-border/60 bg-card/30 p-4">
                  <p className="text-sm"><strong>邮箱：</strong><a href="mailto:legal@anytokens.net" className="text-indigo-600 hover:underline dark:text-indigo-400">legal@anytokens.net</a></p>
                  <p className="mt-1 text-sm"><strong>网站：</strong><a href="https://anytokens.net" className="text-indigo-600 hover:underline dark:text-indigo-400">anytokens.net</a></p>
                </div>
              </>) : (<>
                <p>If you have any questions about these Terms, please contact us:</p>
                <div className="mt-3 rounded-lg border border-border/60 bg-card/30 p-4">
                  <p className="text-sm"><strong>Email:</strong> <a href="mailto:legal@anytokens.net" className="text-indigo-600 hover:underline dark:text-indigo-400">legal@anytokens.net</a></p>
                  <p className="mt-1 text-sm"><strong>Website:</strong> <a href="https://anytokens.net" className="text-indigo-600 hover:underline dark:text-indigo-400">anytokens.net</a></p>
                </div>
              </>)}
            </Section>

            {/* 底部链接 */}
            <div className="border-t border-border/40 pt-8 text-center">
              <Link href="/privacy" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                {lang === 'zh' ? '查看隐私政策 →' : 'View Privacy Policy →'}
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id}>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
