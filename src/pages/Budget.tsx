import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Card } from '../components/Card';
import { CATEGORIES, type Category } from '../types';
import {
  formatMoney,
  monthExpenses,
  categoryTotal,
  budgetUtilization,
  utilizationColor,
  utilizationTextColor
} from '../lib/utils';
import { Trash2 } from 'lucide-react';

export default function Budget() {
  const { budgets, expenses, addBudget, deleteBudget } = useAppStore();
  const [category, setCategory] = useState<Category>('Food');
  const [limit, setLimit] = useState('');
  const monthExps = monthExpenses(expenses);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!limit) return;
    addBudget({ category, limit });
    setLimit('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Budget Planner</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Set category limits. Bars turn amber near 80% and rose when over budget.
        </p>
      </div>

      <Card title="Set / update budget">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="field">
            <span className="field-label">Category</span>
            <select
              className="field-input"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Monthly limit</span>
            <input
              className="field-input"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 50000"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              required
            />
          </label>
          <div className="field flex items-end">
            <button type="submit" className="btn-primary w-full">Save budget</button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {budgets.length === 0 && (
          <p className="text-sm text-slate-400 col-span-full">No budgets yet. Add one above.</p>
        )}
        {budgets.map((b) => {
          const spent = categoryTotal(monthExps, b.category);
          const pct = budgetUtilization(b, expenses);
          const left = b.limit - spent;
          return (
            <Card key={b.id}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{b.category}</h3>
                  <p className={`text-sm ${utilizationTextColor(pct)}`}>
                    {pct >= 100 ? 'Over budget' : pct >= 80 ? 'Approaching limit' : 'Healthy'}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-slate-400 hover:text-rose-600 p-1"
                  onClick={() => deleteBudget(b.id)}
                  aria-label="Delete budget"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="h-3 rounded-full bg-white/10 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${utilizationColor(pct)}`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>{formatMoney(spent)} spent</span>
                <span>{formatMoney(Math.max(0, left))} left of {formatMoney(b.limit)}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
