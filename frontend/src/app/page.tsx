import Link from 'next/link';
import { Button } from '@/components/ui/button';

// 首页 — 引导用户注册/登录
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Anytokens
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          统一 AI API 中转平台 — 一个 Key 调用所有模型
        </p>
        <p className="mt-2 text-muted-foreground">
          支持 GPT-4o、Claude、Gemini、DeepSeek 等 30+ 主流模型
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg">免费注册</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              登录
            </Button>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">统一接口</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              兼容 OpenAI 格式，无缝切换模型
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">按量计费</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              按 Token 实时计费，透明无隐藏费用
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">免费试用</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              注册即送 $0.50 额度，立即体验
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
