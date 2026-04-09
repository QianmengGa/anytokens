'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Shield, Activity, Clock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

const ACTIONS = ['', 'LOGIN', 'REGISTER', 'API_CALL', 'TOPUP', 'SETTINGS_CHANGE', 'PASSWORD_CHANGE', 'KEY_CREATE', 'KEY_DELETE', 'TEAM_CREATE', 'TEAM_INVITE'];

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-blue-500/10 text-blue-500',
  REGISTER: 'bg-green-500/10 text-green-500',
  API_CALL: 'bg-violet-500/10 text-violet-500',
  TOPUP: 'bg-amber-500/10 text-amber-500',
  SETTINGS_CHANGE: 'bg-gray-500/10 text-gray-500',
  PASSWORD_CHANGE: 'bg-red-500/10 text-red-500',
  KEY_CREATE: 'bg-cyan-500/10 text-cyan-500',
  TEAM_CREATE: 'bg-pink-500/10 text-pink-500',
};

interface SlaStats {
  totalCalls: number; successCalls: number; availability: number;
  avgLatencyMs: number; errorRate: number;
  dailyStats: Array<{ day: string; total: number; success: number; avgLatency: number }>;
}

interface AuditLog {
  id: string; action: string; detail: any; ip: string | null;
  result: string; createdAt: string;
}

interface AuditResult {
  logs: AuditLog[]; total: number; page: number; totalPages: number;
}

export default function AuditPage() {
  const { t } = useI18n();
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);

  // SLA 统计
  const { data: sla } = useQuery<SlaStats>({
    queryKey: ['sla-stats'],
    queryFn: async () => { const r = await api.get('/audit/sla'); return r.data.data; },
  });

  // 审计日志
  const { data: auditData } = useQuery<AuditResult>({
    queryKey: ['audit-logs', actionFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (actionFilter) params.set('action', actionFilter);
      const r = await api.get(`/audit/my?${params}`);
      return r.data.data;
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">{t.audit_title}</h1>

      {/* SLA 监控面板 */}
      {sla && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.audit_availability}</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${sla.availability >= 99.9 ? 'text-green-500' : sla.availability >= 99 ? 'text-yellow-500' : 'text-red-500'}`}>
                {sla.availability}%
              </div>
              <p className="text-xs text-muted-foreground">{t.audit_30d}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.audit_avg_latency}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sla.avgLatencyMs}ms</div>
              <p className="text-xs text-muted-foreground">{t.audit_30d}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.audit_error_rate}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${sla.errorRate < 1 ? 'text-green-500' : 'text-red-500'}`}>
                {sla.errorRate}%
              </div>
              <p className="text-xs text-muted-foreground">{t.audit_30d}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.audit_total_calls}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sla.totalCalls.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{t.audit_30d}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 每日可用性柱状图（简化版） */}
      {sla && sla.dailyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t.audit_daily_chart}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 overflow-x-auto" style={{ height: 80 }}>
              {sla.dailyStats.slice().reverse().map((d) => {
                const pct = d.total > 0 ? (d.success / d.total) * 100 : 100;
                const h = Math.max(4, (pct / 100) * 72);
                return (
                  <div key={d.day} className="group relative flex-1 min-w-[8px]" title={`${d.day}: ${pct.toFixed(1)}% (${d.total} calls)`}>
                    <div
                      className={`w-full rounded-t ${pct >= 99.9 ? 'bg-green-500' : pct >= 99 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ height: `${h}px` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>{sla.dailyStats[sla.dailyStats.length - 1]?.day}</span>
              <span>{sla.dailyStats[0]?.day}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 审计日志 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.audit_logs}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 筛选 */}
          <div className="flex flex-wrap gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a || 'all'}
                onClick={() => { setActionFilter(a); setPage(1); }}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  actionFilter === a ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {a || t.audit_all}
              </button>
            ))}
          </div>

          {/* 日志列表 */}
          <div className="space-y-2">
            {auditData?.logs.map((log) => (
              <div key={log.id} className="flex items-start justify-between rounded-md border border-border/60 px-3 py-2">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className={`shrink-0 text-[10px] ${ACTION_COLORS[log.action] || ''}`}>
                    {log.action}
                  </Badge>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {log.detail && typeof log.detail === 'object' ? Object.entries(log.detail).map(([k, v]) => `${k}: ${v}`).join(' · ') : ''}
                    </p>
                    {log.ip && <p className="text-[10px] text-muted-foreground">IP: {log.ip}</p>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <Badge variant={log.result === 'success' ? 'secondary' : 'destructive'} className="text-[10px]">
                    {log.result}
                  </Badge>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {auditData?.logs.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">{t.audit_empty}</p>
            )}
          </div>

          {/* 分页 */}
          {auditData && auditData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{page} / {auditData.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= auditData.totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
