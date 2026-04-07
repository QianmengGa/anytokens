'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

// 聊天界面（骨架）
export default function ChatPage() {
  return (
    <div className="flex h-full flex-col">
      <h1 className="mb-4 text-2xl font-bold">AI 聊天</h1>

      <Card className="flex flex-1 flex-col">
        <CardHeader>
          <CardTitle className="text-sm">当前模型：deepseek-v3</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          {/* 聊天消息区域 */}
          <div className="flex-1 space-y-4 overflow-auto">
            <p className="text-center text-muted-foreground">
              开始和 AI 对话吧
            </p>
          </div>

          {/* 输入区域 */}
          <div className="mt-4 flex gap-2">
            <Input placeholder="输入消息..." className="flex-1" />
            <Button size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
