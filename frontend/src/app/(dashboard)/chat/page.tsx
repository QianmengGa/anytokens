'use client';

import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Send,
  Loader2,
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
  Menu,
  X,
  Paperclip,
  FileText,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '@/lib/api';

// 支持视觉/PDF 的模型
const VISION_MODELS = new Set(['gemini-1.5-pro', 'gemini-1.5-flash', 'qwen2.5-72b', 'llama-3.3-70b']);
const PDF_MODELS = new Set(['gemini-1.5-pro', 'gemini-1.5-flash']);

// 附件信息
interface Attachment {
  type: 'image' | 'pdf';
  mimeType: string;
  base64: string;
  filename: string;
  size: number;
}

// 可用模型列表
const AVAILABLE_MODELS = [
  { value: 'deepseek-v3', label: 'DeepSeek V3', free: true },
  { value: 'deepseek-r1', label: 'DeepSeek R1' },
  { value: 'qwen2.5-72b', label: 'Qwen 2.5 72B' },
  { value: 'qwen2.5-7b', label: 'Qwen 2.5 7B', free: true },
  { value: 'qwen3-8b', label: 'Qwen 3 8B', free: true },
  { value: 'qwen3-32b', label: 'Qwen 3 32B', free: true },
  { value: 'qwen2.5-coder-32b', label: 'Qwen 2.5 Coder 32B', free: true },
  { value: 'llama-3.3-70b', label: 'Llama 3.3 70B', free: true },
  { value: 'llama-3.1-8b', label: 'Llama 3.1 8B', free: true },
  { value: 'glm-4-9b', label: 'GLM-4 9B', free: true },
  { value: 'deepseek-r1-7b', label: 'DeepSeek R1 7B', free: true },
  { value: 'mistral-7b', label: 'Mistral 7B', free: true },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'llama3-70b', label: 'Llama3 70B (Groq)' },
  { value: 'mixtral-8x7b', label: 'Mixtral 8x7B' },
  { value: 'yi-lightning', label: 'Yi Lightning' },
];

interface Conversation {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: string | null;
}

interface Message {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  inputTokens: number | null;
  outputTokens: number | null;
  cost: number | null;
  createdAt: string;
}

