'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { useI18n } from '@/lib/i18n';
import { ArrowUpDown, Search, Play } from 'lucide-react';

// 模型完整信息
interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  inputPrice: number;
  outputPrice: number;
  contextLength: number;
  speed: number;       // 1-5 星
  free: boolean;
  type?: 'chat' | 'embedding' | 'image' | 'tts';
}

const ALL_MODELS: ModelInfo[] = [
  // === DeepSeek ===
  { id: 'deepseek-v3.2', name: 'DeepSeek V3.2', provider: 'DeepSeek', inputPrice: 1.00, outputPrice: 4.00, contextLength: 128000, speed: 4, free: false },
  { id: 'deepseek-v3.1', name: 'DeepSeek V3.1', provider: 'DeepSeek', inputPrice: 4.00, outputPrice: 12.00, contextLength: 64000, speed: 3, free: false },
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek', inputPrice: 0.42, outputPrice: 1.68, contextLength: 64000, speed: 4, free: false },
  { id: 'deepseek-v2.5', name: 'DeepSeek V2.5', provider: 'DeepSeek', inputPrice: 0.21, outputPrice: 0.84, contextLength: 32000, speed: 4, free: false },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', inputPrice: 0.66, outputPrice: 2.64, contextLength: 64000, speed: 3, free: false },
  { id: 'deepseek-r1-32b', name: 'DeepSeek R1 32B', provider: 'DeepSeek', inputPrice: 0.56, outputPrice: 1.12, contextLength: 32000, speed: 4, free: false },
  { id: 'deepseek-r1-14b', name: 'DeepSeek R1 14B', provider: 'DeepSeek', inputPrice: 0.35, outputPrice: 0.70, contextLength: 32000, speed: 4, free: false },
  { id: 'deepseek-r1-7b', name: 'DeepSeek R1 7B', provider: 'DeepSeek', inputPrice: 0, outputPrice: 0, contextLength: 32000, speed: 5, free: true },
  { id: 'deepseek-r1-0528-8b', name: 'DeepSeek R1 0528 8B', provider: 'DeepSeek', inputPrice: 0, outputPrice: 0, contextLength: 32000, speed: 5, free: true },

  // === Qwen3.5（最新一代）===
  { id: 'qwen3.5-397b', name: 'Qwen3.5 397B', provider: 'Alibaba', inputPrice: 3.50, outputPrice: 14.00, contextLength: 131072, speed: 2, free: false },
  { id: 'qwen3.5-122b', name: 'Qwen3.5 122B', provider: 'Alibaba', inputPrice: 1.50, outputPrice: 6.00, contextLength: 131072, speed: 3, free: false },
  { id: 'qwen3.5-35b', name: 'Qwen3.5 35B', provider: 'Alibaba', inputPrice: 0.35, outputPrice: 1.40, contextLength: 131072, speed: 4, free: false },
  { id: 'qwen3.5-27b', name: 'Qwen3.5 27B', provider: 'Alibaba', inputPrice: 0.50, outputPrice: 2.00, contextLength: 131072, speed: 4, free: false },
  { id: 'qwen3.5-9b', name: 'Qwen3.5 9B', provider: 'Alibaba', inputPrice: 0, outputPrice: 0, contextLength: 131072, speed: 5, free: true },
  { id: 'qwen3.5-4b', name: 'Qwen3.5 4B', provider: 'Alibaba', inputPrice: 0, outputPrice: 0, contextLength: 32768, speed: 5, free: true },

  // === Qwen3 ===
  { id: 'qwen3-235b', name: 'Qwen3 235B', provider: 'Alibaba', inputPrice: 2.50, outputPrice: 10.00, contextLength: 131072, speed: 2, free: false },
  { id: 'qwen3-235b-thinking', name: 'Qwen3 235B Thinking', provider: 'Alibaba', inputPrice: 2.50, outputPrice: 10.00, contextLength: 131072, speed: 2, free: false },
  { id: 'qwen3-32b', name: 'Qwen3 32B', provider: 'Alibaba', inputPrice: 0, outputPrice: 0, contextLength: 32768, speed: 4, free: true },
  { id: 'qwen3-30b', name: 'Qwen3 30B', provider: 'Alibaba', inputPrice: 0.35, outputPrice: 1.40, contextLength: 131072, speed: 4, free: false },
  { id: 'qwen3-14b', name: 'Qwen3 14B', provider: 'Alibaba', inputPrice: 0.35, outputPrice: 0.70, contextLength: 32768, speed: 4, free: false },
  { id: 'qwen3-8b', name: 'Qwen3 8B', provider: 'Alibaba', inputPrice: 0, outputPrice: 0, contextLength: 32768, speed: 5, free: true },
  { id: 'qwq-32b', name: 'QwQ 32B', provider: 'Alibaba', inputPrice: 0.56, outputPrice: 1.12, contextLength: 32768, speed: 4, free: false },

  // === Qwen3 视觉 ===
  { id: 'qwen3-vl-235b', name: 'Qwen3 VL 235B', provider: 'Alibaba', inputPrice: 2.50, outputPrice: 10.00, contextLength: 131072, speed: 2, free: false },
  { id: 'qwen3-vl-32b', name: 'Qwen3 VL 32B', provider: 'Alibaba', inputPrice: 1.89, outputPrice: 1.89, contextLength: 32768, speed: 3, free: false },
  { id: 'qwen3-vl-30b', name: 'Qwen3 VL 30B', provider: 'Alibaba', inputPrice: 0.35, outputPrice: 1.40, contextLength: 131072, speed: 3, free: false },
  { id: 'qwen3-vl-8b', name: 'Qwen3 VL 8B', provider: 'Alibaba', inputPrice: 0, outputPrice: 0, contextLength: 32768, speed: 5, free: true },

  // === Qwen3 Coder ===
  { id: 'qwen3-coder-480b', name: 'Qwen3 Coder 480B', provider: 'Alibaba', inputPrice: 4.00, outputPrice: 16.00, contextLength: 131072, speed: 2, free: false },
  { id: 'qwen3-coder-30b', name: 'Qwen3 Coder 30B', provider: 'Alibaba', inputPrice: 0.35, outputPrice: 1.40, contextLength: 131072, speed: 4, free: false },

  // === Qwen2.5 ===
  { id: 'qwen2.5-72b', name: 'Qwen2.5 72B', provider: 'Alibaba', inputPrice: 0.84, outputPrice: 0.84, contextLength: 32768, speed: 3, free: false },
  { id: 'qwen2.5-72b-128k', name: 'Qwen2.5 72B 128K', provider: 'Alibaba', inputPrice: 1.05, outputPrice: 1.05, contextLength: 131072, speed: 3, free: false },
  { id: 'qwen2.5-32b', name: 'Qwen2.5 32B', provider: 'Alibaba', inputPrice: 0.56, outputPrice: 1.12, contextLength: 32768, speed: 4, free: false },
  { id: 'qwen2.5-14b', name: 'Qwen2.5 14B', provider: 'Alibaba', inputPrice: 0.35, outputPrice: 0.70, contextLength: 32768, speed: 4, free: false },
  { id: 'qwen2.5-7b', name: 'Qwen2.5 7B', provider: 'Alibaba', inputPrice: 0, outputPrice: 0, contextLength: 32768, speed: 5, free: true },
  { id: 'qwen2.5-coder-32b', name: 'Qwen2.5 Coder 32B', provider: 'Alibaba', inputPrice: 0, outputPrice: 0, contextLength: 32768, speed: 4, free: true },
  { id: 'qwen2.5-vl-72b', name: 'Qwen2.5 VL 72B', provider: 'Alibaba', inputPrice: 2.52, outputPrice: 2.52, contextLength: 32768, speed: 3, free: false },
  { id: 'qwen2.5-vl-32b', name: 'Qwen2.5 VL 32B', provider: 'Alibaba', inputPrice: 1.89, outputPrice: 1.89, contextLength: 32768, speed: 3, free: false },
  { id: 'qwen2-vl-72b', name: 'Qwen2 VL 72B', provider: 'Alibaba', inputPrice: 2.52, outputPrice: 2.52, contextLength: 32768, speed: 3, free: false },

  // === GLM 系列（智谱）===
  { id: 'glm-5.1', name: 'GLM-5.1', provider: 'Zhipu', inputPrice: 2.00, outputPrice: 8.00, contextLength: 128000, speed: 3, free: false },
  { id: 'glm-5', name: 'GLM-5', provider: 'Zhipu', inputPrice: 1.50, outputPrice: 6.00, contextLength: 128000, speed: 3, free: false },
  { id: 'glm-4.7', name: 'GLM-4.7', provider: 'Zhipu', inputPrice: 0.84, outputPrice: 2.52, contextLength: 128000, speed: 3, free: false },
  { id: 'glm-4.6', name: 'GLM-4.6', provider: 'Zhipu', inputPrice: 0.56, outputPrice: 1.68, contextLength: 128000, speed: 4, free: false },
  { id: 'glm-4.6v', name: 'GLM-4.6V', provider: 'Zhipu', inputPrice: 0.70, outputPrice: 2.10, contextLength: 128000, speed: 3, free: false },
  { id: 'glm-4.5v', name: 'GLM-4.5V', provider: 'Zhipu', inputPrice: 0.56, outputPrice: 1.68, contextLength: 128000, speed: 3, free: false },
  { id: 'glm-4.5-air', name: 'GLM-4.5 Air', provider: 'Zhipu', inputPrice: 0, outputPrice: 0, contextLength: 128000, speed: 5, free: true },
  { id: 'glm-4-32b', name: 'GLM-4 32B', provider: 'Zhipu', inputPrice: 0.56, outputPrice: 1.12, contextLength: 128000, speed: 4, free: false },
  { id: 'glm-z1-32b', name: 'GLM-Z1 32B', provider: 'Zhipu', inputPrice: 0.56, outputPrice: 1.12, contextLength: 128000, speed: 4, free: false },
  { id: 'glm-z1-9b', name: 'GLM-Z1 9B', provider: 'Zhipu', inputPrice: 0, outputPrice: 0, contextLength: 128000, speed: 5, free: true },
  { id: 'glm-4-9b', name: 'GLM-4 9B', provider: 'Zhipu', inputPrice: 0, outputPrice: 0, contextLength: 128000, speed: 4, free: true },

  // === Kimi / Moonshot ===
  { id: 'kimi-k2.5', name: 'Kimi K2.5', provider: 'Moonshot', inputPrice: 1.50, outputPrice: 6.00, contextLength: 131072, speed: 3, free: false },
  { id: 'kimi-k2-thinking', name: 'Kimi K2 Thinking', provider: 'Moonshot', inputPrice: 1.00, outputPrice: 4.00, contextLength: 131072, speed: 3, free: false },
  { id: 'kimi-k2', name: 'Kimi K2', provider: 'Moonshot', inputPrice: 1.00, outputPrice: 4.00, contextLength: 131072, speed: 3, free: false },

  // === MiniMax ===
  { id: 'minimax-m2.5', name: 'MiniMax M2.5', provider: 'MiniMax', inputPrice: 1.50, outputPrice: 6.00, contextLength: 131072, speed: 3, free: false },

  // === Step（阶跃星辰）===
  { id: 'step-3.5-flash', name: 'Step 3.5 Flash', provider: 'StepFun', inputPrice: 0.14, outputPrice: 0.56, contextLength: 32768, speed: 5, free: false },

  // === ERNIE（百度文心）===
  { id: 'ernie-4.5', name: 'ERNIE 4.5', provider: 'Baidu', inputPrice: 2.80, outputPrice: 11.20, contextLength: 32768, speed: 3, free: false },

  // === Hunyuan（腾讯混元）===
  { id: 'hunyuan-a13b', name: 'Hunyuan A13B', provider: 'Tencent', inputPrice: 0.35, outputPrice: 1.40, contextLength: 32768, speed: 4, free: false },
  { id: 'hunyuan-mt-7b', name: 'Hunyuan MT 7B', provider: 'Tencent', inputPrice: 0, outputPrice: 0, contextLength: 32768, speed: 5, free: true },

  // === ByteDance Seed ===
  { id: 'seed-oss-36b', name: 'Seed OSS 36B', provider: 'ByteDance', inputPrice: 0.56, outputPrice: 1.68, contextLength: 32768, speed: 4, free: false },

  // === Ling（书生）===
  { id: 'ling-flash-2.0', name: 'Ling Flash 2.0', provider: 'InclusionAI', inputPrice: 0.14, outputPrice: 0.56, contextLength: 32768, speed: 5, free: false },
  { id: 'ling-mini-2.0', name: 'Ling Mini 2.0', provider: 'InclusionAI', inputPrice: 0, outputPrice: 0, contextLength: 32768, speed: 5, free: true },

  // === InternLM ===
  { id: 'internlm2.5-7b', name: 'InternLM 2.5 7B', provider: 'InternLM', inputPrice: 0, outputPrice: 0, contextLength: 32768, speed: 5, free: true },

  // === Yi ===
  { id: 'yi-lightning', name: 'Yi Lightning', provider: '01.AI', inputPrice: 0.99, outputPrice: 0.99, contextLength: 16384, speed: 4, free: false },

  // === Llama ===
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'Meta', inputPrice: 0, outputPrice: 0, contextLength: 32768, speed: 4, free: true },
  { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', provider: 'Meta', inputPrice: 0, outputPrice: 0, contextLength: 32768, speed: 5, free: true },
  { id: 'llama3-70b', name: 'Llama3 70B', provider: 'Groq', inputPrice: 0.71, outputPrice: 0.95, contextLength: 8192, speed: 5, free: false },

  // === Mistral ===
  { id: 'mistral-7b', name: 'Mistral 7B', provider: 'Mistral', inputPrice: 0, outputPrice: 0, contextLength: 32768, speed: 5, free: true },
  { id: 'mixtral-8x7b', name: 'Mixtral 8x7B', provider: 'Groq', inputPrice: 0.29, outputPrice: 0.29, contextLength: 32768, speed: 5, free: false },

  // === Google Gemini ===
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', inputPrice: 1.25, outputPrice: 5.00, contextLength: 1000000, speed: 3, free: false },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', inputPrice: 0.075, outputPrice: 1.20, contextLength: 1000000, speed: 5, free: false },

  // === Embeddings ===
  { id: 'text-embedding-3-small', name: 'Embedding 3 Small', provider: 'OpenAI', inputPrice: 0.02, outputPrice: 0, contextLength: 8191, speed: 5, free: false, type: 'embedding' },
  { id: 'text-embedding-3-large', name: 'Embedding 3 Large', provider: 'OpenAI', inputPrice: 0.13, outputPrice: 0, contextLength: 8191, speed: 4, free: false, type: 'embedding' },
  // === Image Generation ===
  { id: 'dall-e-3', name: 'DALL-E 3', provider: 'OpenAI', inputPrice: 0.04, outputPrice: 0, contextLength: 0, speed: 2, free: false, type: 'image' },
  { id: 'dall-e-3-hd', name: 'DALL-E 3 HD', provider: 'OpenAI', inputPrice: 0.08, outputPrice: 0, contextLength: 0, speed: 2, free: false, type: 'image' },
  // === TTS ===
  { id: 'tts-1', name: 'TTS-1', provider: 'OpenAI', inputPrice: 15.0, outputPrice: 0, contextLength: 4096, speed: 5, free: false, type: 'tts' },
];

