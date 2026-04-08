'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { PasswordStrength, isPasswordStrong } from '@/components/PasswordStrength';

type Step = 'email' | 'reset' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 倒计时逻辑
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // 发送验证码
  const handleSendCode = useCallback(async () => {
    if (countdown > 0 || !email) return;
    setError('');
    setSendingCode(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok || data.code !== 0) {
        setError(data.message || 'Failed');
        return;
      }

      setCountdown(60);
      if (step === 'email') {
        setStep('reset');
      }
    } catch {
      setError('Network error');
    } finally {
      setSendingCode(false);
    }
  }, [email, countdown, step]);

  // 提交重置密码
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordStrong(password)) {
      setError(t.pwd_too_weak);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.reset_mismatch);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      });
      const data = await res.json();

      if (!res.ok || data.code !== 0) {
        setError(data.message || 'Failed');
        return;
      }

      setStep('success');
      setTimeout(() => router.push('/login'), 3000);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t.forgot_title}</CardTitle>
          <CardDescription>{t.forgot_desc}</CardDescription>
        </CardHeader>

        {/* 第三步：重置成功 */}
        {step === 'success' && (
          <CardContent className="space-y-4">
            <div className="rounded-md bg-green-50 dark:bg-green-950 p-4 text-sm text-green-700 dark:text-green-300 text-center">
              {t.reset_success}
            </div>
          </CardContent>
        )}

        {/* 第一步：输入邮箱 */}
        {step === 'email' && (
          <>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t.forgot_email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                className="w-full"
                disabled={!email || sendingCode}
                onClick={handleSendCode}
              >
                {sendingCode ? t.forgot_sending : t.forgot_submit}
              </Button>
            </CardFooter>
          </>
        )}

        {/* 第二步：输入验证码 + 新密码 */}
        {step === 'reset' && (
          <form onSubmit={handleReset}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* 邮箱（灰色不可编辑） */}
              <div className="space-y-2">
                <Label>{t.forgot_email}</Label>
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* 验证码 */}
              <div className="space-y-2">
                <Label htmlFor="code">{t.reg_code}</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
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
                    disabled={countdown > 0 || sendingCode}
                    onClick={handleSendCode}
                  >
                    {sendingCode ? t.reg_sending : countdown > 0 ? `${countdown}s` : t.reg_send_code}
                  </Button>
                </div>
              </div>

              {/* 新密码 */}
              <div className="space-y-2">
                <Label htmlFor="password">{t.reset_password}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t.reset_password_placeholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <PasswordStrength password={password} />
              </div>

              {/* 确认密码 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t.reset_confirm}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t.reset_confirm_placeholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading || code.length !== 6 || !isPasswordStrong(password)}>
                {loading ? t.reset_loading : t.reset_submit}
              </Button>
            </CardFooter>
          </form>
        )}

        <div className="pb-6 text-center">
          <Link href="/login" className="text-sm text-primary hover:underline">
            {t.forgot_back_login}
          </Link>
        </div>
      </Card>
    </div>
  );
}
