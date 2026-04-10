'use client';

import { useState } from 'react';
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
import { Wallet, Settings, Key, FlaskConical, LogOut, Menu, X } from 'lucide-react';
import { LogoFull } from '@/components/Logo';

// 公共导航栏 — 用于首页、应用、企业、Playground 等公开页面
export function PublicNavbar() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const user = session?.user as any;
  const [mobileOpen, setMobileOpen] = useState(false);

  // 导航链接数据
  const navLinks = [
    { href: '/apps', label: t.nav_apps },
    { href: '/models', label: t.nav_models },
    { href: '/playground', label: 'Playground' },
    { href: '/pricing', label: t.footer_pricing },
    { href: '/docs', label: t.nav_docs },
    { href: '/enterprise', label: t.nav_enterprise },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 w-full items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <LogoFull size={28} />
        </Link>

        <div className="flex items-center gap-1.5">
          {/* 桌面端导航链接 */}
          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant="ghost" size="sm">{link.label}</Button>
              </Link>
            ))}
          </div>

          {/* 语言 + 主题（桌面和移动端都显示） */}
          <LanguageSwitcher />
          <ThemeToggle />

          {session ? (
            <>
              {/* 余额 */}
              <Link href="/billing" className="hidden items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors hover:bg-accent sm:flex">
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
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">{t.nav_login}</Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button size="sm">{t.nav_register}</Button>
              </Link>
            </>
          )}

          {/* 汉堡按钮（移动端） */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* 移动端下拉菜单 */}
      {mobileOpen && (
        <div className="absolute left-0 right-0 top-full z-50 border-b border-border/40 bg-background shadow-lg lg:hidden">
          <div className="flex flex-col p-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}

            {/* 移动端登录/注册按钮 */}
            {!session && (
              <div className="flex gap-2 border-t border-border/40 pt-3 mt-2">
                <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">{t.nav_login}</Button>
                </Link>
                <Link href="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">{t.nav_register}</Button>
                </Link>
              </div>
            )}

            {/* 移动端余额 */}
            {session && (
              <Link
                href="/billing"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-accent mt-2"
              >
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">${Number(user?.balance || 0).toFixed(2)}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
