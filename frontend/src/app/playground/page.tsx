'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Send, Trash2, ChevronDown, ChevronRight, Wallet, Bot, User, Key, Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { PublicNavbar } from '@/components/layout/PublicNavbar';

// 支持的模型列表
const MODELS = [
  // 免费模型
  { id: 'deepseek-v3', label: 'DeepSeek V3', free: true },
  { id: 'qwen3-32b', label: 'Qwen3 32B', free: true },
  { id: 'qwen2.5-7b', label: 'Qwen2.5 7B', free: true },
  { id: 'qwen3-8b', label: 'Qwen3 8B', free: true },
  { id: 'llama-3.3-70b', label: 'Llama 3.3 70B', free: true },
  { id: 'glm-4-9b', label: 'GLM-4 9B', free: true },
  { id: 'glm-4.5-air', label: 'GLM-4.5 Air', free: true },
  { id: 'deepseek-r1-7b', label: 'DeepSeek R1 7B', free: true },
  { id: 'mistral-7b', label: 'Mistral 7B', free: true },
  // 付费模型
  { id: 'deepseek-r1', label: 'DeepSeek R1', free: false },
  { id: 'grok-3', label: 'Grok 3', free: false },
  { id: 'grok-3-mini', label: 'Grok 3 Mini', free: false },
  { id: 'mistral-large', label: 'Mistral Large', free: false },
  { id: 'phi-4', label: 'Phi-4', free: false },
  { id: 'qwen2.5-72b', label: 'Qwen2.5 72B', free: false },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', free: false },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', free: false },
  { id: 'llama3-70b', label: 'Llama3 70B (Groq)', free: false },
  { id: 'mixtral-8x7b', label: 'Mixtral 8x7B (Groq)', free: false },
];

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
}

export default function PlaygroundPage() {
  const { t } = useI18n();
  const { data: session } = useSession();

  // 设置
  const [model, setModel] = useState('qwen2.5-7b');
  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSystem, setShowSystem] = useState(false);

  // 对话
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 获取用户 API Key 列表
  const { data: apiKeys = [] } = useQuery<ApiKeyItem[]>({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await api.get('/keys');
      return res.data.data;
    },
    enabled: !!session,
  });

  // 自动选中第一个 Key
  useEffect(() => {
    if (apiKeys.length > 0 && !selectedKeyId) {
      setSelectedKeyId(apiKeys[0].id);
    }
  }, [apiKeys, selectedKeyId]);

  // 获取余额
  const { data: userInfo, refetch: refetchBalance } = useQuery<{ balance: string }>({
    queryKey: ['user-me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.data;
    },
    enabled: !!session,
  });

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 发送消息（流式 SSE）
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming || !selectedKeyId) return;

    const token = (session?.user as any)?.accessToken;
    if (!token) return;

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    const reqMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...newMessages.map(m => ({ role: m.role, content: m.content }))]
      : newMessages.map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      // 使用 Playground 专用端点（JWT 认证，非 API Key）
      const res = await fetch(`${apiUrl}/playground/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          model,
          messages: reqMessages,
          stream: true,
          temperature,
          max_tokens: maxTokens,
          _keyId: selectedKeyId,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `Error ${res.status}` }));
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: `Error: ${err.message || res.statusText}`,
          };
          return updated;
        });
        setIsStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let totalTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;

          try {
            const chunk = JSON.parse(payload);
            const delta = chunk.choices?.[0]?.delta;
            if (delta?.content) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + delta.content,
                };
                return updated;
              });
            }
            if (chunk.usage) {
              totalTokens = chunk.usage.total_tokens || 0;
            }
          } catch {
            // 忽略
          }
        }
      }

      if (totalTokens > 0) {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = { ...last, tokens: totalTokens };
          return updated;
        });
      }

      refetchBalance();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: `Error: ${err.message}`,
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleClear = () => {
    if (isStreaming && abortRef.current) abortRef.current.abort();
    setMessages([]);
    setIsStreaming(false);
  };

  // 未登录提示
  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">{t.pg_login_hint}</p>
            <Link href="/login">
              <Button className="mt-4">{t.nav_login}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasKey = apiKeys.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      {/* Playground 主体 */}
      <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
        {/* 左侧设置面板 */}
        <div className="w-72 shrink-0 space-y-5 overflow-y-auto rounded-lg border bg-card p-4">
          <h2 className="text-lg font-semibold">{t.pg_settings}</h2>

          {/* 余额 + 充值 */}
          {userInfo && (
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{t.pg_balance}:</span>
              <span className="flex-1 font-mono font-medium">${Number(userInfo.balance).toFixed(4)}</span>
              <Link href="/billing">
                <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs">
                  <Plus className="h-3 w-3" />
                  {t.billing_recharge}
                </Button>
              </Link>
            </div>
          )}

          {/* API Key 选择 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Key className="h-3.5 w-3.5" />
              API Key
            </Label>
            {hasKey ? (
              <Select value={selectedKeyId} onValueChange={setSelectedKeyId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {apiKeys.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.name} ({k.keyPrefix}****)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Link href="/api-keys">
                <Button variant="outline" size="sm" className="w-full">
                  {t.pg_no_key}
                </Button>
              </Link>
            )}
          </div>

          {/* 模型选择 */}
          <div className="space-y-2">
            <Label>{t.pg_model}</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-2">
                      {m.label}
                      {m.free && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {t.pg_free}
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t.pg_temperature}</Label>
              <span className="text-sm text-muted-foreground">{temperature.toFixed(1)}</span>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={([v]) => setTemperature(v)}
              min={0}
              max={2}
              step={0.1}
            />
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <Label>{t.pg_max_tokens}</Label>
            <Input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Math.max(1, Math.min(16384, Number(e.target.value) || 1)))}
              min={1}
              max={16384}
            />
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <button
              className="flex w-full items-center gap-1 text-sm font-medium"
              onClick={() => setShowSystem(!showSystem)}
            >
              {showSystem ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {t.pg_system_prompt}
            </button>
            {showSystem && (
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder={t.pg_system_placeholder}
                rows={4}
                className="resize-none text-sm"
              />
            )}
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleClear}
            disabled={messages.length === 0 && !isStreaming}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t.pg_clear}
          </Button>
        </div>

        {/* 右侧对话区域 */}
        <div className="flex flex-1 flex-col rounded-lg border bg-card">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {!hasKey ? (
              <div className="flex h-full items-center justify-center">
                <Link href="/api-keys" className="text-primary hover:underline">{t.pg_no_key}</Link>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">{t.pg_empty}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[75%] space-y-1 ${msg.role === 'user' ? 'order-first' : ''}`}>
                      <Card className={`px-4 py-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="whitespace-pre-wrap text-sm">
                          {msg.content || (isStreaming && i === messages.length - 1 ? '▍' : '')}
                        </p>
                      </Card>
                      {msg.role === 'assistant' && msg.tokens && (
                        <p className="px-1 text-xs text-muted-foreground">
                          {msg.tokens} {t.pg_tokens_used}
                        </p>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/10">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.pg_input_placeholder}
                rows={1}
                className="min-h-[42px] max-h-[120px] resize-none"
                disabled={!hasKey || isStreaming}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                onClick={handleSend}
                disabled={!hasKey || !input.trim() || isStreaming}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
