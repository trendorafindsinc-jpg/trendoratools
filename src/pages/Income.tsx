import { useMemo, useState } from 'react';
import { useAppStore } from '../store';
import { Card } from '../components/Card';
import { formatMoney, todayISO, monthIncomes, totalIncomeMinor } from '../lib/utils';
import { Trash2 } from 'lucide-react';

export default function Income() {
  const { incomes, addIncome, deleteIncome } = useAppStore();
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState(todayISO());
  const [recurring, setRecurring] = useState(false);
  const [note, setNote] = useState('');

  const monthTotal = useMemo(() => totalIncomeMinor(monthIncomes(incomes)), [incomes]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !source.trim()) return;
    addIncome({ amount, source, date, recurring, note });
    setAmount('');
    setSource('');
    setNote('');
    setRecurring(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-brand">Income</h1>
        <p className="text-slate-400 mt-1 text-sm">Track salary and other inflows. Minor units only.</p>
      </div>

      <div className="glass-primary p-5">
        <div className="text-xs uppercase tracking-wider text-slate-500">This month</div>
        <div className="text-2xl font-bold text-emerald-400 tabular-nums mt-1">{formatMoney(monthTotal)}</div>
      </div>

      <Card title="Add income">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className="field">
            <span className="field-label">Amount</span>
            <input className="field-input" value={amount} onChange={(e) => setAmount(e.target.value)} required inputMode="decimal" placeholder="500000" />
          </label>
          <label className="field">
            <span className="field-label">Source</span>
            <input className="field-input" value={source} onChange={(e) => setSource(e.target.value)} required placeholder="Salary" />
          </label>
          <label className="field">
            <span className="field-label">Date</span>
            <input className="field-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field sm:col-span-2">
            <span className="field-label">Note</span>
            <input className="field-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300 pt-6">
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
            Recurring
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" className="btn-primary">Add income</button>
          </div>
        </form>
      </Card>

      <Card title="All income">
        {incomes.length === 0 ? (
          <p className="text-sm text-slate-500">No income entries yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {incomes.map((i) => (
              <li key={i.id} className="py-3 flex justify-between gap-3 items-center">
                <div className="min-w-0">
                  <div className="font-medium text-sm text-slate-100">{i.source}</div>
                  <div className="text-xs text-slate-500">
                    {i.date}
                    {i.recurring ? ' · recurring' : ''}
                    {i.note ? ` · ${i.note}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold tabular-nums text-emerald-400 text-sm">{formatMoney(i.amount)}</span>
                  <button type="button" className="text-slate-500 hover:text-rose-400 p-1" onClick={() => deleteIncome(i.id)} aria-label="Delete">
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
