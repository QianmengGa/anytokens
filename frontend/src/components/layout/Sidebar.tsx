'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import {
  LayoutDashboard,
  Key,
  CreditCard,
  MessageSquare,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  role?: string;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  // 导航菜单项
  const navItems = [
    { href: '/dashboard', label: t.sidebar_overview, icon: LayoutDashboard },
    { href: '/api-keys', label: t.sidebar_api_keys, icon: Key },
    { href: '/billing', label: t.sidebar_billing, icon: CreditCard },
    { href: '/chat', label: t.sidebar_chat, icon: MessageSquare },
  ];

  const adminItems = [
    { href: '/admin', label: t.sidebar_admin, icon: Shield },
  ];

  const items = role === 'ADMIN' ? [...navItems, ...adminItems] : navItems;

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-xl font-bold">
          Anytokens
        </Link>
      </div>

      {/* 导航 */}
      <nav className="flex-1 space-y-1 p-4">
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
    </aside>
  );
}
