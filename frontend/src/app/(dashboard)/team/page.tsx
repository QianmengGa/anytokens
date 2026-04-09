'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Key, Trash2, Copy, Check, UserPlus, Crown, Shield, User } from 'lucide-react';

// 提取错误信息
function getErr(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) return (err as any).response?.data?.message || 'Error';
  return err instanceof Error ? err.message : 'Error';
}

interface TeamSummary {
  id: string; name: string; balance: string; myRole: string;
  memberCount: number; apiKeyCount: number;
}

interface TeamMember {
  id: string; userId: string; name: string; email: string; role: string;
  maxPerDay: string | null; maxPerMonth: string | null;
  monthCalls: number; monthCost: string; monthTokens: number;
}

interface TeamDetail {
  id: string; name: string; balance: string; myRole: string;
  members: TeamMember[];
}

interface TeamKey {
  id: string; name: string; keyPrefix: string; lastUsedAt: string | null; createdAt: string;
  key?: string;
}

const ROLE_ICON: Record<string, typeof Crown> = { OWNER: Crown, ADMIN: Shield, MEMBER: User };

export default function TeamPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState('');

  // 团队列表
  const { data: teams } = useQuery<TeamSummary[]>({
    queryKey: ['teams'],
    queryFn: async () => { const r = await api.get('/team'); return r.data.data; },
  });

  // 团队详情
  const { data: detail } = useQuery<TeamDetail>({
    queryKey: ['team-detail', activeTeamId],
    queryFn: async () => { const r = await api.get(`/team/${activeTeamId}`); return r.data.data; },
    enabled: !!activeTeamId,
  });

  // 团队 Key 列表
  const { data: teamKeys } = useQuery<TeamKey[]>({
    queryKey: ['team-keys', activeTeamId],
    queryFn: async () => { const r = await api.get(`/team/${activeTeamId}/keys`); return r.data.data; },
    enabled: !!activeTeamId,
  });

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreating(true); setMsg('');
    try {
      const r = await api.post('/team', { name: createName });
      setActiveTeamId(r.data.data.id);
      setCreateName('');
      qc.invalidateQueries({ queryKey: ['teams'] });
    } catch (e) { setMsg(getErr(e)); }
    finally { setCreating(false); }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !activeTeamId) return;
    setInviting(true); setMsg('');
    try {
      const r = await api.post(`/team/${activeTeamId}/invite`, { email: inviteEmail, role: 'MEMBER' });
      setMsg(`${t.team_invite_sent} Token: ${r.data.data.token}`);
      setInviteEmail('');
      qc.invalidateQueries({ queryKey: ['team-detail', activeTeamId] });
    } catch (e) { setMsg(getErr(e)); }
    finally { setInviting(false); }
  };

  const handleCreateKey = async () => {
    if (!activeTeamId) return;
    setMsg('');
    try {
      const r = await api.post(`/team/${activeTeamId}/keys`, { name: keyName || 'Team Key' });
      setNewKey(r.data.data.key);
      setKeyName('');
      qc.invalidateQueries({ queryKey: ['team-keys', activeTeamId] });
    } catch (e) { setMsg(getErr(e)); }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!activeTeamId) return;
    try {
      await api.delete(`/team/${activeTeamId}/keys/${keyId}`);
      qc.invalidateQueries({ queryKey: ['team-keys', activeTeamId] });
    } catch (e) { setMsg(getErr(e)); }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeTeamId) return;
    try {
      await api.delete(`/team/${activeTeamId}/members/${userId}`);
      qc.invalidateQueries({ queryKey: ['team-detail', activeTeamId] });
    } catch (e) { setMsg(getErr(e)); }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOwnerOrAdmin = detail?.myRole === 'OWNER' || detail?.myRole === 'ADMIN';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">{t.team_title}</h1>

      {/* 创建团队 + 团队列表 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.team_my_teams}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder={t.team_name_placeholder} className="max-w-xs" />
            <Button onClick={handleCreate} disabled={creating || !createName.trim()}>
              <Plus className="mr-1 h-4 w-4" />{t.team_create}
            </Button>
          </div>

          {teams && teams.length > 0 && (
            <div className="grid gap-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setActiveTeamId(team.id)}
                  className={`flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                    activeTeamId === team.id ? 'border-primary bg-primary/5' : 'border-border/60 hover:bg-muted/30'
                  }`}
                >
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <Badge variant="outline" className="mr-2 text-[10px]">{team.myRole}</Badge>
                      {team.memberCount} {t.team_members} · {team.apiKeyCount} Keys · ${Number(team.balance).toFixed(2)}
                    </p>
                  </div>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 团队详情 */}
      {detail && (
        <>
          {/* 成员管理 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {detail.name} — {t.team_members}
              </CardTitle>
              <CardDescription>{t.team_balance}: ${Number(detail.balance).toFixed(2)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 邀请 */}
              {isOwnerOrAdmin && (
                <div className="flex gap-2">
                  <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder={t.team_invite_placeholder} type="email" className="max-w-xs" />
                  <Button variant="outline" onClick={handleInvite} disabled={inviting || !inviteEmail}>
                    <UserPlus className="mr-1 h-4 w-4" />{t.team_invite}
                  </Button>
                </div>
              )}

              {/* 成员列表 */}
              <div className="space-y-2">
                {detail.members.map((m) => {
                  const RoleIcon = ROLE_ICON[m.role] || User;
                  return (
                    <div key={m.id} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                      <div className="flex items-center gap-3">
                        <RoleIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{m.name || m.email}</p>
                          <p className="text-xs text-muted-foreground">{m.email} · {m.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{m.monthCalls} {t.team_calls}</span>
                        <span>${Number(m.monthCost).toFixed(4)}</span>
                        {isOwnerOrAdmin && m.role !== 'OWNER' && (
                          <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => handleRemoveMember(m.userId)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 团队 API Key */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                {t.team_api_keys}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isOwnerOrAdmin && (
                <div className="flex gap-2">
                  <Input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder={t.team_key_name} className="max-w-xs" />
                  <Button variant="outline" onClick={handleCreateKey}>
                    <Plus className="mr-1 h-4 w-4" />{t.team_create_key}
                  </Button>
                </div>
              )}

              {newKey && (
                <div className="flex items-center gap-2 rounded-md border border-green-500/40 bg-green-500/10 p-3">
                  <code className="flex-1 truncate text-xs">{newKey}</code>
                  <Button size="sm" variant="ghost" onClick={() => handleCopy(newKey)}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {teamKeys?.map((k) => (
                  <div key={k.id} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{k.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{k.keyPrefix}...</p>
                    </div>
                    {isOwnerOrAdmin && (
                      <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => handleDeleteKey(k.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {teamKeys?.length === 0 && <p className="text-sm text-muted-foreground">{t.team_no_keys}</p>}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
    </div>
  );
}
