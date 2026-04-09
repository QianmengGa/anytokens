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
import {
  Plus, Copy, Check, Trash2, Bell, Pencil, ChevronDown, ChevronUp,
  AlertCircle, X, CheckCircle2, XCircle,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 事件类型选项
const EVENT_OPTIONS = [
  { value: 'balance.topup', label: 'balance.topup', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  { value: 'balance.low', label: 'balance.low', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' },
  { value: 'balance.depleted', label: 'balance.depleted', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
  { value: 'key.limit_reached', label: 'key.limit_reached', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' },
] as const;

interface Webhook {
  id: string;
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Delivery {
  id: string;
  event: string;
  statusCode: number | null;
  success: boolean;
  attempts: number;
  createdAt: string;
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as any).response;
    return res?.data?.message || `Error ${res?.status}`;
  }
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

export default function WebhooksPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [newSecret, setNewSecret] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 表单状态
  const [formUrl, setFormUrl] = useState('');
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [formDesc, setFormDesc] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [editTarget, setEditTarget] = useState<Webhook | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Webhook | null>(null);

  // 获取列表
  const { data: webhooks = [], isLoading } = useQuery<Webhook[]>({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const res = await api.get('/webhooks');
      return res.data.data;
    },
  });

  // 创建
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/webhooks', {
        url: formUrl,
        events: formEvents,
        description: formDesc || undefined,
      });
      return res.data.data as Webhook;
    },
    onSuccess: (data) => {
      setShowCreate(false);
      setNewSecret(data.secret || '');
      setShowSecret(true);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  });

  // 更新
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editTarget) return;
      await api.put(`/webhooks/${editTarget.id}`, {
        url: formUrl,
        events: formEvents,
        description: formDesc || null,
        isActive: formActive,
      });
    },
    onSuccess: () => {
      setShowEdit(false);
      setEditTarget(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  });

  // 删除
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/webhooks/${id}`);
    },
    onSuccess: () => {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  });

  const resetForm = () => {
    setFormUrl('');
    setFormEvents([]);
    setFormDesc('');
    setFormActive(true);
    setErrorMsg('');
  };

  const openEdit = (wh: Webhook) => {
    setEditTarget(wh);
    setFormUrl(wh.url);
    setFormEvents([...wh.events]);
    setFormDesc(wh.description || '');
    setFormActive(wh.isActive);
    setErrorMsg('');
    setShowEdit(true);
  };

  const toggleEvent = (value: string) => {
    setFormEvents((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value],
    );
  };

  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div className="space-y-6">
      {/* 错误提示 */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg('')}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* 页头 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.webhook_title}</h1>
        <Button onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          {t.webhook_add}
        </Button>
      </div>

      {/* 列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t.webhook_title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">{t.loading}</p>
          ) : webhooks.length === 0 ? (
            <p className="text-muted-foreground">{t.webhook_empty}</p>
          ) : (
            <div className="space-y-4">
              {webhooks.map((wh) => (
                <WebhookCard
                  key={wh.id}
                  wh={wh}
                  expanded={expandedId === wh.id}
                  onToggle={() => setExpandedId(expandedId === wh.id ? null : wh.id)}
                  onEdit={() => openEdit(wh)}
                  onDelete={() => { setDeleteTarget(wh); setShowDeleteConfirm(true); }}
                  t={t}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建 Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.webhook_add}</DialogTitle>
          </DialogHeader>
          <WebhookForm
            url={formUrl} onUrlChange={setFormUrl}
            events={formEvents} onToggleEvent={toggleEvent}
            desc={formDesc} onDescChange={setFormDesc}
            error={createMutation.isError ? getErrorMessage(createMutation.error) : ''}
            t={t}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t.keys_cancel}</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !formUrl || formEvents.length === 0}
            >
              {createMutation.isPending ? t.loading : t.webhook_save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret 展示 Dialog */}
      <Dialog open={showSecret} onOpenChange={(open) => { if (!open) setNewSecret(''); setShowSecret(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.webhook_secret}</DialogTitle>
            <DialogDescription>{t.webhook_secret_hint}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md border bg-muted p-3 text-sm break-all">{newSecret}</code>
            <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleCopy(newSecret)}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Badge variant="destructive" className="text-xs">{t.webhook_secret_hint}</Badge>
          <DialogFooter>
            <Button onClick={() => { setShowSecret(false); setNewSecret(''); }}>{t.keys_close}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑 Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
          </DialogHeader>
          <WebhookForm
            url={formUrl} onUrlChange={setFormUrl}
            events={formEvents} onToggleEvent={toggleEvent}
            desc={formDesc} onDescChange={setFormDesc}
            error={updateMutation.isError ? getErrorMessage(updateMutation.error) : ''}
            t={t}
          />
          <div className="flex items-center gap-2">
            <Label className="text-sm">{t.webhook_active}</Label>
            <button
              onClick={() => setFormActive(!formActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formActive ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${formActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>{t.keys_cancel}</Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || !formUrl || formEvents.length === 0}
            >
              {updateMutation.isPending ? t.loading : t.webhook_save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.webhook_delete}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.url}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.keys_cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {t.webhook_delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ====== 表单子组件 ======
function WebhookForm({ url, onUrlChange, events, onToggleEvent, desc, onDescChange, error, t }: {
  url: string; onUrlChange: (v: string) => void;
  events: string[]; onToggleEvent: (v: string) => void;
  desc: string; onDescChange: (v: string) => void;
  error: string;
  t: any;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>{t.webhook_url}</Label>
        <Input placeholder="https://example.com/webhook" value={url} onChange={(e) => onUrlChange(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>{t.webhook_events}</Label>
        <div className="flex flex-wrap gap-2">
          {EVENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggleEvent(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                events.includes(opt.value)
                  ? opt.color + ' ring-2 ring-primary/50'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t.webhook_desc}</Label>
        <Input placeholder="Optional" value={desc} onChange={(e) => onDescChange(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// ====== 单条 Webhook 卡片 ======
function WebhookCard({ wh, expanded, onToggle, onEdit, onDelete, t }: {
  wh: Webhook; expanded: boolean;
  onToggle: () => void; onEdit: () => void; onDelete: () => void;
  t: any;
}) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* 左侧信息 */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm truncate max-w-[300px]">{wh.url}</span>
            <Badge variant={wh.isActive ? 'default' : 'secondary'} className="text-[10px]">
              {wh.isActive ? t.webhook_active : t.webhook_inactive}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {wh.events.map((e) => {
              const opt = EVENT_OPTIONS.find((o) => o.value === e);
              return (
                <span key={e} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${opt?.color || 'bg-muted text-muted-foreground'}`}>
                  {e}
                </span>
              );
            })}
          </div>
          {wh.description && (
            <p className="text-xs text-muted-foreground">{wh.description}</p>
          )}
        </div>

        {/* 右侧操作 */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onToggle}>
            {expanded ? <ChevronUp className="mr-1 h-3.5 w-3.5" /> : <ChevronDown className="mr-1 h-3.5 w-3.5" />}
            {t.webhook_deliveries}
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 投递记录 */}
      {expanded && <DeliveryLog webhookId={wh.id} t={t} />}
    </div>
  );
}

