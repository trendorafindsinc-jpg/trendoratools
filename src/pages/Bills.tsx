import { useMemo, useState } from 'react';
import { useAppStore } from '../store';
import { Card } from '../components/Card';
import { formatMoney, todayISO, isOverdue, isDueSoon, upcomingBills } from '../lib/utils';
import { Trash2, Check, RotateCcw } from 'lucide-react';

export default function Bills() {
  const { bills, addBill, deleteBill, markBillPaid, markBillUnpaid } = useAppStore();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(todayISO());
  const [recurring, setRecurring] = useState(true);

  const unpaid = useMemo(() => upcomingBills(bills), [bills]);
  const unpaidTotal = unpaid.reduce((s, b) => s + b.amount, 0);

  const urgency = (due: string, paid: boolean) => {
    if (paid) return 'text-slate-500';
    if (isOverdue(due)) return 'text-rose-400';
    if (isDueSoon(due)) return 'text-amber-400';
    return 'text-slate-300';
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    addBill({ name, amount, dueDate, recurring });
    setName('');
    setAmount('');
  };

  return (
    <div className="space-y-6 animate-fade-in scroll-pad-nav lg:pb-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-brand">Bills</h1>
        <p className="text-slate-400 mt-1 text-sm">Due dates, paid status, recurring flags.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass-primary p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Unpaid</div>
          <div className="text-xl font-bold tabular-nums mt-1">{unpaid.length}</div>
        </div>
        <div className="glass-primary p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Total due</div>
          <div className="text-xl font-bold tabular-nums text-amber-400 mt-1">{formatMoney(unpaidTotal)}</div>
        </div>
      </div>

      <Card title="Add bill">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="field">
            <span className="field-label">Name</span>
            <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Rent" />
          </label>
          <label className="field">
            <span className="field-label">Amount</span>
            <input className="field-input" value={amount} onChange={(e) => setAmount(e.target.value)} required inputMode="decimal" />
          </label>
          <label className="field">
            <span className="field-label">Due date</span>
            <input className="field-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300 pt-6">
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
            Recurring
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">Add bill</button>
          </div>
        </form>
      </Card>

      <Card title="All bills">
        {bills.length === 0 ? (
          <p className="text-sm text-slate-500">No bills yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {bills
              .slice()
              .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
              .map((b) => (
                <li key={b.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className={`font-medium text-sm ${b.paid ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                      {b.name}
                    </div>
                    <div className={`text-xs ${urgency(b.dueDate, b.paid)}`}>
                      Due {b.dueDate}
                      {b.recurring ? ' · recurring' : ''}
                      {b.paid ? ' · paid' : isOverdue(b.dueDate) ? ' · overdue' : isDueSoon(b.dueDate) ? ' · due soon' : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums text-sm">{formatMoney(b.amount)}</span>
                    {b.paid ? (
                      <button type="button" className="btn-secondary text-xs py-1.5 px-2" onClick={() => markBillUnpaid(b.id)}>
                        <RotateCcw size={14} /> Unpaid
                      </button>
                    ) : (
                      <button type="button" className="btn-secondary text-xs py-1.5 px-2" onClick={() => markBillPaid(b.id)}>
                        <Check size={14} /> Paid
                      </button>
                    )}
                    <button type="button" className="text-slate-500 hover:text-rose-400 p-1" onClick={() => deleteBill(b.id)}>
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