const PROVIDERS = ['DeepSeek', 'Alibaba', 'Zhipu', 'Moonshot', 'MiniMax', 'Google', 'Groq', 'Meta', 'Mistral', 'Baidu', 'Tencent', 'ByteDance', 'StepFun', 'InclusionAI', '01.AI', 'InternLM', 'OpenAI'];

type SortKey = 'price' | 'speed' | 'context' | 'name';

// 格式化上下文长度
function fmtCtx(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(0)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return `${n}`;
}

// 速度星级
function SpeedStars({ speed }: { speed: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className={`h-2 w-2 rounded-full ${i < speed ? 'bg-primary' : 'bg-muted'}`} />
      ))}
    </div>
  );
}

export default function ModelsPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const toggleProvider = (p: string) => {
    const next = new Set(selectedProviders);
    if (next.has(p)) next.delete(p); else next.add(p);
    setSelectedProviders(next);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) { setSortAsc(!sortAsc); }
    else { setSortKey(key); setSortAsc(true); }
  };

  const filtered = useMemo(() => {
    let list = ALL_MODELS;
    // 搜索
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
    }
    // 供应商筛选
    if (selectedProviders.size > 0) {
      list = list.filter(m => selectedProviders.has(m.provider));
    }
    // 排序
    const sorted = [...list].sort((a, b) => {
      let diff = 0;
      switch (sortKey) {
        case 'price': diff = (a.inputPrice + a.outputPrice) - (b.inputPrice + b.outputPrice); break;
        case 'speed': diff = b.speed - a.speed; break;
        case 'context': diff = b.contextLength - a.contextLength; break;
        case 'name': diff = a.name.localeCompare(b.name); break;
      }
      return sortAsc ? diff : -diff;
    });
    return sorted;
  }, [search, selectedProviders, sortKey, sortAsc]);

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => handleSort(k)}
      className={`flex items-center gap-1 text-xs font-medium transition-colors ${sortKey === k ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.models_page_title}</h1>
          <p className="mt-3 text-muted-foreground">{t.models_page_subtitle}</p>
        </div>

        {/* 搜索 + 筛选 */}
        <div className="mt-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.models_search}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{t.models_filter}:</span>
            {PROVIDERS.map((p) => (
              <button
                key={p}
                onClick={() => toggleProvider(p)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  selectedProviders.has(p)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
            {selectedProviders.size > 0 && (
              <button
                onClick={() => setSelectedProviders(new Set())}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                {t.models_clear}
              </button>
            )}
          </div>
        </div>

        {/* 排序栏 */}
        <div className="mt-6 flex items-center gap-4 border-b border-border/60 pb-3">
          <span className="text-xs text-muted-foreground">{t.models_sort}:</span>
          <SortBtn k="name" label={t.models_col_name} />
          <SortBtn k="price" label={t.models_col_price} />
          <SortBtn k="speed" label={t.models_col_speed} />
          <SortBtn k="context" label={t.models_col_context} />
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} {t.models_count}</span>
        </div>

        {/* 模型列表 */}
        <div className="mt-4 space-y-2">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="group flex flex-col gap-3 rounded-lg border border-border/60 bg-card/30 p-4 transition-colors hover:border-border hover:bg-card/80 sm:flex-row sm:items-center"
            >
              {/* 名称 + 供应商 */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{m.name}</span>
                  {m.free && <Badge variant="secondary" className="text-[10px]">Free</Badge>}
                  {m.type && m.type !== 'chat' && (
                    <Badge variant="outline" className="text-[10px]">
                      {m.type === 'embedding' ? 'Embedding' : m.type === 'image' ? 'Image' : 'TTS'}
                    </Badge>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{m.provider}</span>
                  <span>·</span>
                  <span className="font-mono">{m.id}</span>
                </div>
              </div>

              {/* 价格 */}
              <div className="flex items-center gap-6 text-sm sm:gap-8">
                <div className="min-w-[100px]">
                  <p className="text-[10px] text-muted-foreground">{t.models_col_price}</p>
                  <p className={`font-mono ${m.free ? 'text-green-500' : ''}`}>
                    {m.free ? 'Free'
                      : m.type === 'image' ? `$${m.inputPrice}/img`
                      : m.type === 'tts' ? `$${m.inputPrice}/1M chars`
                      : m.type === 'embedding' ? `$${m.inputPrice}/1M tok`
                      : `$${m.inputPrice} / $${m.outputPrice}`}
                  </p>
                </div>

                {/* 上下文 */}
                <div className="min-w-[60px]">
                  <p className="text-[10px] text-muted-foreground">{t.models_col_context}</p>
                  <p className="font-mono">{fmtCtx(m.contextLength)}</p>
                </div>

                {/* 速度 */}
                <div className="min-w-[60px]">
                  <p className="text-[10px] text-muted-foreground">{t.models_col_speed}</p>
                  <SpeedStars speed={m.speed} />
                </div>

                {/* 立即使用 */}
                <Link href={`/playground?model=${m.id}`}>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Play className="h-3 w-3" />
                    {t.models_try}
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">{t.models_empty}</p>
          )}
        </div>
      </div>
    </div>
  );
}