// 格式化时间
function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export default function ChatPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken as string | undefined;

  // 对话列表
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');

  // 重命名弹窗
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // 移动端侧边栏
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 流式回复内容
  const [streamContent, setStreamContent] = useState('');

  // 文件附件
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 当前对话
  const activeConversation = conversations.find((c) => c.id === activeId) || null;
  const currentModel = activeConversation?.model || 'deepseek-v3';
  const supportsVision = VISION_MODELS.has(currentModel);

  // 文件上传处理
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 重置 input 以允许重复选择同一文件
    e.target.value = '';

    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAttachment(res.data.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || '上传失败';
      setUploadError(msg);
      setTimeout(() => setUploadError(''), 3000);
    } finally {
      setUploading(false);
    }
  }, []);

  // 切换模型时清除不兼容的附件
  const clearAttachmentIfNeeded = useCallback((model: string) => {
    if (!VISION_MODELS.has(model)) {
      setAttachment(null);
    } else if (attachment?.type === 'pdf' && !PDF_MODELS.has(model)) {
      setAttachment(null);
    }
  }, [attachment?.type]);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamContent, scrollToBottom]);

  // 加载对话列表
  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get('/conversations');
      const list: Conversation[] = res.data.data || [];
      setConversations(list);
      return list;
    } catch {
      return [];
    } finally {
      setListLoading(false);
    }
  }, []);

  // 加载消息
  const loadMessages = useCallback(async (convId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/conversations/${convId}`);
      setMessages(res.data.data?.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化：加载对话列表，无对话则自动创建
  useEffect(() => {
    if (!token) return;
    (async () => {
      const list = await loadConversations();
      if (list.length > 0) {
        setActiveId(list[0].id);
        await loadMessages(list[0].id);
      } else {
        // 自动创建新对话
        try {
          const res = await api.post('/conversations', {});
          const conv: Conversation = { ...res.data.data, lastMessage: null };
          setConversations([conv]);
          setActiveId(conv.id);
          setMessages([]);
        } catch { /* ignore */ }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // 切换对话
  const switchConversation = useCallback(async (convId: string) => {
    setActiveId(convId);
    setSidebarOpen(false);
    await loadMessages(convId);
  }, [loadMessages]);

  // 新建对话
  const createConversation = useCallback(async () => {
    try {
      const res = await api.post('/conversations', {});
      const conv: Conversation = { ...res.data.data, lastMessage: null };
      setConversations((prev) => [conv, ...prev]);
      setActiveId(conv.id);
      setMessages([]);
      setSidebarOpen(false);
    } catch { /* ignore */ }
  }, []);

  // 删除对话
  const deleteConversation = useCallback(async (convId: string) => {
    try {
      await api.delete(`/conversations/${convId}`);
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== convId);
        if (activeId === convId) {
          if (next.length > 0) {
            setActiveId(next[0].id);
            loadMessages(next[0].id);
          } else {
            setActiveId(null);
            setMessages([]);
          }
        }
        return next;
      });
    } catch { /* ignore */ }
  }, [activeId, loadMessages]);

  // 重命名对话
  const submitRename = useCallback(async () => {
    if (!renameId || !renameValue.trim()) return;
    try {
      await api.patch(`/conversations/${renameId}`, { title: renameValue.trim() });
      setConversations((prev) =>
        prev.map((c) => (c.id === renameId ? { ...c, title: renameValue.trim() } : c)),
      );
    } catch { /* ignore */ }
    setRenameOpen(false);
  }, [renameId, renameValue]);

  // 切换模型
  const changeModel = useCallback(async (model: string) => {
    if (!activeId) return;
    clearAttachmentIfNeeded(model);
    try {
      await api.patch(`/conversations/${activeId}`, { model });
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, model } : c)),
      );
    } catch { /* ignore */ }
  }, [activeId, clearAttachmentIfNeeded]);

  // 发送消息（流式）
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !activeId || !token || sending) return;

    const userContent = inputText.trim();
    const currentAttachment = attachment;
    setInputText('');
    setAttachment(null);
    setSending(true);
    setStreamContent('');

    // 显示给用户的消息文本（含附件提示）
    const displayContent = currentAttachment
      ? (currentAttachment.type === 'pdf'
          ? `[附件: ${currentAttachment.filename}]\n\n${userContent}`
          : `[图片: ${currentAttachment.filename}]\n\n${userContent}`)
      : userContent;

    // 乐观添加用户消息
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: activeId,
      role: 'user',
      content: displayContent,
      inputTokens: null,
      outputTokens: null,
      cost: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // 如果是第一条消息，自动更新对话标题
    const isFirst = messages.length === 0;
    if (isFirst) {
      const autoTitle = userContent.substring(0, 20) + (userContent.length > 20 ? '...' : '');
      api.patch(`/conversations/${activeId}`, { title: autoTitle }).catch(() => {});
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, title: autoTitle } : c)),
      );
    }

    // 构建发送给 API 的用户消息 content
    let apiUserContent: any = userContent;
    if (currentAttachment) {
      if (currentAttachment.type === 'image') {
        // 图片：多模态数组格式
        apiUserContent = [
          { type: 'image_url', image_url: { url: `data:${currentAttachment.mimeType};base64,${currentAttachment.base64}` } },
          { type: 'text', text: userContent },
        ];
      } else {
        // PDF：作为 image_url 发送（Gemini 支持）+ 文字提示
        apiUserContent = [
          { type: 'image_url', image_url: { url: `data:${currentAttachment.mimeType};base64,${currentAttachment.base64}` } },
          { type: 'text', text: `[附件: ${currentAttachment.filename}]\n\n${userContent}` },
        ];
      }
    }

    // 构建发送的消息历史
    const sendMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: apiUserContent },
    ];

    let fullResponse = '';

    try {
      // 流式请求
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1') + '/chat/completions';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: currentModel,
          messages: sendMessages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || errData?.error?.message || `请求失败 (${response.status})`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullResponse += delta;
                setStreamContent(fullResponse);
              }
            } catch { /* 忽略解析错误 */ }
          }
        }
      }

      // 保存到数据库（只保存文字，不保存 base64）
      const convId = activeId;
      const dbUserContent = currentAttachment
        ? (currentAttachment.type === 'pdf'
            ? `[附件: ${currentAttachment.filename}]\n\n${userContent}`
            : `[图片: ${currentAttachment.filename}]\n\n${userContent}`)
        : userContent;

      await Promise.all([
        api.post(`/conversations/${convId}/messages`, {
          role: 'user',
          content: dbUserContent,
        }),
        api.post(`/conversations/${convId}/messages`, {
          role: 'assistant',
          content: fullResponse,
        }),
      ]);

      // 更新本地消息列表
      setStreamContent('');
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== userMsg.id);
        return [
          ...withoutTemp,
          { ...userMsg, id: `saved-user-${Date.now()}` },
          {
            id: `saved-ai-${Date.now()}`,
            conversationId: convId,
            role: 'assistant',
            content: fullResponse,
            inputTokens: null,
            outputTokens: null,
            cost: null,
            createdAt: new Date().toISOString(),
          },
        ];
      });

      // 更新对话列表中的预览
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? { ...c, lastMessage: fullResponse.substring(0, 50), updatedAt: new Date().toISOString() }
            : c,
        ),
      );
    } catch (err: any) {
      const errorContent = `⚠️ ${err.message || '发送失败，请重试'}`;
      setStreamContent('');
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          conversationId: activeId,
          role: 'assistant',
          content: errorContent,
          inputTokens: null,
          outputTokens: null,
          cost: null,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [inputText, activeId, token, sending, messages, currentModel, attachment]);

  // 键盘事件：Enter 发送，Shift+Enter 换行
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full -m-6 overflow-hidden">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 左侧对话列表 */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-[260px] flex-shrink-0 border-r bg-muted/30 flex flex-col
          transition-transform duration-200 md:relative md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* 新建对话按钮 */}
        <div className="flex items-center gap-2 p-3 border-b">
          <Button onClick={createConversation} className="flex-1 gap-2" size="sm">
            <Plus className="h-4 w-4" />
            新建对话
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 对话列表 */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {listLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">暂无对话</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`
                    group flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors
                    ${activeId === conv.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted text-foreground'
                    }
                  `}
                  onClick={() => switchConversation(conv.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setRenameId(conv.id);
                    setRenameValue(conv.title);
                    setRenameOpen(true);
                  }}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.lastMessage || '暂无消息'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatTime(conv.updatedAt)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameId(conv.id);
                            setRenameValue(conv.title);
                            setRenameOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-2" />
                          重命名
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* 右侧聊天区域 */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* 顶部栏 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* 对话标题（可点击重命名） */}
          <h2
            className="text-sm font-semibold truncate cursor-pointer hover:text-primary transition-colors"
            onClick={() => {
              if (activeConversation) {
                setRenameId(activeConversation.id);
                setRenameValue(activeConversation.title);
                setRenameOpen(true);
              }
            }}
          >
            {activeConversation?.title || 'AI 聊天'}
          </h2>

          <div className="ml-auto flex-shrink-0">
            <Select
              value={activeConversation?.model || 'deepseek-v3'}
              onValueChange={changeModel}
            >
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}{m.free ? ' 🆓' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-auto px-4 py-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 && !streamContent ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">开始和 AI 对话吧</p>
              <p className="text-sm mt-1">输入消息，按 Enter 发送</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[80%] rounded-xl px-4 py-2.5
                      ${msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                      }
                    `}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-black/20 [&_pre]:rounded-md [&_pre]:p-3 [&_code]:text-xs [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* 流式输出中的 AI 回复 */}
              {streamContent && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-xl px-4 py-2.5 bg-muted text-foreground">
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-black/20 [&_pre]:rounded-md [&_pre]:p-3 [&_code]:text-xs [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
                      <ReactMarkdown>{streamContent}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {/* 发送中 loading */}
              {sending && !streamContent && (
                <div className="flex justify-start">
                  <div className="rounded-xl px-4 py-2.5 bg-muted">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:0ms]" />
                      <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 底部输入区域 */}
        <div className="border-t px-4 py-3">
          <div className="max-w-3xl mx-auto">
            {/* 附件预览 */}
            {attachment && (
              <div className="mb-2 flex items-center gap-2 rounded-lg border bg-muted/50 p-2">
                {attachment.type === 'image' ? (
                  <img
                    src={`data:${attachment.mimeType};base64,${attachment.base64}`}
                    alt={attachment.filename}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-red-100 dark:bg-red-900/30">
                    <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {attachment.type === 'image' ? '图片' : 'PDF'} · {(attachment.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => setAttachment(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* 上传中 / 错误提示 */}
            {uploading && (
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                上传中...
              </div>
            )}
            {uploadError && (
              <div className="mb-2 text-sm text-destructive">{uploadError}</div>
            )}

            <div className="flex gap-2 items-end">
              {/* 隐藏的文件选择器 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* 附件按钮：仅支持视觉的模型显示 */}
              {supportsVision && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 h-10 w-10"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || uploading || !activeId}
                  title="上传图片或 PDF"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              )}

              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息... (Shift+Enter 换行)"
                disabled={sending || !activeId}
                rows={1}
                className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 max-h-32 min-h-[40px]"
                style={{ height: 'auto', overflow: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                }}
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!inputText.trim() || sending || !activeId}
                className="flex-shrink-0 h-10 w-10"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 重命名对话框 */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名对话</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="输入新标题"
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              取消
            </Button>
            <Button onClick={submitRename} disabled={!renameValue.trim()}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
