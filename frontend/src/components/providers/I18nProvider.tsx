'use client';

import { useI18n } from '@/lib/i18n';

// 全局 i18n 初始化：确保任何页面加载时都从 localStorage 读取语言
export function I18nProvider({ children }: { children: React.ReactNode }) {
  useI18n();
  return <>{children}</>;
}
