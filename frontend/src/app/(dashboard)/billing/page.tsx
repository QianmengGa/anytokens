'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import {
  Wallet,
  CreditCard,
  MessageCircle,
  Check,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

const AMOUNTS = [5, 10, 20, 50, 100, 200, 500];

const PAYMENT_METHODS = [
  {
    id: 'stripe',
    icon: CreditCard,
    sublabel: 'Visa / MasterCard',
  },
  {
    id: 'usdt',
    icon: () => <span className="text-lg font-bold">₮</span>,
    label: 'USDT',
    sublabel: 'TRC20 / ERC20 / BEP20',
  },
  {
    id: 'usdc',
    icon: () => <span className="text-lg font-bold">$</span>,
    label: 'USDC',
    sublabel: 'TRC20 / ERC20 / BEP20',
  },
];

export default function BillingPage() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const user = session?.user as any;

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const finalAmount = selectedAmount ?? (customAmount ? Number(customAmount) : 0);

  // 检查 URL 参数显示支付结果
  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';

  // 支付结果提示 3 秒后自动清除 URL 参数
  useEffect(() => {
    if (isSuccess || isCanceled) {
      const timer = setTimeout(() => {
        window.history.replaceState({}, '', '/billing');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, isCanceled]);

  // 处理充值
  const handlePayment = async () => {
    setError('');

    if (!finalAmount || finalAmount < 5) {
      setError(finalAmount ? t.billing_min_amount : t.billing_select_amount_first);
      return;
    }
    if (!selectedMethod) {
      setError(t.billing_select_method_first);
      return;
    }

    // 目前只支持 Stripe
    if (selectedMethod !== 'stripe') {
      setError('USDT/USDC 支付即将上线，请先使用信用卡支付');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/payment/create-checkout-session', {
        amount: finalAmount,
      });
      const { url } = res.data.data;
      if (url) {
        window.location.href = url;
      } else {
        setError(t.billing_error);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || t.billing_error;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.billing_title}</h1>

      {/* 支付成功提示 */}
      {isSuccess && (
        <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="flex items-start gap-4 pt-6">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">{t.billing_success}</p>
              <p className="text-sm text-muted-foreground">{t.billing_success_desc}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 支付取消提示 */}
      {isCanceled && (
        <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-4 pt-6">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-400">{t.billing_canceled}</p>
              <p className="text-sm text-muted-foreground">{t.billing_canceled_desc}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 当前余额 */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t.billing_current_balance}</p>
            <p className="text-3xl font-bold font-mono">${Number(user?.balance || 0).toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* 选择金额 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.billing_select_amount}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
            {AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => { setSelectedAmount(amount); setCustomAmount(''); setError(''); }}
                className={`rounded-lg border px-4 py-3 text-center font-mono font-medium transition-colors ${
                  selectedAmount === amount
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary/50 hover:bg-accent'
                }`}
              >
                ${amount}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{t.billing_custom}:</span>
            <div className="relative max-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                min={5}
                placeholder={t.billing_custom_placeholder}
                className="pl-7 font-mono"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                  setError('');
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 支付方式 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.billing_payment_method}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isAvailable = method.id === 'stripe';
              return (
                <button
                  key={method.id}
                  onClick={() => { setSelectedMethod(method.id); setError(''); }}
                  className={`relative flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                    selectedMethod === method.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-accent'
                  } ${!isAvailable ? 'opacity-60' : ''}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {method.id === 'stripe' ? t.billing_credit_card : method.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{method.sublabel}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <Check className="ml-auto h-5 w-5 text-primary" />
                  )}
                  {!isAvailable && (
                    <Badge variant="secondary" className="absolute right-2 top-2 text-[10px]">
                      Coming Soon
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-50/50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 支付按钮 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              {finalAmount > 0 && (
                <p className="text-lg">
                  {t.billing_recharge}: <span className="font-bold font-mono text-2xl">${finalAmount.toFixed(2)}</span>
                </p>
              )}
            </div>
            <Button
              size="lg"
              onClick={handlePayment}
              disabled={loading || !finalAmount}
              className="min-w-[160px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.billing_processing}
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {t.billing_pay_now}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 交易记录 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.billing_history}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t.billing_no_history}</p>
        </CardContent>
      </Card>
    </div>
  );
}
