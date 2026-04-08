'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { locales, type LocaleKey, type Translations } from '@/locales';

// 支持的语言列表
export const SUPPORTED_LOCALES: { key: LocaleKey; label: string; flag: string }[] = [
  { key: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { key: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
  { key: 'en', label: 'English', flag: '🇺🇸' },
  { key: 'ja', label: '日本語', flag: '🇯🇵' },
  { key: 'ko', label: '한국어', flag: '🇰🇷' },
  { key: 'ms', label: 'Bahasa Melayu', flag: '🇲🇾' },
  { key: 'th', label: 'ภาษาไทย', flag: '🇹🇭' },
  { key: 'es', label: 'Español', flag: '🇪🇸' },
  { key: 'fr', label: 'Français', flag: '🇫🇷' },
  { key: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { key: 'ru', label: 'Русский', flag: '🇷🇺' },
];

const STORAGE_KEY = 'anytokens-locale';

// SSR 和客户端首次渲染都用 'en'，保证 hydration 一致
const SSR_DEFAULT: LocaleKey = 'en';

// 检测浏览器语言（仅客户端调用）
function detectLocale(): LocaleKey {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && saved in locales) return saved as LocaleKey;

  const browserLang = navigator.language;
  if (browserLang in locales) return browserLang as LocaleKey;
  const prefix = browserLang.split('-')[0];
  const match = SUPPORTED_LOCALES.find(
    (l) => l.key.startsWith(prefix) || l.key === prefix,
  );
  return match?.key || 'en';
}

interface I18nState {
  locale: LocaleKey;
  t: Translations;
  _hydrated: boolean;
  setLocale: (locale: LocaleKey) => void;
  _hydrate: () => void;
}

export const useI18nStore = create<I18nState>((set) => ({
  // 初始值固定为 en，SSR 和客户端首帧一致
  locale: SSR_DEFAULT,
  t: locales[SSR_DEFAULT],
  _hydrated: false,
  setLocale: (locale: LocaleKey) => {
    localStorage.setItem(STORAGE_KEY, locale);
    set({ locale, t: locales[locale] });
  },
  _hydrate: () => {
    const detected = detectLocale();
    set({ locale: detected, t: locales[detected], _hydrated: true });
  },
}));

// 封装 hook：自动在客户端 hydrate 后检测语言
export function useI18n() {
  const store = useI18nStore();

  useEffect(() => {
    if (!store._hydrated) {
      store._hydrate();
    }
  }, [store._hydrated, store._hydrate]);

  return store;
}
