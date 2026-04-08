'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Key, Activity, Zap, Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// 仪表盘概览页
export default function DashboardPage() {
  const { data: session } = useSession();
  const { t } = useI18n();
  const user = session?.user;

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
            <div className="text-2xl font-bold">${user?.balance || '0.00'}</div>
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
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">{t.dash_api_keys_unit}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.dash_today_calls}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">{t.dash_today_calls_unit}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.dash_today_tokens}</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">{t.dash_today_tokens_unit}</p>
          </CardContent>
        </Card>
      </div>

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
{`curl ${process.env.NEXT_PUBLIC_API_URL || 'https://api.anytokens.com'}/v1/chat/completions \\
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
