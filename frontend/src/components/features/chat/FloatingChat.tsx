'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Brain, Sparkles } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api-utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// Typing indicator (three pulsing dots)
// ---------------------------------------------------------------------------

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3">
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-indigo-400"
          style={{
            animation: 'pulse 1.4s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
    <span className="text-xs text-slate-400 ml-1.5">Thinking...</span>
  </div>
);

// ---------------------------------------------------------------------------
// Single message bubble
// ---------------------------------------------------------------------------

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={[
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-indigo-500 text-white rounded-br-md'
            : 'bg-slate-100 text-slate-700 rounded-bl-md border border-slate-200/60',
        ].join(' ')}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const FloatingChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const query = input.trim();
      if (!query || isLoading) return;

      // Add user message
      const userMsg: ChatMessage = {
        role: 'user',
        content: query,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      try {
        const res = await fetchWithAuth('/chat/ask', {
          method: 'POST',
          body: JSON.stringify({ query }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        const aiMsg: ChatMessage = {
          role: 'ai',
          content: data.answer || 'Sorry, I could not generate a response.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        console.error('Chat error:', err);
        const errorMsg: ChatMessage = {
          role: 'ai',
          content: 'Something went wrong. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading],
  );

  return (
    <>
      {/* ---- Floating Action Button ---- */}
      {!isOpen && (
        <button
          id="floating-chat-toggle"
          onClick={() => setIsOpen(true)}
          className={[
            'fixed bottom-6 right-6 z-[9990]',
            'w-14 h-14 rounded-full',
            'bg-gradient-to-tr from-indigo-500 to-purple-500',
            'text-white shadow-xl shadow-indigo-500/30',
            'flex items-center justify-center',
            'hover:scale-110 active:scale-95 transition-all duration-200',
            'hover:shadow-2xl hover:shadow-indigo-500/40',
          ].join(' ')}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* ---- Chat Panel ---- */}
      {isOpen && (
        <div
          className={[
            'fixed bottom-6 right-6 z-[9990]',
            'w-[380px] h-[560px]',
            'rounded-2xl overflow-hidden',
            'border border-slate-200/60',
            'bg-white/90 backdrop-blur-xl',
            'shadow-2xl shadow-slate-400/20',
            'flex flex-col',
            'animate-in fade-in slide-in-from-bottom-4 duration-300',
          ].join(' ')}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Brain className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Second Brain</h3>
                <p className="text-[11px] text-slate-400">Ask about your notes</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Your Second Brain is ready
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                    Ask me anything about your notes and I&apos;ll find the answer.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
            ))}

            {isLoading && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <form
            onSubmit={handleSubmit}
            className="px-4 py-3 border-t border-slate-100 bg-white/80"
          >
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200/60 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your notes..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={[
                  'p-1.5 rounded-lg transition-all',
                  input.trim() && !isLoading
                    ? 'text-indigo-500 hover:bg-indigo-50'
                    : 'text-slate-300 cursor-not-allowed',
                ].join(' ')}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Keyframe for pulsing dots */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
};

export default FloatingChat;
