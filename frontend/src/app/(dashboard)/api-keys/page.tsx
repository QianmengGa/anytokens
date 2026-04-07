'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

// API 密钥管理页（骨架）
export default function ApiKeysPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API 密钥</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          创建密钥
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>我的密钥</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">暂无 API 密钥，点击上方按钮创建你的第一个密钥。</p>
        </CardContent>
      </Card>
    </div>
  );
}
