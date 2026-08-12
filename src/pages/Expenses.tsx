import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store';
import { Card } from '../components/Card';
import { CATEGORIES, type Category } from '../types';
import { formatMoney, todayISO } from '../lib/utils';
import { Trash2 } from 'lucide-react';

export default function Expenses() {
  const { expenses, addExpense, deleteExpense } = useAppStore();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (filterCat !== 'all' && e.category !== filterCat) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.category.toLowerCase().includes(q) ||
          (e.note || '').toLowerCase().includes(q) ||
          e.date.includes(q)
        );
      }
      return true;
    });
  }, [expenses, search, filterCat]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    addExpense({ amount, category, date, note });
    setAmount('');
    setNote('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Expense Tracker</h1>
        <p className="text-slate-400 mt-1 text-sm">Record and filter spending. Amounts stored as minor units.</p>
      </div>

      <Card title="Add expense">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <label className="field">
            <span className="field-label">Amount</span>
            <input
              className="field-input"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 2500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Category</span>
            <select className="field-input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Date</span>
            <input className="field-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Note</span>
            <input className="field-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
          </label>
          <div className="field flex items-end">
            <button type="submit" className="btn-primary w-full">Add</button>
          </div>
        </form>
      </Card>

      <Card
        title="All expenses"
        action={
          <div className="flex flex-wrap gap-2">
            <input
              className="field-input text-sm py-1.5 min-h-0 w-36"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="field-input text-sm py-1.5 min-h-0"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400">No expenses match your filters.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {filtered.map((e) => (
              <li key={e.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm">{e.category}</div>
                  <div className="text-xs text-slate-400 truncate">
                    {e.date}{e.note ? ` · ${e.note}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold tabular-nums text-sm">{formatMoney(e.amount)}</span>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-rose-600 p-1"
                    onClick={() => deleteExpense(e.id)}
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
