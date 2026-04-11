'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { CustomerService } from '@/components/CustomerService';
import { useI18n } from '@/lib/i18n';
import { Check, Zap, Shield, Headphones } from 'lucide-react';

// 免费模型列表
const FREE_MODELS = [
  { name: 'deepseek-v3', provider: 'DeepSeek', desc: 'Flagship free' },
  { name: 'qwen2.5-7b', provider: 'Alibaba', desc: 'Lightweight' },
  { name: 'qwen3-8b', provider: 'Alibaba', desc: 'Latest gen' },
  { name: 'glm-4-9b', provider: 'Zhipu', desc: 'Tsinghua AI' },
  { name: 'deepseek-r1-7b', provider: 'DeepSeek', desc: 'Reasoning distill' },
  { name: 'gemini-2.0-flash', provider: 'Google', desc: 'Fast & free' },
];

// 付费模型定价表
const PAID_MODELS = [
  { name: 'deepseek-v3', provider: 'DeepSeek', input: 0.42, output: 1.68, quality: 9 },
  { name: 'deepseek-r1', provider: 'DeepSeek', input: 0.66, output: 2.64, quality: 9 },
  { name: 'gemini-2.5-pro', provider: 'Google', input: 1.25, output: 5.00, quality: 9 },
  { name: 'gemini-2.0-flash', provider: 'Google', input: 0.10, output: 0.40, quality: 7 },
  { name: 'grok-3', provider: 'xAI', input: 3.00, output: 15.00, quality: 9 },
  { name: 'grok-3-mini', provider: 'xAI', input: 0.30, output: 0.50, quality: 8 },
  { name: 'mistral-large', provider: 'Mistral', input: 2.00, output: 6.00, quality: 8 },
  { name: 'llama-3.3-70b', provider: 'Meta', input: 0.59, output: 0.79, quality: 8 },
  { name: 'phi-4', provider: 'Microsoft', input: 0.07, output: 0.14, quality: 7 },
  { name: 'qwen2.5-72b', provider: 'Alibaba', input: 0.84, output: 0.84, quality: 8 },
];

// Embeddings / Images / TTS 定价
const EXTRA_MODELS = [
  { name: 'text-embedding-3-small', type: 'Embeddings', price: '$0.02 / 1M tokens' },
  { name: 'text-embedding-3-large', type: 'Embeddings', price: '$0.13 / 1M tokens' },
  { name: 'dall-e-3', type: 'Images', price: '$0.04 / image' },
  { name: 'dall-e-3-hd', type: 'Images', price: '$0.08 / image' },
  { name: 'tts-1', type: 'TTS', price: '$15.00 / 1M chars' },
];

export default function PricingPage() {
  const { t } = useI18n();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      {/* Hero */}
      <section className="border-b border-border/40 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t.pricing_title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{t.pricing_subtitle}</p>
        </div>
      </section>

      {/* 三个定价卡片 */}
      <section className="border-b border-border/40 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 sm:grid-cols-3">
          {/* 免费试用 */}
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
            cta={session ? t.pricing_cta_start : t.pricing_cta_free}
            href={session ? '/billing' : '/register'}
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
            href="/enterprise"
          />
        </div>
      </section>

      {/* 免费模型 */}
      <section className="border-b border-border/40 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-2xl font-bold tracking-tight">{t.docs_models_free}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.pricing_feat_free_models} — {t.pricing_feat_free_list}
          </p>
          <div className="mt-6 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Model</th>
                  <th className="px-4 py-3 text-left font-medium">Provider</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {FREE_MODELS.map((m) => (
                  <tr key={m.name} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{m.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.provider}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.desc}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="secondary" className="text-green-600">Free</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 付费 Chat 模型定价 */}
      <section className="border-b border-border/40 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-2xl font-bold tracking-tight">Chat Completions</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            POST /v1/chat/completions — per 1M tokens (USD)
          </p>
          <div className="mt-6 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Model</th>
                  <th className="px-4 py-3 text-left font-medium">Provider</th>
                  <th className="px-4 py-3 text-right font-medium">Input / 1M</th>
                  <th className="px-4 py-3 text-right font-medium">Output / 1M</th>
                </tr>
              </thead>
              <tbody>
                {PAID_MODELS.map((m) => (
                  <tr key={m.name} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{m.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.provider}</td>
                    <td className="px-4 py-3 text-right font-mono">${m.input.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono">${m.output.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Embeddings / Images / TTS */}
      <section className="border-b border-border/40 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-2xl font-bold tracking-tight">Embeddings / Images / TTS</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            POST /v1/embeddings · /v1/images/generations · /v1/audio/speech
          </p>
          <div className="mt-6 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Model</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {EXTRA_MODELS.map((m) => (
                  <tr key={m.name} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{m.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.type}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{m.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 优势 */}
      <section className="border-b border-border/40 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 px-6 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-card/30 p-6 text-center">
            <Zap className="mx-auto mb-3 h-8 w-8 text-primary/70" />
            <h3 className="font-semibold">{t.feat_title_2}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t.feat_desc_2}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/30 p-6 text-center">
            <Shield className="mx-auto mb-3 h-8 w-8 text-primary/70" />
            <h3 className="font-semibold">{t.feat_title_3}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t.feat_desc_3}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/30 p-6 text-center">
            <Headphones className="mx-auto mb-3 h-8 w-8 text-primary/70" />
            <h3 className="font-semibold">{t.pricing_feat_ent_support}</h3>
            <p className="mt-2 text-sm text-muted-foreground">Email / Telegram / Discord</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">{t.hero_cta}</h2>
          <p className="mt-3 text-muted-foreground">{t.pricing_free_desc}</p>
          <div className="mt-8">
            <Link href={session ? '/billing' : '/register'}>
              <Button size="lg" className="h-12 px-8 text-base">
                {session ? t.pricing_cta_start : t.pricing_cta_free}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="border-t border-border/40 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <span className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Anytokens. All rights reserved.
          </span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/docs" className="transition-colors hover:text-foreground">{t.footer_docs}</Link>
            <Link href="/pricing" className="transition-colors hover:text-foreground">{t.footer_pricing}</Link>
            <Link href="/enterprise" className="transition-colors hover:text-foreground">{t.nav_enterprise}</Link>
          </div>
        </div>
      </footer>

      <CustomerService />
    </div>
  );
}

// 定价卡片组件
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
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
            {f}
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
