'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Key, Activity, DollarSign, Plus, Loader2, Users, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface DashboardStats {
  balance: string;
  apiKeyCount: number;
  todayCalls: number;
  monthCalls: number;
  totalSpent: string;
  usageByType?: { chat: number; embedding: number; image: number; tts: number };
}

interface ReferralStats {
  referralCode: string;
  refereeCount: number;
  totalCommission: string;
}

// 仪表盘概览页
export default function DashboardPage() {
  const { data: session } = useSession();
  const { t } = useI18n();
  const user = session?.user;

  const [copied, setCopied] = useState(false);

  const { data: referral } = useQuery<ReferralStats>({
    queryKey: ['referral-stats'],
    queryFn: async () => {
      const res = await api.get('/user/referral');
      return res.data.data;
    },
    enabled: !!session,
  });

  const referralLink = referral ? `${typeof window !== 'undefined' ? window.location.origin : 'https://anytokens.net'}/register?ref=${referral.referralCode}` : '';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/user/dashboard-stats');
      return res.data.data;
    },
    enabled: !!session, // 等 session 就绪后再请求
    refetchInterval: 30000,
    retry: 2,
  });

  // 显示值：加载中用 - ，失败用 0
  const balance = stats?.balance ?? (user as any)?.balance ?? '0';
  const apiKeyCount = stats?.apiKeyCount ?? 0;
  const todayCalls = stats?.todayCalls ?? 0;
  const monthCalls = stats?.monthCalls ?? 0;
  const totalSpent = stats?.totalSpent ?? '0';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.dash_welcome}{user?.name}</h1>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.dash_balance}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `$${Number(balance).toFixed(2)}`}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-xs text-muted-foreground">USD</p>
              <Link href="/billing">
                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
                  <Plus className="h-3 w-3" />
                  {t.billing_recharge}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.dash_api_keys}</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : apiKeyCount}
            </div>
            <p className="text-xs text-muted-foreground">{t.dash_api_keys_unit}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.dash_today_calls}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : todayCalls}
            </div>
            <p className="text-xs text-muted-foreground">
              {t.dash_month_calls}: {isLoading ? '...' : monthCalls} {t.dash_month_calls_unit}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.dash_total_spent}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `$${Number(totalSpent).toFixed(4)}`}
            </div>
            <p className="text-xs text-muted-foreground">USD</p>
          </CardContent>
        </Card>
      </div>

      {/* 本月用量分布 */}
      {stats?.usageByType && (stats.usageByType.chat + stats.usageByType.embedding + stats.usageByType.image + stats.usageByType.tts) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t.dash_usage_by_type}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              {[
                { label: 'Chat', value: stats.usageByType.chat },
                { label: 'Embedding', value: stats.usageByType.embedding },
                { label: 'Image', value: stats.usageByType.image },
                { label: 'TTS', value: stats.usageByType.tts },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 邀请返佣 */}
      {referral && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t.dash_referral}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">{t.dash_ref_code}</p>
                <p className="mt-1 font-mono text-lg font-semibold">{referral.referralCode}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">{t.dash_ref_count}</p>
                <p className="mt-1 text-lg font-semibold">{referral.refereeCount}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">{t.dash_ref_earned}</p>
                <p className="mt-1 text-lg font-semibold text-green-500">${Number(referral.totalCommission).toFixed(4)}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">{t.dash_ref_link}</p>
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="sm" className="shrink-0 gap-1" onClick={() => handleCopy(referralLink)}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? t.dash_ref_copied : t.dash_ref_copy}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t.dash_ref_desc}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 快速开始 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.dash_quickstart}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium">{t.dash_step1_title}</p>
            <p className="text-sm text-muted-foreground">
              {t.dash_step1_desc}
            </p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium">{t.dash_step2_title}</p>
            <p className="text-sm text-muted-foreground">
              {t.dash_step2_desc}
            </p>
            <pre className="mt-2 rounded bg-background p-3 text-xs">
{`curl ${process.env.NEXT_PUBLIC_API_BASE || 'https://api.anytokens.com'}/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"deepseek-v3","messages":[{"role":"user","content":"Hello!"}]}'`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
