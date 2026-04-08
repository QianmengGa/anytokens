'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import {
  Users, BarChart3, Settings, Activity, CreditCard, Server, User,
  Search, ChevronLeft, ChevronRight, DollarSign, Plus, Minus,
  Ban, UserCheck, RefreshCw, AlertTriangle, TrendingUp, CheckCircle, XCircle,
} from 'lucide-react';

// ==================== 类型定义 ====================

interface AdminUser {
  id: string; email: string; name: string | null; role: string;
  balance: string; isActive: boolean; registerIp: string | null;
  lastLoginIp: string | null; lastLoginAt: string | null;
  createdAt: string; totalCalls: number; totalSpending: string;
}
interface UsageLog {
  id: string; userEmail: string; userName: string | null;
  model: string; promptTokens: number; completionTokens: number;
  totalTokens: number; cost: string; latencyMs: number | null;
  status: string; clientIp: string | null; createdAt: string;
}
interface Transaction {
  id: string; userEmail: string; userName: string | null;
  type: string; amount: string; balanceBefore: string;
  balanceAfter: string; status: string; paymentMethod: string | null;
  description: string | null; createdAt: string;
}
interface Stats {
  totalUsers: number; todayNewUsers: number; todayCalls: number;
  todayTokens: number; todayRevenue: string; monthRevenue: string; totalRevenue: string;
}
interface DailyStat { date: string; newUsers: number; revenue: string; calls: number; }
interface TokenRank { userId: string; email: string; name: string | null; totalTokens: number; totalCost: string; calls: number; }
interface Provider { name: string; keyPrefix: string; balance: string; lowBalance: boolean; lastChecked: string | null; status: string; }
interface PaginatedData<T> { items: T[]; total: number; page: number; pageSize: number; totalPages: number; }
interface ModelUsage { model: string; calls: number; promptTokens: number; completionTokens: number; totalTokens: number; cost: string; }
interface MyUsageData { period: string; totalCalls: number; totalTokens: number; totalCost: string; models: ModelUsage[]; }

// ==================== Toast 通知 ====================

interface ToastItem { id: number; message: string; type: 'success' | 'error'; }
let toastIdCounter = 0;

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const show = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed right-4 top-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg transition-all ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {t.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ==================== Tab 定义 ====================

type TabKey = 'stats' | 'users' | 'usage' | 'transactions' | 'myUsage' | 'settings' | 'providers';

const tabDefs: { key: TabKey; icon: typeof Users }[] = [
  { key: 'stats', icon: BarChart3 },
  { key: 'users', icon: Users },
  { key: 'usage', icon: Activity },
  { key: 'transactions', icon: CreditCard },
  { key: 'myUsage', icon: User },
  { key: 'settings', icon: Settings },
  { key: 'providers', icon: Server },
];

// ==================== 主页面 ====================

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('stats');
  const toast = useToast();

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [status, session, router]);

  if (status === 'loading') return null;
  if ((session?.user as any)?.role !== 'ADMIN') return null;

  const tabLabels: Record<TabKey, string> = {
    stats: t.admin_stats,
    users: t.admin_users,
    usage: t.admin_usage,
    transactions: t.admin_transactions,
    myUsage: t.admin_my_usage || '我的消耗',
    settings: t.admin_settings,
    providers: t.admin_providers,
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toast.toasts} />
      <h1 className="text-2xl font-bold">{t.admin_title}</h1>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {tabDefs.map(({ key, icon: Icon }) => (
          <Button key={key} variant={activeTab === key ? 'default' : 'ghost'} size="sm"
            onClick={() => setActiveTab(key)} className="gap-2">
            <Icon className="h-4 w-4" /> {tabLabels[key]}
          </Button>
        ))}
      </div>

      {activeTab === 'stats' && <StatsTab />}
      {activeTab === 'users' && <UsersTab toast={toast} />}
      {activeTab === 'usage' && <UsageTab />}
      {activeTab === 'transactions' && <TransactionsTab />}
      {activeTab === 'myUsage' && <MyUsageTab />}
      {activeTab === 'settings' && <SettingsTab toast={toast} />}
      {activeTab === 'providers' && <ProvidersTab />}
    </div>
  );
}

