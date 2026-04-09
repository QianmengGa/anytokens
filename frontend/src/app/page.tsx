'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { CustomerService } from '@/components/CustomerService';
import { useI18n } from '@/lib/i18n';
import { Blocks, Zap, BarChart3 } from 'lucide-react';

// 模型数据（不随语言变化的静态数据）
const models = [
  { name: 'Gemini 1.5 Flash', provider: 'Google', price: 'Free', free: true, tag: 'Fast' },
  { name: 'DeepSeek V3', provider: 'DeepSeek', price: 'Free', free: true, tag: 'Flagship' },
  { name: 'Llama 3.3 70B', provider: 'Meta', price: 'Free', free: true, tag: 'Open' },
  { name: 'GLM-4 Flash', provider: 'Zhipu', price: 'Free', free: true, tag: 'Free' },
  { name: 'Gemini 1.5 Pro', provider: 'Google', price: '$1.25/M', free: false, tag: 'Long ctx' },
  { name: 'DeepSeek R1', provider: 'DeepSeek', price: '$0.55/M', free: false, tag: 'Reasoning' },
  { name: 'Llama3 70B', provider: 'Groq', price: '$0.59/M', free: false, tag: 'Fast' },
  { name: 'Mixtral 8x7B', provider: 'Groq', price: '$0.24/M', free: false, tag: 'MoE' },
  { name: 'Qwen Max', provider: 'Alibaba', price: '$1.60/M', free: false, tag: 'Flagship' },
  { name: 'GPT-4o', provider: 'OpenAI', price: '$2.50/M', free: false, tag: 'Multimodal' },
  { name: 'Claude Sonnet 4', provider: 'Anthropic', price: '$3.00/M', free: false, tag: 'Balanced' },
  { name: 'Claude Opus 4', provider: 'Anthropic', price: '$15.0/M', free: false, tag: 'Strongest' },
  { name: 'Grok 3', provider: 'xAI', price: '$3.00/M', free: false, tag: 'New' },
];

