'use client';

import { useState } from 'react';
import { MessageCircle, X, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';

const linkClass = 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground';

export function CustomerService() {
  const [open, setOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* 弹出选项 */}
      {open && (
        <div className="mb-2 flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="px-1 text-sm font-semibold">{t.cs_title}</p>

          {/* AI 助手（primary 样式突出） */}
          <button
            onClick={() => { setAiDialogOpen(true); setOpen(false); }}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <MessageCircle className="h-4 w-4" />
            {t.cs_ai}
          </button>

          {/* 邮件 */}
          <a href="mailto:support@anytokens.net" className={linkClass}>
            <Mail className="h-4 w-4" />
            {t.cs_email}
          </a>

          {/* Telegram */}
          <a
            href="https://t.me/anytokens"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
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

      {/* AI 助手即将上线弹窗 */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.cs_ai}</DialogTitle>
            <DialogDescription>{t.cs_ai_coming}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
              OK
            </Button>
            <Button asChild>
              <a href="mailto:support@anytokens.net">{t.cs_email}</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
