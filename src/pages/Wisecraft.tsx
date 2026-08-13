import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { processIntent } from '../engine';
import { isWisecraftConfigured } from '../services/wisecraft/client';
import { Sparkles, Send, Shield, Cpu } from 'lucide-react';

export default function Wisecraft() {
  const { chat, addChatMessage } = useAppStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const configured = isWisecraftConfigured();

  useEffect(() => {
    if (chat.length === 0) {
      addChatMessage(
        'assistant',
        'WISECRAFT workspace is ready. I route with deterministic rules — spending totals, budget remaining, quick goals, and expense logging. I am not an AI chatbot.'
      );
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const send = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    addChatMessage('user', text);
    setInput('');
    const reply = processIntent(text);
    setTimeout(() => addChatMessage('assistant', reply), 180);
  };

  const suggestions = [
    'How much did I spend this month?',
    'Add expense 2000 transport',
    'I want to save 500000',
    'How much is left in my food budget?'
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-brand flex items-center gap-2">
            <Sparkles className="text-violet-300" size={28} />
            WISECRAFT
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Conversational workspace — deterministic routing, local math.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full glass-card text-slate-400">
          <span
            className={`w-2 h-2 rounded-full ${
              configured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
            }`}
          />
          {configured ? 'Remote configured' : 'Local deterministic'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-3 flex items-center gap-2 text-xs text-slate-400">
          <Shield size={14} className="text-emerald-400 shrink-0" />
          Privacy-first · no keys in client
        </div>
        <div className="glass-card p-3 flex items-center gap-2 text-xs text-slate-400">
          <Cpu size={14} className="text-violet-300 shrink-0" />
          Exact minor-unit arithmetic
        </div>
      </div>

      <div className="glass-primary flex flex-col h-[min(58vh,520px)] p-4">
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {chat.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-violet-600 text-white rounded-br-md'
                    : 'bg-white/5 text-slate-200 border border-white/5 rounded-bl-md'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="mt-4 flex gap-2">
          <input
            className="field-input flex-1"
            placeholder="e.g. add expense 1500 food"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn-primary px-3" aria-label="Send">
            <Send size={18} />
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setInput(s)}
            className="text-xs px-3 py-1.5 rounded-full glass-card text-slate-300 hover:bg-white/10 transition"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
