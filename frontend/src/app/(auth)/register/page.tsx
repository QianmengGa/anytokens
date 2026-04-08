'use client';

import { useState, useEffect, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useI18n } from '@/lib/i18n';
import { COUNTRY_CODES, getDefaultCountry } from '@/lib/country-codes';
import { PasswordStrength, isPasswordStrong } from '@/components/PasswordStrength';

type RegMode = 'email' | 'phone';

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();

  // 注册方式切换
  const [mode, setMode] = useState<RegMode>('email');

  // 共用状态
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);

  // 邮箱模式
  const [email, setEmail] = useState('');

  // 手机号模式
  const [countryCode, setCountryCode] = useState('');
  const [phone, setPhone] = useState('');

  // 初始化默认国家
  useEffect(() => {
    const defaultCode = getDefaultCountry();
    const country = COUNTRY_CODES.find((c) => c.code === defaultCode);
    if (country) setCountryCode(country.code);
  }, []);

  // 倒计时逻辑
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // 切换模式时重置
  const switchMode = (m: RegMode) => {
    setMode(m);
    setCode('');
    setError('');
    setCodeSent(false);
    setCountdown(0);
  };

  // 发送验证码
  const handleSendCode = useCallback(async () => {
    if (countdown > 0) return;
    setError('');
    setSendingCode(true);

    try {
      if (mode === 'email') {
        if (!email) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok || data.code !== 0) {
          setError(data.message || 'Failed');
          return;
        }
      } else {
        // 手机号模式：预留接口，暂用 console.log 模拟
        if (!phone) return;
        const country = COUNTRY_CODES.find((c) => c.code === countryCode);
        const fullPhone = `${country?.dial || ''}${phone}`;
        console.log(`[SMS] 发送验证码到 ${fullPhone}（模拟）`);
        // TODO: 接入真实短信服务
      }
      setCodeSent(true);
      setCountdown(60);
    } catch (err) {
      console.error('发送验证码异常:', err);
      setError('Network error');
    } finally {
      setSendingCode(false);
    }
  }, [email, phone, countryCode, countdown, mode]);

  // 提交注册
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'phone') {
        // 手机号注册暂未接入后端，提示用户
        setError('Phone registration is coming soon. Please use email.');
        setLoading(false);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, code, ...(name ? { name } : {}) }),
      });

      const data = await res.json();

      if (!res.ok || data.code !== 0) {
        setError(data.message || t.reg_loading);
        return;
      }

      // 注册成功后自动登录
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        router.push('/login');
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('注册异常:', err);
      setError(err instanceof Error ? err.message : t.reg_loading);
    } finally {
      setLoading(false);
    }
  };

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t.reg_title}</CardTitle>
          <CardDescription>{t.reg_desc}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* 选项卡切换 */}
            <div className="flex rounded-lg border p-1">
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === 'email'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => switchMode('email')}
              >
                {t.reg_tab_email}
              </button>
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === 'phone'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => switchMode('phone')}
              >
                {t.reg_tab_phone}
              </button>
            </div>

            {/* 邮箱模式 */}
            {mode === 'email' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">{t.reg_email}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 whitespace-nowrap"
                      disabled={!email || countdown > 0 || sendingCode}
                      onClick={handleSendCode}
                    >
                      {sendingCode ? t.reg_sending : countdown > 0 ? `${countdown}s` : t.reg_send_code}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">{t.reg_code}</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    placeholder={t.reg_code_placeholder}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                  />
                  {codeSent && !error && (
                    <p className="text-xs text-muted-foreground">{t.reg_code_sent} {email}</p>
                  )}
                </div>
              </>
            )}

            {/* 手机号模式 */}
            {mode === 'phone' && (
              <>
                <div className="space-y-2">
                  <Label>{t.reg_phone}</Label>
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-[140px] shrink-0">
                        <SelectValue>
                          {selectedCountry
                            ? `${selectedCountry.flag} ${selectedCountry.dial}`
                            : 'Select'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-[300px]">
                          {COUNTRY_CODES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.flag} {c.dial} {c.name}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <Input
                      type="tel"
                      placeholder={t.reg_phone_placeholder}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
                      required
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t.reg_sms_code}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder={t.reg_code_placeholder}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      maxLength={6}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 whitespace-nowrap"
                      disabled={!phone || countdown > 0 || sendingCode}
                      onClick={handleSendCode}
                    >
                      {sendingCode ? t.reg_sending : countdown > 0 ? `${countdown}s` : t.reg_send_sms}
                    </Button>
                  </div>
                  {codeSent && !error && (
                    <p className="text-xs text-muted-foreground">
                      {t.reg_sms_sent} {selectedCountry?.dial}{phone}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* 用户名 */}
            <div className="space-y-2">
              <Label htmlFor="name">{t.reg_name}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t.reg_name_placeholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* 密码 */}
            <div className="space-y-2">
              <Label htmlFor="password">{t.reg_password}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t.reg_password_placeholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <PasswordStrength password={password} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading || code.length !== 6 || !isPasswordStrong(password)}>
              {loading ? t.reg_loading : t.reg_submit}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t.reg_has_account}{' '}
              <Link href="/login" className="text-primary hover:underline">
                {t.reg_login_link}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
