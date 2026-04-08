'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { locales, type LocaleKey, type Translations } from '@/locales';

// 支持的语言列表
// Twemoji CDN 国旗图片（Windows 不渲染 emoji 国旗，用图片兼容所有平台）
function twemoji(codepoint: string) {
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${codepoint}.svg`;
}

export const SUPPORTED_LOCALES: { key: LocaleKey; label: string; flag: string; code: string }[] = [
  { key: 'zh-CN', label: '简体中文', flag: twemoji('1f1e8-1f1f3'), code: 'CN' },
  { key: 'zh-TW', label: '繁體中文', flag: twemoji('1f1f9-1f1fc'), code: 'TW' },
  { key: 'en', label: 'English', flag: twemoji('1f1fa-1f1f8'), code: 'US' },
  { key: 'ja', label: '日本語', flag: twemoji('1f1ef-1f1f5'), code: 'JP' },
  { key: 'ko', label: '한국어', flag: twemoji('1f1f0-1f1f7'), code: 'KR' },
  { key: 'ms', label: 'Bahasa Melayu', flag: twemoji('1f1f2-1f1fe'), code: 'MY' },
  { key: 'th', label: 'ภาษาไทย', flag: twemoji('1f1f9-1f1ed'), code: 'TH' },
  { key: 'es', label: 'Español', flag: twemoji('1f1ea-1f1f8'), code: 'ES' },
  { key: 'fr', label: 'Français', flag: twemoji('1f1eb-1f1f7'), code: 'FR' },
  { key: 'de', label: 'Deutsch', flag: twemoji('1f1e9-1f1ea'), code: 'DE' },
  { key: 'ru', label: 'Русский', flag: twemoji('1f1f7-1f1fa'), code: 'RU' },
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
