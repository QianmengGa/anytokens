'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Users, DollarSign, Plus, Copy, Check, Key } from 'lucide-react';

function getErr(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) return (err as any).response?.data?.message || 'Error';
  return err instanceof Error ? err.message : 'Error';
}

interface ResellerStats { subAccountCount: number; totalSubBalance: string; monthCost: string; monthCalls: number; }
interface SubAccount { id: string; name: string; email: string | null; balance: string; priceMarkup: number; keyCount: number; }

export default function ResellerPage() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const qc = useQueryClient();
  const role = (session?.user as any)?.role;
  const isReseller = role === 'RESELLER' || role === 'ADMIN';

  // 申请状态
  const { data: application } = useQuery<any>({
    queryKey: ['reseller-application'],
    queryFn: async () => { const r = await api.get('/reseller/application'); return r.data.data; },
    enabled: !isReseller,
  });

  // Reseller 统计
  const { data: stats } = useQuery<ResellerStats>({
    queryKey: ['reseller-stats'],
    queryFn: async () => { const r = await api.get('/reseller/stats'); return r.data.data; },
    enabled: isReseller,
  });

  // 子账户列表
  const { data: subAccounts } = useQuery<SubAccount[]>({
    queryKey: ['reseller-subs'],
    queryFn: async () => { const r = await api.get('/reseller/sub-accounts'); return r.data.data; },
    enabled: isReseller,
  });

  // 申请表单状态
  const [companyName, setCompanyName] = useState('');
  const [monthlyUsage, setMonthlyUsage] = useState('');
  const [description, setDescription] = useState('');
  const [applying, setApplying] = useState(false);

  // 创建子账户
  const [subName, setSubName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState('');

  const handleApply = async () => {
    setApplying(true); setMsg('');
    try {
      await api.post('/reseller/apply', { companyName, monthlyUsage, description });
      setMsg(t.reseller_applied);
      qc.invalidateQueries({ queryKey: ['reseller-application'] });
    } catch (e) { setMsg(getErr(e)); }
    finally { setApplying(false); }
  };

  const handleCreateSub = async () => {
    if (!subName.trim()) return;
    setMsg('');
    try {
      const r = await api.post('/reseller/sub-accounts', { name: subName });
      setNewKey(r.data.data.key);
      setSubName('');
      qc.invalidateQueries({ queryKey: ['reseller-subs'] });
    } catch (e) { setMsg(getErr(e)); }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 非 Reseller：显示申请表单
  if (!isReseller) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">{t.reseller_title}</h1>

        {application?.status === 'PENDING' && (
          <Card>
            <CardContent className="py-8 text-center">
              <Badge className="mb-2">PENDING</Badge>
              <p className="text-muted-foreground">{t.reseller_pending}</p>
            </CardContent>
          </Card>
        )}

        {application?.status === 'REJECTED' && (
          <Card>
            <CardContent className="py-8 text-center">
              <Badge variant="destructive" className="mb-2">REJECTED</Badge>
              <p className="text-muted-foreground">{application.reviewNote || t.reseller_rejected}</p>
            </CardContent>
          </Card>
        )}

        {(!application || application.status === 'REJECTED') && (
          <Card>
            <CardHeader>
              <CardTitle>{t.reseller_apply}</CardTitle>
              <CardDescription>{t.reseller_apply_desc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.reseller_company}</label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Inc." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.reseller_monthly}</label>
                <Input value={monthlyUsage} onChange={(e) => setMonthlyUsage(e.target.value)} placeholder="$500-1000" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.reseller_desc}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={t.reseller_desc_placeholder}
                />
              </div>
              {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
              <Button onClick={handleApply} disabled={applying || !companyName || !monthlyUsage || description.length < 10}>
                {t.reseller_submit}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Reseller Dashboard
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">{t.reseller_dashboard}</h1>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.reseller_sub_count}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.subAccountCount}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.reseller_sub_balance}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">${Number(stats.totalSubBalance).toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.reseller_month_cost}</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">${Number(stats.monthCost).toFixed(4)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.reseller_month_calls}</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.monthCalls}</div></CardContent>
          </Card>
        </div>
      )}

      {/* 创建子账户 */}
      <Card>
        <CardHeader><CardTitle>{t.reseller_sub_accounts}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={subName} onChange={(e) => setSubName(e.target.value)} placeholder={t.reseller_sub_name} className="max-w-xs" />
            <Button onClick={handleCreateSub} disabled={!subName.trim()}>
              <Plus className="mr-1 h-4 w-4" />{t.reseller_create_sub}
            </Button>
          </div>

          {newKey && (
            <div className="flex items-center gap-2 rounded-md border border-green-500/40 bg-green-500/10 p-3">
              <code className="flex-1 truncate text-xs">{newKey}</code>
              <Button size="sm" variant="ghost" onClick={() => handleCopy(newKey)}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {subAccounts?.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.reseller_markup}: {s.priceMarkup}x · {s.keyCount} Keys
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">${Number(s.balance).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
    </div>
  );
}
