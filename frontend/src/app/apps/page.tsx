'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { useI18n } from '@/lib/i18n';
import { Search, ExternalLink, Check, X, Zap } from 'lucide-react';
import { aiApps, type AiApp, type AppCategory } from '@/data/ai-apps';

const CATEGORIES: { key: AppCategory | 'all'; icon: string }[] = [
  { key: 'all', icon: '🌐' },
  { key: 'chat', icon: '💬' },
  { key: 'coding', icon: '💻' },
  { key: 'image', icon: '🎨' },
  { key: 'video', icon: '🎬' },
  { key: 'audio', icon: '🎵' },
  { key: 'writing', icon: '✍️' },
  { key: 'search', icon: '🔍' },
  { key: 'productivity', icon: '⚡' },
  { key: 'image-edit', icon: '🖌️' },
  { key: 'other', icon: '📦' },
];

// 分类翻译映射
function getCategoryLabel(key: string, t: any): string {
  const map: Record<string, string> = {
    all: t.apps_all,
    chat: t.apps_chat,
    coding: t.apps_coding,
    image: t.apps_image,
    video: t.apps_video,
    audio: t.apps_audio,
    writing: t.apps_writing,
    search: t.apps_search_cat,
    productivity: t.apps_productivity,
    'image-edit': t.apps_image_edit,
    other: t.apps_other,
  };
  return map[key] || key;
}

export default function AppsPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<AppCategory | 'all'>('all');
  const [selected, setSelected] = useState<AiApp | null>(null);

  // 过滤应用
  const filtered = useMemo(() => {
    let apps = aiApps;
    if (category !== 'all') {
      apps = apps.filter((a) => a.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      apps = apps.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.company.toLowerCase().includes(q) ||
          a.features.some((f) => f.toLowerCase().includes(q)) ||
          a.useCases.some((u) => u.toLowerCase().includes(q)),
      );
    }
    return apps;
  }, [search, category]);

  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 */}
      <PublicNavbar />

      {/* 标题 + 搜索 */}
      <section className="border-b border-border/40 py-12">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.apps_title}</h1>
          <p className="mt-3 text-muted-foreground">{t.apps_subtitle}</p>
          <div className="relative mx-auto mt-8 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.apps_search}
              className="pl-10"
            />
          </div>
        </div>
      </section>

      {/* 分类标签 */}
      <div className="border-b border-border/40">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 py-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                category === cat.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              <span>{cat.icon}</span>
              {getCategoryLabel(cat.key, t)}
            </button>
          ))}
        </div>
      </div>

      {/* 应用卡片网格 */}
      <section className="py-8">
        <div className="mx-auto max-w-6xl px-6">
          {filtered.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">{t.apps_no_results}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((app) => (
                <Card
                  key={app.id}
                  className="cursor-pointer border-border/60 transition-colors hover:border-border hover:bg-card/80"
                  onClick={() => setSelected(app)}
                >
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg">
                        {app.logo}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold">{app.name}</h3>
                        <p className="text-xs text-muted-foreground">{app.company}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(app.category, t)}
                      </Badge>
                      {app.anytokensSupported && (
                        <Badge variant="secondary" className="text-xs">
                          <Zap className="mr-0.5 h-3 w-3" />
                          Anytokens
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{app.pricing}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 详情弹窗 */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                  {selected.logo}
                </div>
                <div>
                  <DialogTitle className="text-xl">{selected.name}</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {selected.company} · {selected.hq}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 pt-2">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">{t.apps_version}:</span>{' '}
                  <span className="font-medium">{selected.version}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.apps_released}:</span>{' '}
                  <span className="font-medium">{selected.released}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.apps_languages}:</span>{' '}
                  <span className="font-medium">{selected.languages}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.apps_api}:</span>{' '}
                  <span className="font-medium">{selected.hasApi ? '✅' : '❌'}</span>
                </div>
              </div>

              {/* 平台 */}
              <div>
                <h4 className="mb-2 text-sm font-medium">{t.apps_platforms}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selected.platforms.map((p) => (
                    <Badge key={p} variant="outline">{p}</Badge>
                  ))}
                </div>
              </div>

              {/* 定价 */}
              <div>
                <h4 className="mb-1 text-sm font-medium">{t.apps_pricing}</h4>
                <p className="text-sm text-muted-foreground">{selected.pricing}</p>
              </div>

              {/* Anytokens 支持 */}
              {selected.anytokensSupported && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-sm">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-medium text-primary">{t.apps_via_anytokens}</span>
                </div>
              )}

              {/* 核心功能 */}
              <div>
                <h4 className="mb-2 text-sm font-medium">{t.apps_features}</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {selected.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 text-green-500">•</span>{f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 使用场景 */}
              <div>
                <h4 className="mb-2 text-sm font-medium">{t.apps_use_cases}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selected.useCases.map((u, i) => (
                    <Badge key={i} variant="secondary">{u}</Badge>
                  ))}
                </div>
              </div>

              {/* 使用方法 */}
              <div>
                <h4 className="mb-2 text-sm font-medium">{t.apps_how_to_use}</h4>
                <ol className="space-y-1 text-sm text-muted-foreground">
                  {selected.howToUse.map((s, i) => (
                    <li key={i}>{i + 1}. {s}</li>
                  ))}
                </ol>
              </div>

              {/* 优缺点 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium text-green-600">{t.apps_pros}</h4>
                  <ul className="space-y-1 text-sm">
                    {selected.pros.map((p, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />{p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium text-red-500">{t.apps_cons}</h4>
                  <ul className="space-y-1 text-sm">
                    {selected.cons.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />{c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 官网按钮 */}
              <a href={selected.url} target="_blank" rel="noopener noreferrer">
                <Button className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t.apps_visit}
                </Button>
              </a>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
