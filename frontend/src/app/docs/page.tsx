'use client';

import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { useI18n } from '@/lib/i18n';
import { Copy, Check, BookOpen, Key, Box, MessageSquare, Radio, AlertTriangle, DollarSign, HelpCircle } from 'lucide-react';

// 代码块组件（含复制按钮）
function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
        <span className="text-xs text-muted-foreground">{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-500" />
              {t.docs_copied}
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              {t.docs_copy}
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="text-muted-foreground">{code}</code>
      </pre>
    </div>
  );
}

// 文档章节
type SectionKey = 'quickstart' | 'auth' | 'models' | 'chat' | 'streaming' | 'errors' | 'billing' | 'faq';

const SECTIONS: { key: SectionKey; icon: React.ElementType }[] = [
  { key: 'quickstart', icon: BookOpen },
  { key: 'auth', icon: Key },
  { key: 'models', icon: Box },
  { key: 'chat', icon: MessageSquare },
  { key: 'streaming', icon: Radio },
  { key: 'errors', icon: AlertTriangle },
  { key: 'billing', icon: DollarSign },
  { key: 'faq', icon: HelpCircle },
];

function getSectionLabel(key: SectionKey, t: any): string {
  const map: Record<SectionKey, string> = {
    quickstart: t.docs_quickstart,
    auth: t.docs_auth,
    models: t.docs_models,
    chat: t.docs_chat,
    streaming: t.docs_streaming,
    errors: t.docs_errors,
    billing: t.docs_billing_doc,
    faq: t.docs_faq,
  };
  return map[key];
}

// 代码示例常量
const BASE_URL = 'https://api.anytokens.net/v1';

const CODE_CURL_BASIC = `curl ${BASE_URL}/chat/completions \\
  -H "Authorization: Bearer sk-any-..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-v3",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`;

const CODE_PYTHON = `from openai import OpenAI

client = OpenAI(
    base_url="${BASE_URL}",
    api_key="sk-any-...",
)

response = client.chat.completions.create(
    model="deepseek-v3",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response.choices[0].message.content)`;

const CODE_JS = `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${BASE_URL}",
  apiKey: "sk-any-...",
});

const response = await client.chat.completions.create({
  model: "deepseek-v3",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(response.choices[0].message.content);`;

const CODE_STREAM_PYTHON = `from openai import OpenAI

client = OpenAI(
    base_url="${BASE_URL}",
    api_key="sk-any-...",
)

stream = client.chat.completions.create(
    model="deepseek-v3",
    messages=[{"role": "user", "content": "Hello!"}],
    stream=True,
)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")`;

const CODE_STREAM_JS = `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${BASE_URL}",
  apiKey: "sk-any-...",
});

const stream = await client.chat.completions.create({
  model: "deepseek-v3",
  messages: [{ role: "user", content: "Hello!" }],
  stream: true,
});
for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}`;

const CODE_CURL_STREAM = `curl ${BASE_URL}/chat/completions \\
  -H "Authorization: Bearer sk-any-..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-v3",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'`;

const CODE_AUTH = `# Header format
Authorization: Bearer sk-any-your-api-key`;

const FREE_MODELS = [
  { name: 'deepseek-v3', provider: 'DeepSeek' },
  { name: 'qwen2.5-7b', provider: 'Alibaba' },
  { name: 'qwen3-8b', provider: 'Alibaba' },
  { name: 'glm-4-9b', provider: 'Zhipu' },
  { name: 'deepseek-r1-7b', provider: 'DeepSeek' },
  { name: 'gemini-2.0-flash', provider: 'Google' },
];

const PAID_MODELS = [
  { name: 'deepseek-r1', provider: 'DeepSeek', price: '$0.66/M' },
  { name: 'gemini-2.5-pro', provider: 'Google', price: '$1.25/M' },
  { name: 'grok-3', provider: 'xAI', price: '$3.00/M' },
  { name: 'grok-3-mini', provider: 'xAI', price: '$0.30/M' },
  { name: 'mistral-large', provider: 'Mistral', price: '$2.00/M' },
  { name: 'llama-3.3-70b', provider: 'Meta', price: '$0.59/M' },
  { name: 'phi-4', provider: 'Microsoft', price: '$0.07/M' },
  { name: 'qwen2.5-72b', provider: 'Alibaba', price: '$0.84/M' },
];

const ERROR_RESPONSE = `{
  "code": 401,
  "message": "Invalid API Key",
  "data": null
}`;

