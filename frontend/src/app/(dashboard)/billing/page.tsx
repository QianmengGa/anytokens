'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// 账单页（骨架）
export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">账单 & 充值</h1>
        <Button>充值</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>充值套餐</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">充值功能即将上线，敬请期待。</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>交易记录</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">暂无交易记录。</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
