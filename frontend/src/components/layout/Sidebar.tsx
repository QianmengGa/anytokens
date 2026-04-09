'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { create } from 'zustand';
import {
  LayoutDashboard,
  Key,
  CreditCard,
  MessageSquare,
  Shield,
  FlaskConical,
  Settings,
  Users,
  ScrollText,
  Building2,
  Bell,
  X,
} from 'lucide-react';

// 移动端侧边栏状态（全局共享，Navbar 中的汉堡按钮也用）
export const useMobileSidebar = create<{
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}>((set) => ({
  open: false,
  setOpen: (v) => set({ open: v }),
  toggle: () => set((s) => ({ open: !s.open })),
}));

interface SidebarProps {
  role?: string;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { open, setOpen } = useMobileSidebar();

  // 路由变化时关闭移动端侧边栏
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  // 导航菜单项
  const navItems = [
    { href: '/dashboard', label: t.sidebar_overview, icon: LayoutDashboard },
    { href: '/api-keys', label: t.sidebar_api_keys, icon: Key },
    { href: '/billing', label: t.sidebar_billing_recharge, icon: CreditCard },
    { href: '/chat', label: t.sidebar_chat, icon: MessageSquare },
    { href: '/team', label: t.sidebar_team, icon: Users },
    { href: '/audit', label: t.sidebar_audit, icon: ScrollText },
    { href: '/reseller', label: t.sidebar_reseller, icon: Building2 },
    { href: '/webhooks', label: t.sidebar_webhooks, icon: Bell },
    { href: '/playground', label: t.sidebar_playground, icon: FlaskConical },
    { href: '/settings', label: t.sidebar_settings, icon: Settings },
  ];

  const adminItems = [
    { href: '/admin', label: t.sidebar_admin, icon: Shield },
  ];

  const items = role === 'ADMIN' ? [...navItems, ...adminItems] : navItems;

  const navContent = (
    <>
      {/* Logo + 关闭按钮（移动端） */}
      <div className="flex h-16 items-center justify-between border-b px-6">
        <Link href="/" className="text-xl font-bold">
          Anytokens
        </Link>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* 导航 */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* 桌面端固定侧边栏 */}
      <aside className="hidden h-full w-64 flex-col border-r bg-card lg:flex">
        {navContent}
      </aside>

      {/* 移动端遮罩 */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 移动端滑入侧边栏 */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card shadow-xl transition-transform duration-300 ease-in-out lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
