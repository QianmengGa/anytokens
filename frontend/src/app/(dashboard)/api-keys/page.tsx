'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Copy, Check, Trash2, Key, Eye, AlertCircle, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// API Key 数据类型
interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  rateLimit: number;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

// 用量数据类型
interface ModelBreakdown {
  model: string;
  calls: number;
  tokens: number;
  cost: string;
}

interface KeyUsage {
  keyId: string;
  keyName: string;
  total: {
    calls: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: string;
  };
  today: {
    calls: number;
    totalTokens: number;
    cost: string;
  };
  modelBreakdown: ModelBreakdown[];
}

// 提取 axios 错误信息
function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as any).response;
    return res?.data?.message || `Error ${res?.status}`;
  }
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

// API 密钥管理页
export default function ApiKeysPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  // 弹窗状态
  const [showCreate, setShowCreate] = useState(false);
  const [showCreated, setShowCreated] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUsage, setShowUsage] = useState(false);

  // 表单状态
  const [keyName, setKeyName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiKey | null>(null);
  const [usageTarget, setUsageTarget] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 获取 Key 列表
  const { data: keys = [], isLoading, error: listError } = useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await api.get('/keys');
      return res.data.data;
    },
  });

  // 创建 Key
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post('/keys', { name });
      return res.data.data;
    },
    onSuccess: (data) => {
      setNewKey(data.key);
      setShowCreate(false);
      setShowCreated(true);
      setKeyName('');
      setErrorMsg('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err) => {
      setErrorMsg(getErrorMessage(err));
    },
  });

  // 删除 Key
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/keys/${id}`);
    },
    onSuccess: () => {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      setErrorMsg('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err) => {
      setShowDeleteConfirm(false);
      setErrorMsg(getErrorMessage(err));
    },
  });

  // 获取用量
  const { data: usageData, isLoading: usageLoading } = useQuery<KeyUsage>({
    queryKey: ['key-usage', usageTarget],
    queryFn: async () => {
      const res = await api.get(`/keys/${usageTarget}/usage`);
      return res.data.data;
    },
    enabled: !!usageTarget && showUsage,
  });

  // 复制到剪贴板
  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // 格式化日期
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 遮蔽 Key 显示
  const maskKey = (prefix: string) => {
    return prefix + '****************************';
  };

  return (
    <div className="space-y-6">
      {/* 错误提示 */}
      {(errorMsg || listError) && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{errorMsg || getErrorMessage(listError)}</span>
          {errorMsg && (
            <button onClick={() => setErrorMsg('')}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* 页头 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.keys_title}</h1>
        <Button onClick={() => { createMutation.reset(); setShowCreate(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          {t.keys_create}
        </Button>
      </div>

      {/* Key 列表 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.keys_my_keys}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">{t.loading}</p>
          ) : keys.length === 0 ? (
            <p className="text-muted-foreground">{t.keys_empty}</p>
          ) : (
            <div className="space-y-4">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* 左侧信息 */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{key.name}</span>
                    </div>
                    <div className="font-mono text-sm text-muted-foreground">
                      {maskKey(key.keyPrefix)}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>
                        {t.keys_created_at}: {formatDate(key.createdAt)}
                      </span>
                      <span>
                        {t.keys_last_used}:{' '}
                        {key.lastUsedAt ? formatDate(key.lastUsedAt) : t.keys_never_used}
                      </span>
                    </div>
                  </div>

                  {/* 右侧操作 */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUsageTarget(key.id);
                        setShowUsage(true);
                      }}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      {t.keys_usage}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setDeleteTarget(key);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      {t.keys_delete}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建 Key 弹窗 */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.keys_create_title}</DialogTitle>
            <DialogDescription>{t.keys_create_desc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="key-name">{t.keys_name_label}</Label>
              <Input
                id="key-name"
                placeholder={t.keys_name_placeholder}
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !createMutation.isPending) {
                    createMutation.mutate(keyName || 'Default Key');
                  }
                }}
              />
            </div>
            {createMutation.isError && (
              <p className="text-sm text-destructive">
                {getErrorMessage(createMutation.error)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              {t.keys_cancel}
            </Button>
            <Button
              onClick={() => createMutation.mutate(keyName || 'Default Key')}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? t.keys_creating : t.keys_confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Key 创建成功弹窗（显示完整 Key） */}
      <Dialog
        open={showCreated}
        onOpenChange={(open) => {
          if (!open) {
            setNewKey('');
          }
          setShowCreated(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.keys_created_title}</DialogTitle>
            <DialogDescription>{t.keys_created_desc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border bg-muted p-3 text-sm break-all">
                {newKey}
              </code>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => handleCopy(newKey)}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Badge variant="destructive" className="text-xs">
              {t.keys_created_desc}
            </Badge>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                handleCopy(newKey);
              }}
              variant="outline"
            >
              <Copy className="mr-2 h-4 w-4" />
              {copied ? t.keys_copied : t.keys_copy}
            </Button>
            <Button
              onClick={() => {
                setShowCreated(false);
                setNewKey('');
              }}
            >
              {t.keys_close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.keys_delete_title}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  <span className="font-medium">{deleteTarget.name}</span>
                  {' — '}
                </>
              )}
              {t.keys_delete_desc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.keys_cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget.id);
                }
              }}
            >
              {t.keys_delete_confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 用量查看弹窗 */}
      <Dialog
        open={showUsage}
        onOpenChange={(open) => {
          if (!open) setUsageTarget(null);
          setShowUsage(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t.keys_usage} — {usageData?.keyName || ''}
            </DialogTitle>
          </DialogHeader>
          {usageLoading ? (
            <p className="py-4 text-center text-muted-foreground">{t.loading}</p>
          ) : usageData ? (
            <div className="space-y-5 py-2">
              {/* 总览 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-bold">{usageData.total.calls}</div>
                  <div className="text-xs text-muted-foreground">{t.keys_calls}</div>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-bold">
                    {usageData.total.totalTokens.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">{t.keys_tokens}</div>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-bold">
                    ${Number(usageData.total.cost).toFixed(4)}
                  </div>
                  <div className="text-xs text-muted-foreground">{t.keys_cost}</div>
                </div>
              </div>

              {/* 模型明细 */}
              <div>
                <h4 className="mb-3 text-sm font-medium">{t.keys_model_breakdown}</h4>
                {usageData.modelBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.keys_no_usage}</p>
                ) : (
                  <div className="rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium">{t.keys_model}</th>
                          <th className="px-3 py-2 text-right font-medium">{t.keys_calls}</th>
                          <th className="px-3 py-2 text-right font-medium">{t.keys_tokens}</th>
                          <th className="px-3 py-2 text-right font-medium">{t.keys_cost}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usageData.modelBreakdown.map((row) => (
                          <tr key={row.model} className="border-b last:border-b-0">
                            <td className="px-3 py-2 font-mono text-xs">{row.model}</td>
                            <td className="px-3 py-2 text-right">{row.calls}</td>
                            <td className="px-3 py-2 text-right">{row.tokens.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right">${Number(row.cost).toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={() => setShowUsage(false)}>{t.keys_close}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
