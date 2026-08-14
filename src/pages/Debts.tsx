import { useMemo, useState } from 'react';
import { useAppStore } from '../store';
import { Card } from '../components/Card';
import { formatMoney, totalDebtRemaining } from '../lib/utils';
import { Trash2, Minus } from 'lucide-react';

export default function Debts() {
  const { debts, addDebt, deleteDebt, recordDebtPayment } = useAppStore();
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [payId, setPayId] = useState<string | null>(null);
  const [payAmt, setPayAmt] = useState('');

  const totalRemaining = useMemo(() => totalDebtRemaining(debts), [debts]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !totalAmount) return;
    addDebt({
      name,
      totalAmount,
      remainingAmount: remainingAmount || totalAmount,
      interestRate: parseFloat(interestRate) || 0,
      minimumPayment
    });
    setName('');
    setTotalAmount('');
    setRemainingAmount('');
    setInterestRate('');
    setMinimumPayment('');
  };

  const doPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payId || !payAmt) return;
    recordDebtPayment(payId, payAmt);
    setPayId(null);
    setPayAmt('');
  };

  return (
    <div className="space-y-6 animate-fade-in scroll-pad-nav lg:pb-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-brand">Debts</h1>
        <p className="text-slate-400 mt-1 text-sm">Balances, rates, minimums, and payments.</p>
      </div>

      <div className="glass-primary p-5">
        <div className="text-xs uppercase tracking-wider text-slate-500">Total remaining</div>
        <div className="text-2xl font-bold text-rose-400 tabular-nums mt-1">{formatMoney(totalRemaining)}</div>
      </div>

      <Card title="Add debt">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="field sm:col-span-2">
            <span className="field-label">Name</span>
            <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Student loan" />
          </label>
          <label className="field">
            <span className="field-label">Original total</span>
            <input className="field-input" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required inputMode="decimal" />
          </label>
          <label className="field">
            <span className="field-label">Remaining</span>
            <input className="field-input" value={remainingAmount} onChange={(e) => setRemainingAmount(e.target.value)} inputMode="decimal" placeholder="Same as total if new" />
          </label>
          <label className="field">
            <span className="field-label">Interest rate %</span>
            <input className="field-input" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} inputMode="decimal" placeholder="12.5" />
          </label>
          <label className="field">
            <span className="field-label">Minimum payment</span>
            <input className="field-input" value={minimumPayment} onChange={(e) => setMinimumPayment(e.target.value)} inputMode="decimal" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">Add debt</button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4">
        {debts.length === 0 && <p className="text-sm text-slate-500">No debts recorded.</p>}
        {debts.map((d) => {
          const pct =
            d.totalAmount > 0
              ? Math.round(((d.totalAmount - d.remainingAmount) / d.totalAmount) * 100)
              : 0;
          return (
            <Card key={d.id}>
              <div className="flex justify-between gap-2 mb-2">
                <h3 className="font-semibold text-slate-100">{d.name}</h3>
                <button type="button" className="text-slate-500 hover:text-rose-400" onClick={() => deleteDebt(d.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500" style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <div className="flex flex-wrap justify-between gap-2 text-sm text-slate-400 mb-3">
                <span>{formatMoney(d.remainingAmount)} left · {pct}% paid down</span>
                <span>{d.interestRate}% APR · min {formatMoney(d.minimumPayment)}</span>
              </div>
              <button type="button" className="btn-secondary text-sm" onClick={() => { setPayId(d.id); setPayAmt(''); }}>
                <Minus size={14} /> Record payment
              </button>
            </Card>
          );
        })}
      </div>

      {payId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="glass-primary p-5 w-full max-w-sm space-y-3">
            <h3 className="font-semibold">Record payment</h3>
            <form onSubmit={doPay} className="space-y-3">
              <input className="field-input" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} placeholder="Amount" required inputMode="decimal" autoFocus />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Apply</button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setPayId(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
