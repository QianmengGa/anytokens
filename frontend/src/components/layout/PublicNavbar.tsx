'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n';
import { Wallet, Settings, Key, FlaskConical, LogOut } from 'lucide-react';

// 公共导航栏 — 用于首页、应用、企业、Playground 等公开页面
export function PublicNavbar() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 w-full items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-primary">Any</span>
          <span className="text-muted-foreground">tokens</span>
        </Link>

        <div className="flex items-center gap-1.5">
          {/* 导航链接 */}
          <Link href="/apps">
            <Button variant="ghost" size="sm">{t.nav_apps}</Button>
          </Link>
          <Link href="/models">
            <Button variant="ghost" size="sm">{t.nav_models}</Button>
          </Link>
          <Link href="/playground">
            <Button variant="ghost" size="sm">Playground</Button>
          </Link>
          <Link href="/docs">
            <Button variant="ghost" size="sm">{t.nav_docs}</Button>
          </Link>
          <Link href="/enterprise">
            <Button variant="ghost" size="sm">{t.nav_enterprise}</Button>
          </Link>

          {/* 语言 + 主题 */}
          <LanguageSwitcher />
          <ThemeToggle />

          {session ? (
            <>
              {/* 余额 — 点击跳转充值 */}
              <Link href="/billing" className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors hover:bg-accent">
                <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-mono">${Number(user?.balance || 0).toFixed(2)}</span>
              </Link>

              {/* 头像 + 下拉菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/playground" className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4" />
                      Playground
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/api-keys" className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      {t.sidebar_api_keys}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      {t.navbar_settings}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t.navbar_logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">{t.nav_login}</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">{t.nav_register}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
