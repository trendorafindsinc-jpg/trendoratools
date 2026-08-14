import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store';
import { processIntent } from '../engine';
import { isWisecraftConfigured } from '../services/wisecraft/client';
import {
  formatMoney,
  monthExpenses,
  monthIncomes,
  totalExpensesMinor,
  totalIncomeMinor,
  upcomingBills,
  totalDebtRemaining
} from '../lib/utils';
import { Sparkles, Send, Trash2, Command } from 'lucide-react';

const STARTERS = [
  'How much did I spend this month?',
  'How much did I earn?',
  'What bills are due?',
  'How much do I owe?',
  'Am I cash flow positive this month?',
  '/help'
];

const SLASH = ['/spend', '/income', '/bills', '/debt', '/budget', '/save', '/networth', '/help'];

export default function Wisecraft() {
  const {
    chat,
    addChatMessage,
    clearChat,
    expenses,
    incomes,
    bills,
    debts,
    savingsGoals
  } = useAppStore();
  const [input, setInput] = useState('');
  const [showSlash, setShowSlash] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const configured = isWisecraftConfigured();

  const stats = useMemo(() => {
    const spent = totalExpensesMinor(monthExpenses(expenses));
    const earned = totalIncomeMinor(monthIncomes(incomes));
    const unpaid = upcomingBills(bills);
    const debt = totalDebtRemaining(debts);
    return { spent, earned, unpaidCount: unpaid.length, debt };
  }, [expenses, incomes, bills, debts]);

  useEffect(() => {
    if (chat.length === 0) {
      addChatMessage(
        'assistant',
        'WISECRAFT online — deterministic routing only. Ask about spending, income, bills, debt, budgets, or savings. Type /help or / for shortcuts. I don’t invent numbers.'
      );
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const send = useCallback(
    (text?: string) => {
      const value = (text ?? input).trim();
      if (!value) return;
      addChatMessage('user', value);
      setInput('');
      setShowSlash(false);
      const reply = processIntent(value);
      setTimeout(() => addChatMessage('assistant', reply), 160);
    },
    [input, addChatMessage]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const onChange = (v: string) => {
    setInput(v);
    setShowSlash(v.trim() === '/' || (v.startsWith('/') && !v.includes(' ')));
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] min-h-0 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-brand flex items-center gap-2">
            <Sparkles className="text-violet-300" size={26} />
            WISECRAFT
          </h1>
          <p className="text-slate-500 text-xs mt-1">Grok-style workspace · rule-based · exact math</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2.5 py-1 rounded-full glass-card text-slate-400">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                configured ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            {configured ? 'Remote' : 'Local'}
          </span>
          <button
            type="button"
            onClick={() => clearChat()}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5"
            title="Clear conversation"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 shrink-0">
        {[
          { label: 'Spent', value: formatMoney(stats.spent), q: 'How much did I spend this month?' },
          { label: 'Income', value: formatMoney(stats.earned), q: 'How much did I earn?' },
          { label: 'Unpaid bills', value: String(stats.unpaidCount), q: 'What bills are due?' },
          { label: 'Debt', value: formatMoney(stats.debt), q: 'How much do I owe?' }
        ].map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => send(s.q)}
            className="glass-card p-2.5 text-left hover:bg-white/10 transition"
          >
            <div className="text-[10px] uppercase tracking-wider text-slate-500">{s.label}</div>
            <div className="text-sm font-semibold tabular-nums text-slate-100 truncate">{s.value}</div>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
        {chat.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-violet-600 text-white rounded-br-md'
                  : 'glass-primary text-slate-200 rounded-bl-md border border-white/5'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="text-[10px] uppercase tracking-widest text-violet-300/80 mb-1.5">
                  Deterministic
                </div>
              )}
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Starters */}
      {chat.length <= 1 && (
        <div className="flex flex-wrap gap-2 py-3 shrink-0">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="text-xs px-3 py-1.5 rounded-full glass-card text-slate-300 hover:bg-white/10 transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="relative shrink-0 pt-2 pb-1">
        {showSlash && (
          <div className="absolute bottom-full left-0 right-0 mb-2 glass-primary p-2 flex flex-wrap gap-1.5 border border-white/10">
            <div className="w-full text-[10px] text-slate-500 px-1 mb-1 flex items-center gap-1">
              <Command size={10} /> Slash commands
            </div>
            {SLASH.map((c) => (
              <button
                key={c}
                type="button"
                className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-violet-200"
                onClick={() => {
                  setInput(c + ' ');
                  setShowSlash(false);
                  taRef.current?.focus();
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="glass-primary p-2 flex gap-2 items-end border border-white/10"
        >
          <textarea
            ref={taRef}
            rows={1}
            className="flex-1 bg-transparent resize-none field-input border-0 focus:ring-0 min-h-[44px] max-h-32 py-3"
            placeholder="Ask anything financial… or type /"
            value={input}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button type="submit" className="btn-primary px-3 mb-0.5" aria-label="Send">
            <Send size={18} />
          </button>
        </form>
        <p className="text-[10px] text-slate-600 mt-1.5 text-center">
          Enter to send · Shift+Enter for newline · Not an AI chatbot
        </p>
      </div>
    </div>
  );
}
