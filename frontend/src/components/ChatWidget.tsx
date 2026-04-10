'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type Lang = 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko' | 'ms' | 'th' | 'es' | 'fr' | 'de' | 'ru';

const T: Record<string, Record<string, string>> = {
  'zh-CN': {
    title: 'AI 客服',
    subtitle: '通常几秒内回复',
    placeholder: '输入你的问题...',
    send: '发送',
    welcome: '你好！我是 Anytokens AI 客服助手 👋\n\n我可以帮你解答关于平台使用、API 接入、模型选择、充值支付等问题。有什么可以帮你的吗？',
    error: '抱歉，服务暂时不可用，请稍后再试或联系 support@anytokens.net',
  },
  'zh-TW': {
    title: 'AI 客服',
    subtitle: '通常幾秒內回覆',
    placeholder: '輸入你的問題...',
    send: '發送',
    welcome: '你好！我是 Anytokens AI 客服助手 👋\n\n我可以幫你解答關於平台使用、API 接入、模型選擇、充值付款等問題。有什麼可以幫你的嗎？',
    error: '抱歉，服務暫時不可用，請稍後再試或聯絡 support@anytokens.net',
  },
  en: {
    title: 'AI Support',
    subtitle: 'Usually replies in seconds',
    placeholder: 'Type your question...',
    send: 'Send',
    welcome: "Hi! I'm the Anytokens AI support assistant 👋\n\nI can help with platform usage, API integration, model selection, billing, and more. How can I help you?",
    error: 'Sorry, service is temporarily unavailable. Please try again or contact support@anytokens.net',
  },
  ja: {
    title: 'AIサポート',
    subtitle: '通常数秒以内に返信',
    placeholder: '質問を入力してください...',
    send: '送信',
    welcome: 'こんにちは！Anytokens AIサポートです 👋\n\nプラットフォームの使い方、API連携、モデル選択、お支払いについてお手伝いします。',
    error: '申し訳ありません。後でもう一度お試しいただくか、support@anytokens.netまでご連絡ください。',
  },
  ko: {
    title: 'AI 고객지원',
    subtitle: '보통 몇 초 내에 답변',
    placeholder: '질문을 입력하세요...',
    send: '전송',
    welcome: '안녕하세요! Anytokens AI 고객지원입니다 👋\n\n플랫폼 사용, API 연동, 모델 선택, 결제 등에 대해 도움을 드릴 수 있습니다.',
    error: '죄송합니다. 잠시 후 다시 시도하거나 support@anytokens.net으로 문의해 주세요.',
  },
  ms: {
    title: 'Sokongan AI',
    subtitle: 'Biasanya membalas dalam beberapa saat',
    placeholder: 'Taip soalan anda...',
    send: 'Hantar',
    welcome: 'Hai! Saya pembantu sokongan AI Anytokens 👋\n\nSaya boleh membantu dengan penggunaan platform, integrasi API, pemilihan model dan pembayaran.',
    error: 'Maaf, perkhidmatan tidak tersedia. Sila cuba lagi atau hubungi support@anytokens.net',
  },
  th: {
    title: 'AI ซัพพอร์ต',
    subtitle: 'ปกติตอบในไม่กี่วินาที',
    placeholder: 'พิมพ์คำถามของคุณ...',
    send: 'ส่ง',
    welcome: 'สวัสดี! ฉันคือผู้ช่วย AI ของ Anytokens 👋\n\nฉันช่วยเรื่องการใช้แพลตฟอร์ม, API, โมเดล และการชำระเงินได้',
    error: 'ขออภัย บริการไม่พร้อมใช้งาน กรุณาลองใหม่หรือติดต่อ support@anytokens.net',
  },
  es: {
    title: 'Soporte AI',
    subtitle: 'Normalmente responde en segundos',
    placeholder: 'Escribe tu pregunta...',
    send: 'Enviar',
    welcome: '¡Hola! Soy el asistente de soporte AI de Anytokens 👋\n\nPuedo ayudarte con el uso de la plataforma, integración de API, selección de modelos y facturación.',
    error: 'Lo siento, servicio no disponible. Intenta de nuevo o contacta support@anytokens.net',
  },
  fr: {
    title: 'Support IA',
    subtitle: 'Répond généralement en quelques secondes',
    placeholder: 'Tapez votre question...',
    send: 'Envoyer',
    welcome: "Bonjour ! Je suis l'assistant support IA d'Anytokens 👋\n\nJe peux vous aider avec l'utilisation de la plateforme, l'intégration API, la sélection de modèles et la facturation.",
    error: 'Désolé, service indisponible. Réessayez ou contactez support@anytokens.net',
  },
  de: {
    title: 'KI-Support',
    subtitle: 'Antwortet normalerweise in Sekunden',
    placeholder: 'Geben Sie Ihre Frage ein...',
    send: 'Senden',
    welcome: 'Hallo! Ich bin der KI-Support-Assistent von Anytokens 👋\n\nIch kann bei der Plattformnutzung, API-Integration, Modellauswahl und Abrechnung helfen.',
    error: 'Entschuldigung, Service nicht verfügbar. Kontaktieren Sie support@anytokens.net',
  },
  ru: {
    title: 'AI Поддержка',
    subtitle: 'Обычно отвечает за секунды',
    placeholder: 'Введите ваш вопрос...',
    send: 'Отправить',
    welcome: 'Привет! Я ИИ-ассистент поддержки Anytokens 👋\n\nЯ могу помочь с использованием платформы, интеграцией API, выбором модели и оплатой.',
    error: 'Извините, сервис недоступен. Напишите на support@anytokens.net',
  },
};

function detectLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem('anytokens-lang');
    if (stored && T[stored]) return stored as Lang;
  } catch {}
  const b = navigator.language.toLowerCase();
  if (b.startsWith('zh-tw') || b.startsWith('zh-hk')) return 'zh-TW';
  if (b.startsWith('zh')) return 'zh-CN';
  if (b.startsWith('ja')) return 'ja';
  if (b.startsWith('ko')) return 'ko';
  if (b.startsWith('ms')) return 'ms';
  if (b.startsWith('th')) return 'th';
  if (b.startsWith('es')) return 'es';
  if (b.startsWith('fr')) return 'fr';
  if (b.startsWith('de')) return 'de';
  if (b.startsWith('ru')) return 'ru';
  return 'en';
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLang(detectLang());
    setInitialized(true);
  }, []);

  const t = T[lang] || T['en'];

  useEffect(() => {
    if (open && messages.length === 0 && initialized) {
      setMessages([{ role: 'assistant', content: t.welcome }]);
    }
  }, [open, initialized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/chat-widget/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || t.error }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: t.error }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!initialized) return null;

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-4 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: '520px', background: 'var(--cw-bg,#fff)', border: '1px solid var(--cw-bd,rgba(0,0,0,0.1))' }}
        >
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">AI</div>
              <div>
                <div className="text-white font-semibold text-sm">{t.title}</div>
                <div className="text-white/70 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  {t.subtitle}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: 'var(--cw-msg,#f9fafb)' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words"
                  style={msg.role === 'user'
                    ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderBottomRightRadius: '4px' }
                    : { background: '#fff', color: '#1f2937', borderBottomLeftRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                  {[0,150,300].map(d => (
                    <span key={d} className="w-2 h-2 rounded-full bg-indigo-400 inline-block" style={{ animation: `cwb 1s infinite ${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 py-3 flex-shrink-0 flex items-end gap-2" style={{ background: '#fff', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              rows={1}
              disabled={loading}
              className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none"
              style={{ maxHeight: '80px', background: '#f3f4f6', color: '#1f2937', border: '1.5px solid transparent', transition: 'border-color .2s' }}
              onFocus={e => (e.target.style.borderColor = '#6366f1')}
              onBlur={e => (e.target.style.borderColor = 'transparent')}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: input.trim() && !loading ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e5e7eb', color: input.trim() && !loading ? '#fff' : '#9ca3af' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
        aria-label="AI Support"
      >
        {open
          ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        }
      </button>

      <style>{`
        @keyframes cwb { 0%,100%{transform:translateY(0);opacity:.6} 50%{transform:translateY(-5px);opacity:1} }
        .dark{--cw-bg:#1e293b;--cw-bd:rgba(255,255,255,.08);--cw-msg:#0f172a}
      `}</style>
    </>
  );
}
