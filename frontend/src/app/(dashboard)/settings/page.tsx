'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Check, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

// 提取错误信息
function getErrMsg(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as any).response?.data?.message || 'Error';
  }
  return err instanceof Error ? err.message : 'Error';
}

// 消息提示组件
function Msg({ type, text }: { type: 'success' | 'error'; text: string }) {
  if (!text) return null;
  return (
    <p className={`text-sm ${type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
      {type === 'error' && <AlertCircle className="mr-1 inline h-3.5 w-3.5" />}
      {type === 'success' && <Check className="mr-1 inline h-3.5 w-3.5" />}
      {text}
    </p>
  );
}

export default function SettingsPage() {
  const { t } = useI18n();

  // 获取当前用户信息
  const { data: user } = useQuery<{
    id: string; name: string; email: string; phone: string | null;
  }>({
    queryKey: ['user-me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.data;
    },
  });

  // 获取消费限额
  const { data: limits } = useQuery<{
    maxPerRequest: string | null;
    maxPerDay: string | null;
    maxPerMonth: string | null;
  }>({
    queryKey: ['spending-limits'],
    queryFn: async () => {
      const res = await api.get('/user/spending-limits');
      return res.data.data;
    },
  });

  // === 基本资料 ===
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      await api.patch('/user/profile', { name, phone });
      setProfileMsg({ type: 'success', text: t.settings_saved });
    } catch (err) {
      setProfileMsg({ type: 'error', text: getErrMsg(err) });
    } finally {
      setProfileLoading(false);
    }
  };

  // === 修改邮箱 ===
  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (emailCountdown <= 0) return;
    const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [emailCountdown]);

  const handleSendEmailCode = async () => {
    if (!newEmail || emailCountdown > 0) return;
    setEmailSending(true);
    setEmailMsg(null);
    try {
      await api.post('/user/send-email-code', { email: newEmail });
      setEmailCountdown(60);
    } catch (err) {
      setEmailMsg({ type: 'error', text: getErrMsg(err) });
    } finally {
      setEmailSending(false);
    }
  };

  const handleChangeEmail = async () => {
    setEmailLoading(true);
    setEmailMsg(null);
    try {
      await api.patch('/user/email', { email: newEmail, code: emailCode });
      setEmailMsg({ type: 'success', text: t.settings_saved });
      setNewEmail('');
      setEmailCode('');
    } catch (err) {
      setEmailMsg({ type: 'error', text: getErrMsg(err) });
    } finally {
      setEmailLoading(false);
    }
  };

  // === 消费控制 ===
  const [maxReq, setMaxReq] = useState('');
  const [maxDay, setMaxDay] = useState('');
  const [maxMonth, setMaxMonth] = useState('');
  const [limitsLoading, setLimitsLoading] = useState(false);
  const [limitsMsg, setLimitsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (limits) {
      setMaxReq(limits.maxPerRequest || '');
      setMaxDay(limits.maxPerDay || '');
      setMaxMonth(limits.maxPerMonth || '');
    }
  }, [limits]);

  const handleSaveLimits = async () => {
    setLimitsLoading(true);
    setLimitsMsg(null);
    try {
      await api.patch('/user/spending-limits', {
        maxPerRequest: maxReq ? Number(maxReq) : null,
        maxPerDay: maxDay ? Number(maxDay) : null,
        maxPerMonth: maxMonth ? Number(maxMonth) : null,
      });
      setLimitsMsg({ type: 'success', text: t.settings_saved });
    } catch (err) {
      setLimitsMsg({ type: 'error', text: getErrMsg(err) });
    } finally {
      setLimitsLoading(false);
    }
  };

  // === 修改密码 ===
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePwd = async () => {
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: t.settings_password_mismatch });
      return;
    }
    setPwdLoading(true);
    setPwdMsg(null);
    try {
      await api.patch('/user/password', { oldPassword: oldPwd, newPassword: newPwd });
      setPwdMsg({ type: 'success', text: t.settings_saved });
      setOldPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      setPwdMsg({ type: 'error', text: getErrMsg(err) });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t.settings_title}</h1>

      {/* 基本资料 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.settings_profile}</CardTitle>
          <CardDescription>{t.settings_profile_desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.settings_name}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t.settings_phone}</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.settings_phone_placeholder}
            />
          </div>
          {profileMsg && <Msg {...profileMsg} />}
          <Button onClick={handleSaveProfile} disabled={profileLoading}>
            {profileLoading ? t.settings_saving : t.settings_save}
          </Button>
        </CardContent>
      </Card>

      {/* 修改邮箱 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.settings_email}</CardTitle>
          <CardDescription>
            {t.settings_email_desc}
            {user?.email && (
              <span className="ml-2 font-mono text-foreground">{user.email}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.settings_new_email}</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@email.com"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={!newEmail || emailCountdown > 0 || emailSending}
                onClick={handleSendEmailCode}
              >
                {emailSending ? '...' : emailCountdown > 0 ? `${emailCountdown}s` : t.reg_send_code}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t.settings_email_code}</Label>
            <Input
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
            />
          </div>
          {emailMsg && <Msg {...emailMsg} />}
          <Button onClick={handleChangeEmail} disabled={emailLoading || emailCode.length !== 6}>
            {t.settings_change_email}
          </Button>
        </CardContent>
      </Card>

      {/* 账号安全 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.settings_security}</CardTitle>
          <CardDescription>{t.settings_security_desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.settings_old_password}</Label>
            <Input type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>{t.settings_new_password}</Label>
            <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} minLength={6} />
          </div>
          <div className="space-y-2">
            <Label>{t.settings_confirm_password}</Label>
            <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
          </div>
          {pwdMsg && <Msg {...pwdMsg} />}
          <Button onClick={handleChangePwd} disabled={pwdLoading || !oldPwd || !newPwd || !confirmPwd}>
            {t.settings_change_password}
          </Button>
        </CardContent>
      </Card>

      {/* 消费控制 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.settings_spending}</CardTitle>
          <CardDescription>{t.settings_spending_desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.settings_max_request} ($)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={maxReq}
              onChange={(e) => setMaxReq(e.target.value)}
              placeholder={t.settings_no_limit}
            />
          </div>
          <div className="space-y-2">
            <Label>{t.settings_max_day} ($)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="10000"
              value={maxDay}
              onChange={(e) => setMaxDay(e.target.value)}
              placeholder={t.settings_no_limit}
            />
          </div>
          <div className="space-y-2">
            <Label>{t.settings_max_month} ($)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100000"
              value={maxMonth}
              onChange={(e) => setMaxMonth(e.target.value)}
              placeholder={t.settings_no_limit}
            />
          </div>
          {limitsMsg && <Msg {...limitsMsg} />}
          <Button onClick={handleSaveLimits} disabled={limitsLoading}>
            {limitsLoading ? t.settings_saving : t.settings_save}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
