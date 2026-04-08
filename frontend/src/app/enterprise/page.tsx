'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n';
import {
  Users, Infinity, ShieldCheck, HeadsetIcon, FileText, Activity, Check,
} from 'lucide-react';

export default function EnterprisePage() {
  const { t } = useI18n();
  const [formSent, setFormSent] = useState(false);
  const [formData, setFormData] = useState({ company: '', name: '', email: '', message: '' });

  const features = [
    { icon: Users, title: t.ent_feat_team, desc: t.ent_feat_team_desc },
    { icon: Infinity, title: t.ent_feat_quota, desc: t.ent_feat_quota_desc },
    { icon: ShieldCheck, title: t.ent_feat_privacy, desc: t.ent_feat_privacy_desc },
    { icon: HeadsetIcon, title: t.ent_feat_support, desc: t.ent_feat_support_desc },
    { icon: FileText, title: t.ent_feat_contract, desc: t.ent_feat_contract_desc },
    { icon: Activity, title: t.ent_feat_sla, desc: t.ent_feat_sla_desc },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 发送到 enterprise@anytokens.com（暂用 console.log）
    console.log('[Enterprise] Form submitted:', formData);
    setFormSent(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="flex h-16 w-full items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-primary">Any</span>
            <span className="text-muted-foreground">tokens</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-border/40 py-20 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t.ent_title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{t.ent_subtitle}</p>
        </div>
      </section>

      {/* 功能网格 */}
      <section className="py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="border-border/60">
              <CardContent className="pt-6">
                <f.icon className="mb-3 h-8 w-8 text-primary" />
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 联系表单 */}
      <section className="border-t border-border/40 py-16">
        <div className="mx-auto max-w-lg px-6">
          <h2 className="mb-8 text-center text-2xl font-bold">{t.ent_form_title}</h2>

          {formSent ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-8 text-center">
              <Check className="h-10 w-10 text-green-500" />
              <p className="text-lg font-medium">{t.ent_form_sent}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t.ent_form_company}</Label>
                <Input
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.ent_form_name}</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.ent_form_email}</Label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.ent_form_message}</Label>
                <Textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="resize-none"
                />
              </div>
              <Button type="submit" className="w-full">{t.ent_form_submit}</Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
