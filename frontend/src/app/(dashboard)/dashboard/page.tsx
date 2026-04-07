'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Key, Activity, Zap } from 'lucide-react';

// 仪表盘概览页
export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">欢迎回来，{user?.name}</h1>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">账户余额</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${user?.balance || '0.00'}</div>
            <p className="text-xs text-muted-foreground">USD</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API 密钥</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">个有效密钥</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日调用</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">次 API 调用</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日消耗</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Tokens</p>
          </CardContent>
        </Card>
      </div>

      {/* 快速开始 */}
      <Card>
        <CardHeader>
          <CardTitle>快速开始</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium">1. 创建 API 密钥</p>
            <p className="text-sm text-muted-foreground">
              前往 API 密钥页面创建你的第一个密钥
            </p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium">2. 调用 API</p>
            <p className="text-sm text-muted-foreground">
              使用 OpenAI 兼容格式调用任意模型
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