// ==================== 分页 ====================

function Pagination({ page, totalPages, onPageChange }: {
  page: number; totalPages: number; onPageChange: (p: number) => void;
}) {
  const { t } = useI18n();
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        {t.admin_page_info.replace('{page}', String(page)).replace('{total}', String(totalPages))}
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> {t.admin_prev}
        </Button>
        <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          {t.admin_next} <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ==================== 统计仪表盘 ====================

function StatsTab() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [daily, setDaily] = useState<DailyStat[]>([]);
  const [ranking, setRanking] = useState<TokenRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, d, r] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/stats/daily'),
          api.get('/admin/stats/token-ranking'),
        ]);
        setStats(s.data.data);
        setDaily(d.data.data);
        setRanking(r.data.data);
      } catch { /* 忽略 */ }
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-muted-foreground">{t.loading}</p>;
  if (!stats) return null;

  const statCards = [
    { label: t.admin_total_users, value: stats.totalUsers, icon: Users },
    { label: t.admin_today_new, value: stats.todayNewUsers, icon: Users },
    { label: t.admin_today_calls, value: stats.todayCalls, icon: Activity },
    { label: t.admin_today_tokens, value: stats.todayTokens.toLocaleString(), icon: Activity },
    { label: t.admin_today_revenue, value: `$${parseFloat(stats.todayRevenue).toFixed(4)}`, icon: DollarSign },
    { label: t.admin_month_revenue, value: `$${parseFloat(stats.monthRevenue).toFixed(4)}`, icon: DollarSign },
    { label: t.admin_total_revenue, value: `$${parseFloat(stats.totalRevenue).toFixed(4)}`, icon: TrendingUp },
  ];

  const maxCalls = Math.max(...daily.map((d) => d.calls), 1);
  const maxRevenue = Math.max(...daily.map((d) => parseFloat(d.revenue)), 0.0001);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>{t.admin_daily_trend}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {daily.map((d) => (
              <div key={d.date} className="space-y-2 text-center">
                <div className="flex h-24 items-end justify-center gap-1">
                  <div className="w-3 rounded-t bg-primary/70" style={{ height: `${(d.calls / maxCalls) * 100}%`, minHeight: d.calls > 0 ? '4px' : '0px' }} title={`${t.admin_calls}: ${d.calls}`} />
                  <div className="w-3 rounded-t bg-green-500/70" style={{ height: `${(parseFloat(d.revenue) / maxRevenue) * 100}%`, minHeight: parseFloat(d.revenue) > 0 ? '4px' : '0px' }} title={`${t.admin_revenue}: $${parseFloat(d.revenue).toFixed(4)}`} />
                </div>
                <p className="text-xs text-muted-foreground">{d.date.slice(5)}</p>
                <p className="text-xs">{d.newUsers} {t.admin_new_users}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-primary/70" /> {t.admin_calls}</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-green-500/70" /> {t.admin_revenue}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t.admin_token_ranking}</CardTitle></CardHeader>
        <CardContent>
          {ranking.length === 0 ? <p className="text-muted-foreground">{t.admin_no_logs}</p> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">#</th><th className="pb-2 pr-4">{t.admin_email}</th>
                <th className="pb-2 pr-4">{t.admin_tokens}</th><th className="pb-2 pr-4">{t.admin_cost}</th>
                <th className="pb-2">{t.admin_calls}</th>
              </tr></thead>
              <tbody>{ranking.map((r, i) => (
                <tr key={r.userId} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{i + 1}</td><td className="py-2 pr-4">{r.email}</td>
                  <td className="py-2 pr-4">{r.totalTokens.toLocaleString()}</td>
                  <td className="py-2 pr-4">${parseFloat(r.totalCost).toFixed(4)}</td><td className="py-2">{r.calls}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== 用户管理 ====================

function UsersTab({ toast }: { toast: ReturnType<typeof useToast> }) {
  const { t } = useI18n();
  const [data, setData] = useState<PaginatedData<AdminUser> | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [loading, setLoading] = useState(false);
  const [balanceUserId, setBalanceUserId] = useState<string | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceDesc, setBalanceDesc] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (p: number, s: string, sort: string) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: { page: p, pageSize: 15, search: s || undefined, sortBy: sort, sortOrder: 'desc' },
      });
      setData(res.data.data);
    } catch { /* 忽略 */ }
    setLoading(false);
  }, []);

  // 自动加载
  useEffect(() => { fetchUsers(1, '', sortBy); }, [fetchUsers, sortBy]);

  // 实时搜索（300ms 防抖）
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchUsers(1, value, sortBy);
    }, 300);
  };

  const handlePageChange = (p: number) => { setPage(p); fetchUsers(p, search, sortBy); };

  const handleToggleBan = async (userId: string, newActive: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/ban`, { isActive: newActive });
      toast.show(newActive ? t.admin_unfreeze + '成功' : t.admin_freeze + '成功', 'success');
      fetchUsers(page, search, sortBy);
    } catch { toast.show('操作失败', 'error'); }
  };

  const handleAdjustBalance = async () => {
    if (!balanceUserId || !balanceAmount) return;
    try {
      await api.patch(`/admin/users/${balanceUserId}/balance`, {
        amount: parseFloat(balanceAmount), description: balanceDesc,
      });
      setBalanceUserId(null); setBalanceAmount(''); setBalanceDesc('');
      toast.show('余额调整成功', 'success');
      fetchUsers(page, search, sortBy);
    } catch { toast.show('余额调整失败', 'error'); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t.admin_users}</CardTitle>
          {data && <Badge variant="secondary" className="text-sm">{t.admin_total_users}: {data.total}</Badge>}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Input placeholder={t.admin_search_user} value={search}
            onChange={(e) => handleSearchChange(e.target.value)} className="max-w-sm" />
          <div className="ml-auto flex gap-1">
            <Button size="sm" variant={sortBy === 'createdAt' ? 'default' : 'outline'} onClick={() => setSortBy('createdAt')}>{t.admin_sort_time}</Button>
            <Button size="sm" variant={sortBy === 'balance' ? 'default' : 'outline'} onClick={() => setSortBy('balance')}>{t.admin_sort_balance}</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && !data ? <p className="text-muted-foreground">{t.loading}</p> :
         !data || data.items.length === 0 ? <p className="text-muted-foreground">{t.admin_no_users}</p> : (
          <>
            {balanceUserId && (
              <div className="mb-4 rounded-lg border bg-muted/50 p-4">
                <p className="mb-2 font-medium">{t.admin_adjust_balance}</p>
                <div className="flex flex-wrap gap-2">
                  <Input type="number" step="0.01" placeholder={t.admin_amount}
                    value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} className="w-32" />
                  <Input placeholder={t.admin_description}
                    value={balanceDesc} onChange={(e) => setBalanceDesc(e.target.value)} className="w-48" />
                  <Button size="sm" onClick={handleAdjustBalance}>{t.admin_confirm}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setBalanceUserId(null)}>{t.admin_cancel}</Button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="whitespace-nowrap pb-2 pr-3">{t.admin_email}</th>
                  <th className="whitespace-nowrap pb-2 pr-3">{t.admin_username}</th>
                  <th className="whitespace-nowrap pb-2 pr-3">{t.admin_register_time}</th>
                  <th className="whitespace-nowrap pb-2 pr-3">{t.admin_register_ip}</th>
                  <th className="whitespace-nowrap pb-2 pr-3">{t.admin_last_login_ip}</th>
                  <th className="whitespace-nowrap pb-2 pr-3">{t.admin_last_login_time}</th>
                  <th className="whitespace-nowrap pb-2 pr-3">{t.admin_balance}</th>
                  <th className="whitespace-nowrap pb-2 pr-3">{t.admin_total_spending}</th>
                  <th className="whitespace-nowrap pb-2 pr-3">{t.admin_total_calls}</th>
                  <th className="whitespace-nowrap pb-2 pr-3">{t.admin_status}</th>
                  <th className="whitespace-nowrap pb-2">{t.admin_actions}</th>
                </tr></thead>
                <tbody>{data.items.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">{user.email}</td>
                    <td className="py-2 pr-3">{user.name || '-'}</td>
                    <td className="whitespace-nowrap py-2 pr-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{user.registerIp || '-'}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{user.lastLoginIp || '-'}</td>
                    <td className="whitespace-nowrap py-2 pr-3 text-xs">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-'}</td>
                    <td className="py-2 pr-3 font-medium">${parseFloat(user.balance).toFixed(2)}</td>
                    <td className="py-2 pr-3">${parseFloat(user.totalSpending).toFixed(4)}</td>
                    <td className="py-2 pr-3">{user.totalCalls}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={user.isActive ? 'default' : 'destructive'}>
                        {user.isActive ? t.admin_active : t.admin_banned}
                      </Badge>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2" title={t.admin_add_funds}
                          onClick={() => { setBalanceUserId(user.id); setBalanceAmount(''); }}>
                          <Plus className="h-3 w-3 text-green-500" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2" title={t.admin_deduct_funds}
                          onClick={() => { setBalanceUserId(user.id); setBalanceAmount('-'); }}>
                          <Minus className="h-3 w-3 text-orange-500" />
                        </Button>
                        {user.role !== 'ADMIN' && (
                          <Button size="sm" variant="ghost" className="h-7 px-2"
                            title={user.isActive ? t.admin_freeze : t.admin_unfreeze}
                            onClick={() => handleToggleBan(user.id, !user.isActive)}>
                            {user.isActive ? <Ban className="h-3 w-3 text-destructive" /> : <UserCheck className="h-3 w-3 text-green-500" />}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== 调用日志 ====================

function UsageTab() {
  const { t } = useI18n();
  const [data, setData] = useState<PaginatedData<UsageLog> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ userId: '', model: '', startDate: '', endDate: '' });

  const fetchLogs = useCallback(async (p: number, f: typeof filters) => {
    setLoading(true);
    try {
      const params: any = { page: p, pageSize: 20 };
      if (f.userId) params.userId = f.userId;
      if (f.model) params.model = f.model;
      if (f.startDate) params.startDate = f.startDate;
      if (f.endDate) params.endDate = f.endDate;
      const res = await api.get('/admin/usage', { params });
      setData(res.data.data);
    } catch { /* 忽略 */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(1, filters); }, [fetchLogs]); // eslint-disable-line
  const handleFilter = () => { setPage(1); fetchLogs(1, filters); };
  const handlePageChange = (p: number) => { setPage(p); fetchLogs(p, filters); };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.admin_usage}</CardTitle>
        <div className="flex flex-wrap gap-2 pt-2">
          <Input placeholder={t.admin_filter_user} value={filters.userId}
            onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))} className="w-48" />
          <Input placeholder={t.admin_filter_model} value={filters.model}
            onChange={(e) => setFilters((f) => ({ ...f, model: e.target.value }))} className="w-40" />
          <Input type="date" value={filters.startDate}
            onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))} className="w-40" />
          <Input type="date" value={filters.endDate}
            onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))} className="w-40" />
          <Button size="sm" variant="outline" onClick={handleFilter}>
            <Search className="mr-1 h-4 w-4" /> {t.admin_filter_search}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-muted-foreground">{t.loading}</p> :
         !data || data.items.length === 0 ? <p className="text-muted-foreground">{t.admin_no_logs}</p> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-3">{t.admin_email}</th><th className="pb-2 pr-3">{t.admin_model}</th>
                  <th className="pb-2 pr-3">{t.admin_tokens}</th><th className="pb-2 pr-3">{t.admin_cost}</th>
                  <th className="pb-2 pr-3">{t.admin_latency}</th><th className="pb-2 pr-3">{t.admin_status}</th>
                  <th className="pb-2 pr-3">{t.admin_client_ip}</th><th className="pb-2">{t.admin_time}</th>
                </tr></thead>
                <tbody>{data.items.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">{log.userEmail}</td><td className="py-2 pr-3">{log.model}</td>
                    <td className="py-2 pr-3">{log.totalTokens}</td><td className="py-2 pr-3">${parseFloat(log.cost).toFixed(6)}</td>
                    <td className="py-2 pr-3">{log.latencyMs ? `${log.latencyMs}ms` : '-'}</td>
                    <td className="py-2 pr-3"><Badge variant={log.status === 'success' ? 'default' : 'destructive'}>{log.status}</Badge></td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{log.clientIp || '-'}</td>
                    <td className="whitespace-nowrap py-2">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== 充值记录 ====================

function TransactionsTab() {
  const { t } = useI18n();
  const [data, setData] = useState<PaginatedData<Transaction> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ userId: '', type: '', startDate: '', endDate: '' });

  const fetchTxn = useCallback(async (p: number, f: typeof filters) => {
    setLoading(true);
    try {
      const params: any = { page: p, pageSize: 20 };
      if (f.userId) params.userId = f.userId;
      if (f.type) params.type = f.type;
      if (f.startDate) params.startDate = f.startDate;
      if (f.endDate) params.endDate = f.endDate;
      const res = await api.get('/admin/transactions', { params });
      setData(res.data.data);
    } catch { /* 忽略 */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTxn(1, filters); }, [fetchTxn]); // eslint-disable-line
  const handleFilter = () => { setPage(1); fetchTxn(1, filters); };
  const handlePageChange = (p: number) => { setPage(p); fetchTxn(p, filters); };

  const paymentLabel = (m: string | null) => {
    if (m === 'ADMIN') return '管理员操作';
    if (m === 'SYSTEM') return 'System';
    return m || '-';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.admin_transactions}</CardTitle>
        <div className="flex flex-wrap gap-2 pt-2">
          <Input placeholder={t.admin_filter_user} value={filters.userId}
            onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))} className="w-48" />
          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
            <option value="">{t.admin_filter_type}</option>
            <option value="TOPUP">TOPUP</option><option value="USAGE">USAGE</option>
            <option value="BONUS">BONUS</option><option value="REFUND">REFUND</option>
          </select>
          <Input type="date" value={filters.startDate}
            onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))} className="w-40" />
          <Input type="date" value={filters.endDate}
            onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))} className="w-40" />
          <Button size="sm" variant="outline" onClick={handleFilter}>
            <Search className="mr-1 h-4 w-4" /> {t.admin_filter_search}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-muted-foreground">{t.loading}</p> :
         !data || data.items.length === 0 ? <p className="text-muted-foreground">{t.admin_no_txn}</p> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-3">{t.admin_email}</th><th className="pb-2 pr-3">{t.admin_txn_type}</th>
                  <th className="pb-2 pr-3">{t.admin_txn_amount}</th><th className="pb-2 pr-3">{t.admin_txn_payment}</th>
                  <th className="pb-2 pr-3">{t.admin_txn_status}</th><th className="pb-2 pr-3">{t.admin_txn_desc}</th>
                  <th className="pb-2">{t.admin_time}</th>
                </tr></thead>
                <tbody>{data.items.map((txn) => (
                  <tr key={txn.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">{txn.userEmail}</td>
                    <td className="py-2 pr-3"><Badge variant={txn.type === 'TOPUP' || txn.type === 'BONUS' ? 'default' : 'secondary'}>{txn.type}</Badge></td>
                    <td className="py-2 pr-3">${parseFloat(txn.amount).toFixed(4)}</td>
                    <td className="py-2 pr-3">
                      {txn.paymentMethod === 'ADMIN' ? <Badge variant="outline" className="border-orange-500 text-orange-500">{paymentLabel(txn.paymentMethod)}</Badge> : paymentLabel(txn.paymentMethod)}
                    </td>
                    <td className="py-2 pr-3"><Badge variant={txn.status === 'COMPLETED' ? 'default' : 'secondary'}>{txn.status}</Badge></td>
                    <td className="max-w-[200px] truncate py-2 pr-3 text-xs">{txn.description || '-'}</td>
                    <td className="whitespace-nowrap py-2">{new Date(txn.createdAt).toLocaleString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== 我的消耗 ====================

function MyUsageTab() {
  const { t } = useI18n();
  const [data, setData] = useState<MyUsageData | null>(null);
  const [period, setPeriod] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMyUsage = useCallback(async (p: string, start?: string, end?: string) => {
    setLoading(true);
    try {
      const params: any = { period: p };
      if (p === 'custom') { params.startDate = start; params.endDate = end; }
      const res = await api.get('/admin/my-usage', { params });
      setData(res.data.data);
    } catch { /* 忽略 */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMyUsage('today'); }, [fetchMyUsage]);

  const handlePeriod = (p: string) => {
    setPeriod(p);
    if (p !== 'custom') fetchMyUsage(p);
  };

  const handleCustomSearch = () => {
    if (customStart) fetchMyUsage('custom', customStart, customEnd);
  };

  const periodLabels: Record<string, string> = {
    today: t.admin_my_today || '今日',
    month: t.admin_my_month || '本月',
    year: t.admin_my_year || '本年',
    custom: t.admin_my_custom || '自定义',
  };

  return (
    <div className="space-y-4">
      {/* 时间范围选择 */}
      <div className="flex flex-wrap items-center gap-2">
        {['today', 'month', 'year', 'custom'].map((p) => (
          <Button key={p} size="sm" variant={period === p ? 'default' : 'outline'} onClick={() => handlePeriod(p)}>
            {periodLabels[p]}
          </Button>
        ))}
        {period === 'custom' && (
          <>
            <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-40" />
            <span className="text-muted-foreground">~</span>
            <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-40" />
            <Button size="sm" onClick={handleCustomSearch}><Search className="mr-1 h-4 w-4" /> {t.admin_filter_search}</Button>
          </>
        )}
      </div>

      {loading ? <p className="text-muted-foreground">{t.loading}</p> : !data ? null : (
        <>
          {/* 汇总卡片 */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.admin_total_calls}</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{data.totalCalls}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.admin_tokens}</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{data.totalTokens.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.admin_cost}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">${parseFloat(data.totalCost).toFixed(4)}</div></CardContent>
            </Card>
          </div>

          {/* 模型明细表 */}
          <Card>
            <CardHeader><CardTitle>{t.admin_my_model_detail || '模型消耗明细'}</CardTitle></CardHeader>
            <CardContent>
              {data.models.length === 0 ? <p className="text-muted-foreground">{t.admin_no_logs}</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">{t.admin_model}</th>
                      <th className="pb-2 pr-4">{t.admin_calls}</th>
                      <th className="pb-2 pr-4">{t.admin_my_input || '输入 Token'}</th>
                      <th className="pb-2 pr-4">{t.admin_my_output || '输出 Token'}</th>
                      <th className="pb-2 pr-4">{t.admin_tokens}</th>
                      <th className="pb-2">{t.admin_cost}</th>
                    </tr></thead>
                    <tbody>{data.models.map((m) => (
                      <tr key={m.model} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{m.model}</td>
                        <td className="py-2 pr-4">{m.calls}</td>
                        <td className="py-2 pr-4">{m.promptTokens.toLocaleString()}</td>
                        <td className="py-2 pr-4">{m.completionTokens.toLocaleString()}</td>
                        <td className="py-2 pr-4">{m.totalTokens.toLocaleString()}</td>
                        <td className="py-2">${parseFloat(m.cost).toFixed(6)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ==================== 系统设置 ====================

function SettingsTab({ toast }: { toast: ReturnType<typeof useToast> }) {
  const { t } = useI18n();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/settings');
        setSettings(res.data.data);
      } catch { /* 忽略 */ }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/admin/settings', settings);
      setSettings(res.data.data);
      toast.show(t.admin_saved, 'success');
    } catch {
      toast.show('保存失败', 'error');
    }
    setSaving(false);
  };

  if (loading) return <p className="text-muted-foreground">{t.loading}</p>;

  return (
    <Card>
      <CardHeader><CardTitle>{t.admin_settings}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">{t.admin_signup_bonus}</label>
            <Input type="number" step="0.01" min="0" value={settings.signup_bonus || ''}
              onChange={(e) => setSettings((s) => ({ ...s, signup_bonus: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t.admin_max_per_request}</label>
            <Input type="number" step="0.01" min="0" value={settings.max_per_request || ''}
              onChange={(e) => setSettings((s) => ({ ...s, max_per_request: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t.admin_announcement}</label>
          <Input placeholder={t.admin_announcement_hint} value={settings.announcement || ''}
            onChange={(e) => setSettings((s) => ({ ...s, announcement: e.target.value }))} />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">{t.admin_maintenance}</label>
          <button type="button"
            className={`relative h-6 w-11 rounded-full transition-colors ${settings.maintenance_mode === 'true' ? 'bg-destructive' : 'bg-muted'}`}
            onClick={() => setSettings((s) => ({ ...s, maintenance_mode: s.maintenance_mode === 'true' ? 'false' : 'true' }))}>
            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings.maintenance_mode === 'true' ? 'translate-x-5' : ''}`} />
          </button>
          <span className="text-xs text-muted-foreground">{t.admin_maintenance_hint}</span>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t.admin_saving : t.admin_save_settings}
        </Button>
      </CardContent>
    </Card>
  );
}

