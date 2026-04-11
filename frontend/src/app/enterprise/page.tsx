'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
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

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const res = await fetch(`${apiBase}/enterprise/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.code !== 0) throw new Error(data.message);
      setFormSent(true);
    } catch (err: any) {
      setSubmitError(err.message || '提交失败，请发邮件至 support@anytokens.net');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 */}
      <PublicNavbar />

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
              {submitError && <p className="text-sm text-red-500">{submitError}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>{submitting ? '...' : t.ent_form_submit}</Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