// ====== 投递记录 ======
function DeliveryLog({ webhookId, t }: { webhookId: string; t: any }) {
  const { data: deliveries = [], isLoading } = useQuery<Delivery[]>({
    queryKey: ['webhook-deliveries', webhookId],
    queryFn: async () => {
      const res = await api.get(`/webhooks/${webhookId}/deliveries`);
      return res.data.data;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">{t.loading}</p>;
  if (deliveries.length === 0) return <p className="text-sm text-muted-foreground">{t.webhook_no_deliveries}</p>;

  return (
    <div className="rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-medium">Time</th>
            <th className="px-3 py-2 text-left font-medium">Event</th>
            <th className="px-3 py-2 text-center font-medium">Status</th>
            <th className="px-3 py-2 text-center font-medium">Result</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((d) => (
            <tr key={d.id} className="border-b last:border-b-0">
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {new Date(d.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </td>
              <td className="px-3 py-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">{d.event}</span>
              </td>
              <td className="px-3 py-2 text-center font-mono text-xs">
                {d.statusCode ?? '—'}
              </td>
              <td className="px-3 py-2 text-center">
                {d.success
                  ? <CheckCircle2 className="mx-auto h-4 w-4 text-green-500" />
                  : <XCircle className="mx-auto h-4 w-4 text-red-500" />
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
