'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n, SUPPORTED_LOCALES } from '@/lib/i18n';

// 服务端默认值，必须和 i18n.ts 中 SSR_DEFAULT ('en') 一致
const SSR_DEFAULT = SUPPORTED_LOCALES.find((l) => l.key === 'en')!;

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = SUPPORTED_LOCALES.find((l) => l.key === locale) || SSR_DEFAULT;
  const display = mounted ? current : SSR_DEFAULT;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 px-2">
          <Image
            src={display.flag}
            alt={display.code}
            width={20}
            height={15}
            className="rounded-[2px]"
            suppressHydrationWarning
            unoptimized
          />
          <span className="hidden sm:inline text-xs font-medium" suppressHydrationWarning>
            {display.code}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        {SUPPORTED_LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.key}
            onClick={() => setLocale(l.key)}
            className={`gap-2 ${locale === l.key ? 'bg-accent' : ''}`}
          >
            <Image
              src={l.flag}
              alt={l.code}
              width={20}
              height={15}
              className="rounded-[2px]"
              unoptimized
            />
            <span className="text-xs font-medium text-muted-foreground">{l.code}</span>
            <span className="text-sm">{l.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