export default function DocsPage() {
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState<SectionKey>('quickstart');

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <div className="flex">
        {/* 左侧导航 */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 overflow-y-auto border-r border-border/40 p-4 lg:block">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{t.docs_title}</h3>
          <nav className="space-y-1">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              return (
                <button
                  key={sec.key}
                  onClick={() => {
                    setActiveSection(sec.key);
                    document.getElementById(sec.key)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    activeSection === sec.key
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {getSectionLabel(sec.key, t)}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* 主内容 */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-4xl space-y-16 px-6 py-12">

            {/* 快速开始 */}
            <section id="quickstart">
              <h2 className="text-3xl font-bold tracking-tight">{t.docs_quickstart_title}</h2>
              <p className="mt-3 text-muted-foreground">{t.docs_quickstart_desc}</p>
              <div className="mt-6 space-y-3">
                {[t.docs_quickstart_step1, t.docs_quickstart_step2, t.docs_quickstart_step3].map((step) => (
                  <div key={step} className="rounded-lg border border-border/60 bg-card/30 px-5 py-4 text-sm">
                    {step}
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold">curl</h3>
                <CodeBlock code={CODE_CURL_BASIC} lang="bash" />
                <h3 className="text-lg font-semibold">Python</h3>
                <CodeBlock code={CODE_PYTHON} lang="python" />
                <h3 className="text-lg font-semibold">JavaScript</h3>
                <CodeBlock code={CODE_JS} lang="javascript" />
              </div>
            </section>

            {/* 认证 */}
            <section id="auth">
              <h2 className="text-3xl font-bold tracking-tight">{t.docs_auth_title}</h2>
              <p className="mt-3 text-muted-foreground">{t.docs_auth_desc}</p>
              <div className="mt-6">
                <CodeBlock code={CODE_AUTH} lang="http" />
              </div>
            </section>

            {/* 模型列表 */}
            <section id="models">
              <h2 className="text-3xl font-bold tracking-tight">{t.docs_models_title}</h2>
              <p className="mt-3 text-muted-foreground">{t.docs_models_desc}</p>

              <h3 className="mt-8 text-lg font-semibold">{t.docs_models_free}</h3>
              <div className="mt-3 rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2.5 text-left font-medium">{t.pricing_col_model}</th>
                      <th className="px-4 py-2.5 text-left font-medium">{t.pricing_col_provider}</th>
                      <th className="px-4 py-2.5 text-right font-medium">{t.pricing_col_price}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FREE_MODELS.map((m) => (
                      <tr key={m.name} className="border-b last:border-0">
                        <td className="px-4 py-2.5 font-mono text-xs">{m.name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{m.provider}</td>
                        <td className="px-4 py-2.5 text-right">
                          <Badge variant="secondary" className="text-green-600">Free</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="mt-8 text-lg font-semibold">{t.docs_models_paid}</h3>
              <div className="mt-3 rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2.5 text-left font-medium">{t.pricing_col_model}</th>
                      <th className="px-4 py-2.5 text-left font-medium">{t.pricing_col_provider}</th>
                      <th className="px-4 py-2.5 text-right font-medium">{t.pricing_col_price_per_m}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PAID_MODELS.map((m) => (
                      <tr key={m.name} className="border-b last:border-0">
                        <td className="px-4 py-2.5 font-mono text-xs">{m.name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{m.provider}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{m.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 聊天补全 */}
            <section id="chat">
              <h2 className="text-3xl font-bold tracking-tight">{t.docs_chat_title}</h2>
              <p className="mt-3 text-muted-foreground">{t.docs_chat_desc}</p>
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-border/60 bg-card/30 px-5 py-4">
                  <code className="text-sm font-medium text-primary">POST /v1/chat/completions</code>
                </div>
                <h3 className="text-lg font-semibold">curl</h3>
                <CodeBlock code={CODE_CURL_BASIC} lang="bash" />
                <h3 className="text-lg font-semibold">Python</h3>
                <CodeBlock code={CODE_PYTHON} lang="python" />
                <h3 className="text-lg font-semibold">JavaScript</h3>
                <CodeBlock code={CODE_JS} lang="javascript" />
              </div>
            </section>

            {/* 流式响应 */}
            <section id="streaming">
              <h2 className="text-3xl font-bold tracking-tight">{t.docs_streaming_title}</h2>
              <p className="mt-3 text-muted-foreground">{t.docs_streaming_desc}</p>
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold">curl</h3>
                <CodeBlock code={CODE_CURL_STREAM} lang="bash" />
                <h3 className="text-lg font-semibold">Python</h3>
                <CodeBlock code={CODE_STREAM_PYTHON} lang="python" />
                <h3 className="text-lg font-semibold">JavaScript</h3>
                <CodeBlock code={CODE_STREAM_JS} lang="javascript" />
              </div>
            </section>

            {/* 错误处理 */}
            <section id="errors">
              <h2 className="text-3xl font-bold tracking-tight">{t.docs_errors_title}</h2>
              <p className="mt-3 text-muted-foreground">{t.docs_errors_desc}</p>
              <div className="mt-6">
                <CodeBlock code={ERROR_RESPONSE} lang="json" />
              </div>
              <div className="mt-6 rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2.5 text-left font-medium">Code</th>
                      <th className="px-4 py-2.5 text-left font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b"><td className="px-4 py-2.5 font-mono">400</td><td className="px-4 py-2.5 text-muted-foreground">{t.docs_error_400}</td></tr>
                    <tr className="border-b"><td className="px-4 py-2.5 font-mono">401</td><td className="px-4 py-2.5 text-muted-foreground">{t.docs_error_401}</td></tr>
                    <tr className="border-b"><td className="px-4 py-2.5 font-mono">429</td><td className="px-4 py-2.5 text-muted-foreground">{t.docs_error_429}</td></tr>
                    <tr><td className="px-4 py-2.5 font-mono">500</td><td className="px-4 py-2.5 text-muted-foreground">{t.docs_error_500}</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 计费 */}
            <section id="billing">
              <h2 className="text-3xl font-bold tracking-tight">{t.docs_billing_title}</h2>
              <p className="mt-3 text-muted-foreground">{t.docs_billing_desc}</p>
            </section>

            {/* FAQ */}
            <section id="faq">
              <h2 className="text-3xl font-bold tracking-tight">{t.docs_faq_title}</h2>
              <div className="mt-6 space-y-4">
                {[
                  { q: t.docs_faq_q1, a: t.docs_faq_a1 },
                  { q: t.docs_faq_q2, a: t.docs_faq_a2 },
                  { q: t.docs_faq_q3, a: t.docs_faq_a3 },
                  { q: t.docs_faq_q4, a: t.docs_faq_a4 },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg border border-border/60 p-5">
                    <h4 className="font-semibold">{item.q}</h4>
                    <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
