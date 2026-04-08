'use client';

import { useState } from 'react';
import { MessageCircle, X, Mail, Send, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

// Tawk.to 加载函数
function openTawkTo() {
  // 如果已加载则直接打开
  if ((window as any).Tawk_API?.maximize) {
    (window as any).Tawk_API.maximize();
    return;
  }
  // 首次加载 Tawk.to 脚本（替换为实际 property ID）
  const s = document.createElement('script');
  s.src = 'https://embed.tawk.to/YOUR_PROPERTY_ID/default';
  s.async = true;
  s.charset = 'UTF-8';
  s.setAttribute('crossorigin', '*');
  document.head.appendChild(s);
}

export function CustomerService() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* 弹出选项 */}
      {open && (
        <div className="mb-2 flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="px-1 text-sm font-semibold">{t.cs_title}</p>

          <button
            onClick={() => { openTawkTo(); setOpen(false); }}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <MessagesSquare className="h-4 w-4" />
            {t.cs_chat}
          </button>

          <a
            href="mailto:support@anytokens.com"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Mail className="h-4 w-4" />
            {t.cs_email}
          </a>

          <a
            href="https://t.me/anytokens"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Send className="h-4 w-4" />
            {t.cs_telegram}
          </a>
        </div>
      )}

      {/* 悬浮按钮 */}
      <Button
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </Button>
    </div>
  );
}
