'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Copy,
  Download,
  FileCheck,
  FileText,
  FolderOpen,
  History,
  Loader2,
  Mic,
  Paperclip,
  Pin,
  Plus,
  Scale,
  Send,
  Share2,
  Sparkles,
  Trash2,
  Volume2,
} from 'lucide-react';
import LegalResponseCard, { type LegalResponse } from '@/components/legal-response';
import Markdown from '@/components/markdown';
import SmartSuggestions from '@/components/smart-suggestions';
import GuestLimitModal from '@/components/guest-limit-modal';
import { getGuestCount, incrementGuestCount, isGuestLimitReached } from '@/lib/guest';
import { apiUrl } from '@/lib/api';

type Message =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; response?: LegalResponse }
  | { role: 'error'; content: string };

const WELCOME =
  "Hello! I am **LegalSathi AI**, your Indian Legal Intelligence assistant.\n\nAsk me any question regarding:\n- Women's Rights & POSH / Domestic Violence\n- Cyber Crime, Financial Fraud & Online Bullying\n- Rental & Tenant Disputes\n- Police Complaints (CrPC / BNSS FIRs)\n- Labour & Workplace Rights\n- Consumer Complaints & RTI Forms\n\n_This platform provides legal information for educational purposes, not official legal representation._";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME },
  ]);
  const [loading, setLoading] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [pinnedChats, setPinnedChats] = useState<string[]>([
    'Cyber Fraud Recovery Process',
    'Tenant Security Deposit Dispute',
    'POSH Workplace Complaint Steps',
  ]);
  const [recentChats, setRecentChats] = useState<
    { id: number; query: string; domain: string; timestamp: string }[]
  >([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialHandled = useRef(false);

  const loadHistory = async (token: string) => {
    try {
      const res = await fetch(apiUrl('/api/chat/history'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecentChats(Array.isArray(data) ? data.slice(0, 8) : []);
      }
    } catch {}
  };

  useEffect(() => {
    const token = localStorage.getItem('legalsathi_token');
    if (token) {
      setIsLoggedIn(true);
      loadHistory(token);
    } else {
      setGuestCount(getGuestCount());
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (initialQuery && !initialHandled.current) {
      initialHandled.current = true;
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  const updateLastAssistant = (
    updater: (m: Extract<Message, { role: 'assistant' }>) => Extract<Message, { role: 'assistant' }>
  ) => {
    setMessages((prev) => {
      const idx = prev.map((m) => m.role).lastIndexOf('assistant');
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = updater(copy[idx] as Extract<Message, { role: 'assistant' }>);
      return copy;
    });
  };

  const sendNonStreaming = async (text: string, authHeaders: Record<string, string>) => {
    const res = await fetch(apiUrl('/api/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ query: text, language: 'en' }),
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const data: LegalResponse = await res.json();
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: data.summary || 'Legal response', response: data },
    ]);
  };

  const streamChat = async (
    text: string,
    authHeaders: Record<string, string>,
    onFirstEvent: () => void
  ): Promise<boolean> => {
    const res = await fetch(apiUrl('/api/chat/stream'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ query: text, language: 'en' }),
    });
    if (!res.ok || !res.body) return false;

    onFirstEvent();

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    const partial: Partial<LegalResponse> = {};
    let buffer = '';
    let gotAnything = false;

    const flushEvent = (block: string) => {
      let event = 'message';
      let dataStr = '';
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
      }
      if (!dataStr) return;
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(dataStr);
      } catch {
        return;
      }
      Object.assign(partial, data);
      gotAnything = true;
      updateLastAssistant((m) => ({
        ...m,
        content: partial.summary || '',
        response: { ...(partial as LegalResponse) },
      }));
    };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';
      for (const block of blocks) flushEvent(block);
    }
    if (buffer.trim()) flushEvent(buffer);

    return gotAnything && !!partial.summary;
  };

  const handleSend = async (customQuery?: string) => {
    const textToSend = (customQuery || query).trim();
    if (!textToSend || loading) return;

    if (!isLoggedIn && isGuestLimitReached()) {
      setShowGuestModal(true);
      return;
    }

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    if (!isLoggedIn) {
      const updated = incrementGuestCount();
      setGuestCount(updated);
      if (updated >= 5) {
        setTimeout(() => setShowGuestModal(true), 1200);
      }
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('legalsathi_token') : null;
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      let streamed = false;
      try {
        let placeholderAdded = false;
        streamed = await streamChat(textToSend, authHeaders, () => {
          placeholderAdded = true;
          setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
        });
        if (!streamed && placeholderAdded) {
          // Stream produced nothing usable — drop the empty placeholder.
          setMessages((prev) => {
            const idx = prev.map((m) => m.role).lastIndexOf('assistant');
            if (idx !== -1 && !(prev[idx] as { response?: unknown }).response) {
              return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
            }
            return prev;
          });
        }
      } catch {
        streamed = false;
      }

      if (!streamed) {
        await sendNonStreaming(textToSend, authHeaders);
      }

      if (isLoggedIn && token) {
        loadHistory(token);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'error',
          content: `Sorry, I could not reach the LegalSathi backend. (${(err as Error).message})`,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleExportChat = () => {
    const text = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LegalSathi_Chat_Export_${Date.now()}.txt`;
    a.click();
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Left Chat History Panel (ChatGPT Style) */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 space-y-4">
        <button
          onClick={() => {
            setMessages([{ role: 'assistant', content: WELCOME }]);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Plus size={16} />
          <span>New Chat Session</span>
        </button>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          <div>
            <div className="flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <Pin size={12} /> Pinned Consultations
            </div>
            <div className="space-y-1">
              {pinnedChats.map((chat, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(chat)}
                  className="w-full text-left truncate rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  {chat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <History size={12} /> Recent History
            </div>
            <div className="space-y-1">
              {recentChats.length === 0 && (
                <p className="px-3 py-2 text-[11px] text-slate-400">
                  {isLoggedIn ? 'No saved consultations yet.' : 'Sign in to save your history.'}
                </p>
              )}
              {recentChats.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSend(item.query)}
                  className="w-full text-left truncate rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
                  title={item.query}
                >
                  {item.query}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
          <button
            onClick={handleExportChat}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition"
          >
            <Download size={14} /> Export Chat (TXT)
          </button>
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Scale size={16} />
            </span>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white">LegalSathi AI Consultation</h1>
              <p className="text-[10px] text-slate-500 font-medium">Enterprise Indian Legal Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportChat}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Download size={13} /> Export
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
        </header>

        {/* Conversation Feed */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl w-full space-y-5 px-3 py-5 sm:px-6 sm:py-6">
            {messages.map((msg, idx) => {
              if (msg.role === 'user') {
                return (
                  <div key={idx} className="flex justify-end">
                    <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-sm leading-relaxed text-white shadow-md shadow-blue-600/20">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              if (msg.role === 'error') {
                return (
                  <div key={idx} className="flex justify-start">
                    <div className="max-w-[95%] sm:max-w-[90%] rounded-2xl rounded-bl-md border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950 px-4 py-3.5 text-sm text-red-800 dark:text-red-300 shadow-xs">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              return (
                <div key={idx} className="flex justify-start">
                  <div className="max-w-[95%] sm:max-w-[90%] w-full rounded-2xl rounded-bl-md border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 px-4 py-4 sm:px-5 sm:py-5 shadow-sm">
                    {msg.response ? (
                      <LegalResponseCard response={msg.response} />
                    ) : (
                      <Markdown content={msg.content} />
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2.5 rounded-2xl rounded-bl-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5 text-sm text-slate-500 shadow-sm">
                  <Loader2 size={16} className="animate-spin text-blue-600" />
                  Analyzing query against Indian legal database...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Sticky Bottom Input Bar */}
        <div className="sticky bottom-0 border-t border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          <div className="mx-auto max-w-6xl w-full px-3 py-3 sm:px-6 sm:py-4 space-y-2.5">
            {/* Guest Progress Counter */}
            {!isLoggedIn && (
              <div className="flex items-center justify-between text-xs px-1 text-slate-500 font-semibold">
                <span className="flex items-center gap-2">
                  <span className="text-slate-600 dark:text-slate-400">Guest Limit:</span>
                  <span className="tracking-widest font-mono text-blue-600 font-bold text-sm">
                    {'●'.repeat(Math.min(guestCount, 5))}{'○'.repeat(Math.max(0, 5 - guestCount))}
                  </span>
                </span>
                <span className="text-slate-600 dark:text-slate-400 font-bold">
                  {guestCount >= 5 ? '0 of 5 free chats remaining' : `${5 - guestCount} of 5 free chats remaining`}
                </span>
              </div>
            )}

            {!query && messages.length <= 2 && !isGuestLimitReached() && (
              <SmartSuggestions
                onSelect={(suggestion) => {
                  setQuery(suggestion);
                  inputRef.current?.focus();
                }}
              />
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-blue-500 focus-within:bg-white dark:border-slate-800 dark:bg-slate-850 dark:focus-within:bg-slate-900 shadow-xs transition"
            >
              <button
                type="button"
                onClick={() => alert('Voice input activated. Speak your query...')}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-800 transition"
                title="Voice Input"
              >
                <Mic size={18} />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask any legal question (e.g., Landlord deposit dispute, POSH complaint, FIR rights)..."
                disabled={loading}
                className="flex-1 bg-transparent px-2 text-xs sm:text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-white"
              />

              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>

            <p className="text-center text-[10px] text-slate-400 dark:text-slate-500">
              LegalSathi AI provides general legal information. For official legal representation, consult a licensed advocate.
            </p>
          </div>
        </div>
      </div>

      <GuestLimitModal isOpen={showGuestModal} onClose={() => setShowGuestModal(false)} />
    </div>
  );
}