export default function HomePage() {
  const { t } = useI18n();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 */}
      <PublicNavbar />

      {/* Hero 区域 */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-24 text-center">
          <Badge variant="secondary" className="mb-6">{t.hero_badge}</Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl lg:text-7xl">
            {t.hero_title_1}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">{t.hero_title_2}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {t.hero_subtitle}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={session ? '/api-keys' : '/login'}>
              <Button size="lg" className="h-12 w-full px-8 text-base sm:w-auto">{t.hero_cta}</Button>
            </Link>
            <Link href="#models">
              <Button variant="outline" size="lg" className="h-12 w-full px-8 text-base sm:w-auto">{t.hero_browse}</Button>
            </Link>
          </div>

          {/* 代码示例 */}
          <div className="mx-auto mt-14 max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-card text-left">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
              <span className="ml-2 text-xs text-muted-foreground">curl</span>
            </div>
            <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
              <code className="text-muted-foreground">
                <span className="text-green-400">curl</span>{' https://api.anytokens.net/v1/chat/completions \\\n'}
                {'  -H '}<span className="text-amber-300">{'"Authorization: Bearer sk-any-..."'}</span>{' \\\n'}
                {'  -H '}<span className="text-amber-300">{'"Content-Type: application/json"'}</span>{' \\\n'}
                {'  -d '}<span className="text-amber-300">{'\'{"model":"gpt-4o","messages":[{"role":"user","content":"Hello"}]}\''}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* 统计数据栏 */}
      <section className="border-b border-border/40 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-6 text-center md:grid-cols-3 md:gap-8">
          <div>
            <div className="text-3xl font-bold sm:text-4xl">30+</div>
            <p className="mt-1 text-sm text-muted-foreground">{t.stats_models}</p>
          </div>
          <div>
            <div className="text-3xl font-bold sm:text-4xl">1,200+</div>
            <p className="mt-1 text-sm text-muted-foreground">{t.stats_users}</p>
          </div>
          <div>
            <div className="text-3xl font-bold sm:text-4xl">99.9%</div>
            <p className="mt-1 text-sm text-muted-foreground">{t.stats_uptime}</p>
          </div>
        </div>
      </section>

      {/* 核心功能卡片 */}
      <section className="border-b border-border/40 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 sm:grid-cols-3">
          {[
            { icon: Blocks, title: t.feat_title_1, desc: t.feat_desc_1 },
            { icon: Zap, title: t.feat_title_2, desc: t.feat_desc_2 },
            { icon: BarChart3, title: t.feat_title_3, desc: t.feat_desc_3 },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border/60 bg-card/50 p-6">
              <item.icon className="mb-3 h-8 w-8 text-primary/70" />
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 模型列表 */}
      <section id="models" className="border-b border-border/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.models_title}</h2>
            <p className="mt-3 text-muted-foreground">{t.models_subtitle}</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <div
                key={model.name}
                className="group flex items-center justify-between rounded-lg border border-border/60 bg-card/30 px-4 py-3.5 transition-colors hover:border-border hover:bg-card/80"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{model.name}</span>
                    <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px]">{model.tag}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{model.provider}</span>
                </div>
                <span className={`shrink-0 font-mono text-sm ${model.free ? 'text-green-400' : 'text-muted-foreground'}`}>
                  {model.price}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t.models_note} · <span className="text-green-400">{t.models_free}</span>
          </p>
        </div>
      </section>

      {/* 定价区 */}
      <section id="pricing" className="border-b border-border/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.pricing_title}</h2>
            <p className="mt-3 text-muted-foreground">{t.pricing_subtitle}</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* 免费 */}
            <PricingCard
              name={t.pricing_free_name}
              price="$0"
              desc={t.pricing_free_desc}
              features={[t.pricing_feat_free_models, t.pricing_feat_free_list, t.pricing_feat_free_rate, t.pricing_feat_free_period]}
              cta={t.pricing_cta_free}
              href="/register"
            />
            {/* 按量付费 */}
            <PricingCard
              name={t.pricing_pay_name}
              price="$5+"
              desc={t.pricing_pay_desc}
              features={[t.pricing_feat_pay_all, t.pricing_feat_pay_token, t.pricing_feat_pay_rate, t.pricing_feat_pay_report]}
              cta={t.pricing_cta_start}
              href="/register"
              highlight
              badge={t.pricing_recommend}
            />
            {/* 企业 */}
            <PricingCard
              name={t.pricing_ent_name}
              price="Custom"
              desc={t.pricing_ent_desc}
              features={[t.pricing_feat_ent_channel, t.pricing_feat_ent_rate, t.pricing_feat_ent_team, t.pricing_feat_ent_support]}
              cta={t.pricing_cta_contact}
              href="mailto:contact@anytokens.net"
            />
          </div>
        </div>
      </section>

      {/* 开发者快速开始 */}
      <section className="border-b border-border/40 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.quickstart_title}</h2>
            <p className="mt-3 text-muted-foreground">{t.quickstart_subtitle}</p>
          </div>
          <div className="mt-12 space-y-4">
            {[t.quickstart_step1, t.quickstart_step2, t.quickstart_step3].map((step) => (
              <div key={step} className="rounded-lg border border-border/60 bg-card/30 px-5 py-4 text-sm">{step}</div>
            ))}
            <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
              <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2">
                <span className="text-xs text-muted-foreground">Python</span>
              </div>
              <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
                <code className="text-muted-foreground">
                  <span className="text-violet-400">from</span> openai <span className="text-violet-400">import</span> OpenAI{'\n\n'}
                  client = OpenAI({'\n'}
                  {'    '}base_url=<span className="text-amber-300">&quot;https://api.anytokens.net/v1&quot;</span>,{'\n'}
                  {'    '}api_key=<span className="text-amber-300">&quot;sk-any-...&quot;</span>,{'\n'}
                  ){'\n\n'}
                  response = client.chat.completions.create({'\n'}
                  {'    '}model=<span className="text-amber-300">&quot;deepseek-v3&quot;</span>,{'\n'}
                  {'    '}messages=[{'{'}
                  <span className="text-amber-300">&quot;role&quot;</span>: <span className="text-amber-300">&quot;user&quot;</span>, <span className="text-amber-300">&quot;content&quot;</span>: <span className="text-amber-300">&quot;Hello&quot;</span>
                  {'}'}],{'\n'}
                  ){'\n'}
                  <span className="text-violet-400">print</span>(response.choices[<span className="text-green-400">0</span>].message.content)
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* 支付方式 */}
      <section className="border-b border-border/40 py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h3 className="text-lg font-semibold">{t.payment_title}</h3>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span>Visa / MasterCard</span>
            <span className="text-border">|</span>
            <span>Stripe</span>
            <span className="text-border">|</span>
            <span>USDT (TRC20 / ERC20)</span>
            <span className="text-border">|</span>
            <span>BTC / ETH</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t.payment_currency}</p>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <span className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Anytokens. All rights reserved.
          </span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/docs" className="transition-colors hover:text-foreground">{t.footer_docs}</Link>
            <Link href="/pricing" className="transition-colors hover:text-foreground">{t.footer_pricing}</Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">{t.footer_terms}</Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">{t.footer_privacy}</Link>
            <Link href="mailto:contact@anytokens.net" className="transition-colors hover:text-foreground">{t.footer_contact}</Link>
          </div>
        </div>
      </footer>

      {/* 客服悬浮按钮 */}
      <CustomerService />
    </div>
  );
}

// 定价卡片子组件
function PricingCard({ name, price, desc, features, cta, href, highlight, badge }: {
  name: string; price: string; desc: string;
  features: string[]; cta: string; href: string;
  highlight?: boolean; badge?: string;
}) {
  return (
    <div className={`relative rounded-xl border p-6 ${highlight ? 'border-primary/50 bg-card shadow-lg shadow-primary/5' : 'border-border/60 bg-card/30'}`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge>{badge}</Badge>
        </div>
      )}
      <div className="text-center">
        <h3 className="text-lg font-semibold">{name}</h3>
        <div className="mt-3 text-3xl font-bold">{price}</div>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
      <ul className="mt-6 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-0.5 text-green-400">&#10003;</span>{f}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Link href={href}>
          <Button variant={highlight ? 'default' : 'outline'} className="w-full">{cta}</Button>
        </Link>
      </div>
    </div>
  );
}
