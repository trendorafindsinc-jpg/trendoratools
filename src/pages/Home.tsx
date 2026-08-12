import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { processIntent } from '../engine';
import { Card } from '../components/Card';
import { Send } from 'lucide-react';

export default function Home() {
  const { chat, addChatMessage } = useAppStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat.length === 0) {
      addChatMessage(
        'assistant',
        'Hello. I am the TrendoraTools assistant. I use built-in rules to route your request to Budget, Expenses, Savings, or your Dashboard. I am not an AI chatbot.'
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
    setTimeout(() => addChatMessage('assistant', reply), 200);
  };

  const suggestions = [
    'How much did I spend this month?',
    'Add expense 2000 transport',
    'I want to save 500000',
    'How much is left in my food budget?'
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Conversational Home</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Deterministic routing — not an AI. Ask about spending, budgets, or savings.
        </p>
      </div>

      <Card className="flex flex-col h-[min(60vh,480px)]">
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {chat.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-500 text-white rounded-br-md'
                    : 'bg-white/10 text-slate-800 rounded-bl-md'
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
      </Card>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setInput(s);
            }}
            className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-slate-700 hover:bg-slate-200 transition"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
