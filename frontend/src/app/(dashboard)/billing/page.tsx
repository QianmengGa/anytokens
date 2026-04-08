'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import {
  Wallet,
  CreditCard,
  MessageCircle,
  AlertTriangle,
  Check,
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
  const user = session?.user as any;

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const finalAmount = selectedAmount ?? (customAmount ? Number(customAmount) : 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.billing_title}</h1>

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
                onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
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
                min={1}
                placeholder={t.billing_custom_placeholder}
                className="pl-7 font-mono"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
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
                  onClick={() => setSelectedMethod(method.id)}
                  className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
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

      {/* 即将上线提示 */}
      <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="flex items-start gap-4 pt-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-2">
            <p className="font-medium">{t.billing_coming_soon}</p>
            <p className="text-sm text-muted-foreground">{t.billing_coming_soon_desc}</p>
            <a
              href="https://t.me/anytokens_support"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="mt-2" size="sm">
                <MessageCircle className="mr-2 h-4 w-4" />
                {t.billing_contact_cs}
              </Button>
            </a>
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
