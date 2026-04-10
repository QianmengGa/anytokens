'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import {
  Wallet,
  CreditCard,
  Check,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Clock,
  ExternalLink,
  Download,
} from 'lucide-react';

const AMOUNTS = [5, 10, 20, 50, 100, 200, 500];

const PAYMENT_METHODS = [
  {
    id: 'stripe',
    icon: CreditCard,
    sublabel: 'Visa / MasterCard / GrabPay',
  },
  {
    id: 'usdt',
    icon: () => <span className="text-lg font-bold">₮</span>,
    label: 'USDT',
    sublabel: 'TRC20',
  },
  {
    id: 'usdc',
    icon: () => <span className="text-lg font-bold">$</span>,
    label: 'USDC',
    sublabel: 'TRC20',
  },
];

// 加密货币支付信息
interface CryptoPaymentInfo {
  paymentId: string;
  payAddress: string;
  payAmount: string;
  payCurrency: string;
  transactionId: string;
}

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

  // 加密货币支付弹窗
  const [cryptoInfo, setCryptoInfo] = useState<CryptoPaymentInfo | null>(null);
  const [cryptoDialogOpen, setCryptoDialogOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [cryptoStatus, setCryptoStatus] = useState<string>('waiting');

  // 导出状态
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportingUsage, setExportingUsage] = useState(false);
  const [exportingInvoices, setExportingInvoices] = useState(false);

  const finalAmount = selectedAmount ?? (customAmount ? Number(customAmount) : 0);

  // 检查 URL 参数显示支付结果
  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';

  useEffect(() => {
    if (isSuccess || isCanceled) {
      const timer = setTimeout(() => {
        window.history.replaceState({}, '', '/billing');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, isCanceled]);

  // 轮询加密货币支付状态
  useEffect(() => {
    if (!cryptoInfo || !cryptoDialogOpen) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/crypto-payment/status/${cryptoInfo.paymentId}`);
        const status = res.data.data.paymentStatus;
        setCryptoStatus(status);

        if (status === 'finished' || status === 'confirmed') {
          clearInterval(interval);
          // 延迟关闭弹窗，显示成功状态
          setTimeout(() => {
            setCryptoDialogOpen(false);
            setCryptoInfo(null);
            window.location.href = '/billing?success=true';
          }, 2000);
        }
      } catch {
        // 查询失败不中断轮询
      }
    }, 15000); // 每 15 秒查询

    return () => clearInterval(interval);
  }, [cryptoInfo, cryptoDialogOpen]);

  // 复制到剪贴板
  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback
    }
  }, []);

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

    setLoading(true);
    try {
      if (selectedMethod === 'stripe') {
        // Stripe 信用卡支付
        const res = await api.post('/payment/create-checkout-session', {
          amount: finalAmount,
        });
        const { url } = res.data.data;
        if (url) {
          window.location.href = url;
        } else {
          setError(t.billing_error);
        }
      } else {
        // 加密货币支付 (USDT / USDC)
        const res = await api.post('/crypto-payment/create', {
          amount: finalAmount,
          currency: selectedMethod.toUpperCase(),
        });
        const data = res.data.data as CryptoPaymentInfo;
        setCryptoInfo(data);
        setCryptoStatus('waiting');
        setCryptoDialogOpen(true);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || t.billing_error;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 支付状态显示文本
  const statusText = (status: string) => {
    switch (status) {
      case 'waiting': return t.crypto_status_waiting;
      case 'confirming': return t.crypto_status_confirming;
      case 'confirmed': return t.crypto_status_confirmed;
      case 'sending': return t.crypto_status_sending;
      case 'partially_paid': return t.crypto_status_partial;
      case 'finished': return t.crypto_status_finished;
      case 'failed': return t.crypto_status_failed;
      case 'expired': return t.crypto_status_expired;
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    if (status === 'finished' || status === 'confirmed') return 'text-green-500';
    if (status === 'failed' || status === 'expired') return 'text-red-500';
    return 'text-amber-500';
  };

  const handleExport = async (type: 'usage' | 'invoices') => {
    const setter = type === 'usage' ? setExportingUsage : setExportingInvoices;
    setter(true);
    try {
      const params = new URLSearchParams({ format: 'csv' });
      if (exportStartDate) params.set('startDate', exportStartDate);
      if (exportEndDate) params.set('endDate', exportEndDate);
      const res = await api.get(`/user/export/${type}?${params}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Export failed');
    } finally {
      setter(false);
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

      {/* 数据导出 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t.export_usage}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">{t.export_start_date}</label>
              <Input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className="h-9 w-40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">{t.export_end_date}</label>
              <Input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className="h-9 w-40" />
            </div>
            <Button size="sm" variant="outline" onClick={() => handleExport('usage')} disabled={exportingUsage}>
              {exportingUsage ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />{t.export_downloading}</> : <><Download className="mr-1.5 h-3.5 w-3.5" />{t.export_usage} CSV</>}
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('invoices')} disabled={exportingInvoices}>
              {exportingInvoices ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />{t.export_downloading}</> : <><Download className="mr-1.5 h-3.5 w-3.5" />{t.export_invoices} CSV</>}
            </Button>
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
              return (
                <button
                  key={method.id}
                  onClick={() => { setSelectedMethod(method.id); setError(''); }}
                  className={`relative flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                    selectedMethod === method.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-accent'
                  }`}
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
          <p className="mt-3 text-xs text-muted-foreground">
            Visa / Mastercard / Apple Pay / Google Pay / GrabPay / USDT · Alipay coming soon
          </p>
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

      {/* 加密货币支付弹窗 */}
      <Dialog open={cryptoDialogOpen} onOpenChange={setCryptoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.crypto_dialog_title}</DialogTitle>
            <DialogDescription>{t.crypto_dialog_desc}</DialogDescription>
          </DialogHeader>

          {cryptoInfo && (
            <div className="space-y-4">
              {/* 支付状态 */}
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{t.crypto_status}</span>
                </div>
                <span className={`text-sm font-medium ${statusColor(cryptoStatus)}`}>
                  {statusText(cryptoStatus)}
                </span>
              </div>

              {/* 支付金额 */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t.crypto_pay_amount}</label>
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <span className="flex-1 font-mono text-lg font-bold">
                    {cryptoInfo.payAmount} {cryptoInfo.payCurrency.toUpperCase()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(cryptoInfo.payAmount, 'amount')}
                  >
                    {copied === 'amount' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* 收款地址 */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t.crypto_pay_address}</label>
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <span className="flex-1 break-all font-mono text-xs">
                    {cryptoInfo.payAddress}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(cryptoInfo.payAddress, 'address')}
                  >
                    {copied === 'address' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* 等值 USD */}
              <div className="rounded-lg bg-muted/50 p-3 text-center text-sm text-muted-foreground">
                ≈ ${finalAmount.toFixed(2)} USD
              </div>

              {/* 提示 */}
              <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-50/50 p-3 text-xs text-muted-foreground dark:bg-amber-950/20">
                <p>{t.crypto_notice_1}</p>
                <p>{t.crypto_notice_2}</p>
              </div>

              {/* 在 NOWPayments 查看 */}
              <div className="text-center">
                <a
                  href={`https://nowpayments.io/payment/?iid=${cryptoInfo.paymentId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                  {t.crypto_view_on_nowpayments}
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
