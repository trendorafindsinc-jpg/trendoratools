import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Card } from '../components/Card';
import { formatMoney, goalProgress, defaultTargetDate, todayISO } from '../lib/utils';
import { Trash2, Plus, Minus } from 'lucide-react';

export default function Savings() {
  const { savingsGoals, addSavingsGoal, deleteSavingsGoal, fundGoal } = useAppStore();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [targetDate, setTargetDate] = useState(defaultTargetDate());
  const [fundId, setFundId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [fundDir, setFundDir] = useState<'add' | 'remove'>('add');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target) return;
    addSavingsGoal({ name, targetAmount: target, targetDate });
    setName('');
    setTarget('');
  };

  const doFund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundId || !fundAmount) return;
    fundGoal(fundId, fundAmount, fundDir);
    setFundId(null);
    setFundAmount('');
  };

  return (
    <div className="space-y-6 scroll-pad-nav lg:pb-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Savings Tracker</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Create goals and add or remove contributions.
        </p>
      </div>

      <Card title="New savings goal">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <label className="field sm:col-span-2">
            <span className="field-label">Goal name</span>
            <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Emergency fund" />
          </label>
          <label className="field">
            <span className="field-label">Target amount</span>
            <input className="field-input" type="text" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} required placeholder="500000" />
          </label>
          <label className="field">
            <span className="field-label">Target date</span>
            <input className="field-input" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </label>
          <div className="sm:col-span-4">
            <button type="submit" className="btn-primary">Create goal</button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {savingsGoals.length === 0 && (
          <p className="text-sm text-slate-400 col-span-full">No goals yet.</p>
        )}
        {savingsGoals.map((g) => {
          const pct = goalProgress(g);
          const remaining = Math.max(0, g.targetAmount - g.currentAmount);
          return (
            <Card key={g.id}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold truncate pr-2">{g.name}</h3>
                <button
                  type="button"
                  className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                  onClick={() => deleteSavingsGoal(g.id)}
                  aria-label="Delete goal"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="h-3.5 rounded-full bg-white/10 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-slate-400 mb-3">
                <span>{formatMoney(g.currentAmount)} · {pct}%</span>
                <span>{formatMoney(remaining)} left</span>
              </div>
              <div className="text-xs text-slate-400 mb-3">Target: {g.targetDate}</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary text-sm flex-1"
                  onClick={() => { setFundId(g.id); setFundDir('add'); setFundAmount(''); }}
                >
                  <Plus size={14} /> Add
                </button>
                <button
                  type="button"
                  className="btn-secondary text-sm flex-1"
                  onClick={() => { setFundId(g.id); setFundDir('remove'); setFundAmount(''); }}
                >
                  <Minus size={14} /> Remove
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {fundId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="card w-full max-w-sm">
            <h3 className="font-semibold mb-3">
              {fundDir === 'add' ? 'Add to goal' : 'Remove from goal'}
            </h3>
            <form onSubmit={doFund} className="space-y-3">
              <label className="field">
                <span className="field-label">Amount</span>
                <input
                  className="field-input"
                  type="text"
                  inputMode="decimal"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Confirm</button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setFundId(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
