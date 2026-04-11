import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { I18nProvider } from '@/components/providers/I18nProvider';
import ChatWidget from '@/components/ChatWidget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://anytokens.net'),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
  title: {
    default: 'Anytokens - One API, All AI Models | AI API Gateway',
    template: '%s | Anytokens',
  },
  description: 'Anytokens is a unified AI API gateway supporting 80+ models including GPT-4, Claude, Gemini, DeepSeek with OpenAI-compatible format. One API key for all AI models. Pay-as-you-go pricing.',
  keywords: [
    'AI API gateway', 'OpenAI alternative', 'DeepSeek API', 'Claude API',
    'Gemini API', 'unified AI API', 'AI API proxy', 'LLM API',
    'OpenAI compatible', 'AI model aggregator', 'cheap AI API',
    'AI API for developers', 'Southeast Asia AI API', 'API聚合',
    'AI接口', 'DeepSeek接口', 'OpenAI代理'
  ],
  authors: [{ name: 'Anytokens', url: 'https://anytokens.net' }],
  creator: 'Anytokens',
  publisher: 'Anytokens',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['zh_CN', 'zh_TW', 'ms_MY', 'ja_JP', 'ko_KR'],
    url: 'https://anytokens.net',
    siteName: 'Anytokens',
    title: 'Anytokens - One API, All AI Models',
    description: 'Unified AI API gateway supporting 80+ models. OpenAI-compatible format. GPT-4, Claude, Gemini, DeepSeek and more. Pay-as-you-go, no subscription.',
    images: [
      {
        url: '/og-image.png?v=2',
        width: 1200,
        height: 630,
        alt: 'Anytokens - One API, All AI Models',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@anytokens',
    creator: '@anytokens',
    title: 'Anytokens - One API, All AI Models',
    description: 'Unified AI API gateway. 80+ models. OpenAI-compatible. GPT-4, Claude, Gemini, DeepSeek.',
    images: ['/og-image.png?v=2'],
  },
  alternates: {
    canonical: 'https://anytokens.net',
  },
};

// 防止主题闪烁的内联脚本（在 React 水合前执行）
const themeScript = `(function(){try{var t=localStorage.getItem('anytokens-theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            <I18nProvider>{children}</I18nProvider>
            <ChatWidget />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