// ==================== 供应商管理 ====================

function ProvidersTab() {
  const { t } = useI18n();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/providers/balance');
      setProviders(res.data.data);
    } catch { /* 忽略 */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  if (loading) return <p className="text-muted-foreground">{t.loading}</p>;

  const hasLowBalance = providers.some((p) => p.lowBalance && p.status !== 'unconfigured');

  return (
    <div className="space-y-4">
      {hasLowBalance && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-medium">{t.admin_provider_low}</p>
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t.admin_providers}</CardTitle>
            <Button size="sm" variant="outline" onClick={fetchProviders}>
              <RefreshCw className="mr-1 h-4 w-4" /> {t.admin_provider_refresh}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">{t.admin_provider_name}</th><th className="pb-2 pr-4">{t.admin_provider_key}</th>
                <th className="pb-2 pr-4">{t.admin_provider_balance}</th><th className="pb-2 pr-4">{t.admin_provider_status}</th>
                <th className="pb-2">{t.admin_provider_checked}</th>
              </tr></thead>
              <tbody>{providers.map((p) => (
                <tr key={p.name} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{p.name}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{p.keyPrefix}</td>
                  <td className="py-3 pr-4">{p.balance === '-' ? '-' : <span className={p.lowBalance ? 'font-bold text-destructive' : ''}>¥{p.balance}</span>}</td>
                  <td className="py-3 pr-4">
                    {p.status === 'ok' && !p.lowBalance && <Badge variant="default">{t.admin_provider_ok}</Badge>}
                    {p.status === 'ok' && p.lowBalance && <Badge variant="destructive">{t.admin_provider_low}</Badge>}
                    {p.status === 'error' && <Badge variant="destructive">Error</Badge>}
                    {p.status === 'unconfigured' && <Badge variant="secondary">{t.admin_provider_unconfigured}</Badge>}
                  </td>
                  <td className="py-3 text-xs text-muted-foreground">{p.lastChecked ? new Date(p.lastChecked).toLocaleString() : '-'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
