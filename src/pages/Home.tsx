import { Link } from 'react-router-dom';
import { ArrowRight, PieChart, Wallet, Target, Sparkles, Shield, MessageSquare } from 'lucide-react';
import { AmbassadorVisual } from '../components/showcase/AmbassadorVisual';
import { useAppStore } from '../store';
import { formatMoney } from '../lib/utils';

export default function Home() {
  const { savingsGoals, expenses, budgets } = useAppStore();
  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);

  return (
    <div className="space-y-20 pb-8 animate-fade-in">
      {/* Hero */}
      <section className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center min-h-[70vh]">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-card">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-medium">Local & Private by Design</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gradient-brand leading-[1.1]">
            Take control of your money.
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-lg">
            TrendoraTools helps you understand your financial reality, plan with confidence, and get
            things done — with exact math, not guesses.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/expenses" className="glass-button">
              Record Transaction <ArrowRight size={18} />
            </Link>
            <Link
              to="/wisecraft"
              className="px-6 py-3 rounded-xl font-medium text-slate-300 hover:text-white border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <Sparkles size={18} /> Ask WISECRAFT
            </Link>
          </div>
          {totalSaved > 0 && (
            <p className="text-sm text-slate-500">
              You’ve saved <span className="text-emerald-400 font-medium">{formatMoney(totalSaved)}</span> toward
              your goals.
            </p>
          )}
        </div>
        <AmbassadorVisual />
      </section>

      {/* Tool previews */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Powerful tools. Simply done.</h2>
          <p className="text-slate-400">
            Everything you need to track spending, set budgets, and grow savings — on your device.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              to: '/expenses',
              icon: PieChart,
              title: 'Expenses',
              desc: 'Log transactions with categories and notes.'
            },
            {
              to: '/budget',
              icon: Wallet,
              title: 'Budget',
              desc: 'Category limits with live utilization colors.'
            },
            {
              to: '/savings',
              icon: Target,
              title: 'Savings',
              desc: 'Goals with add/remove funding flows.'
            },
            {
              to: '/dashboard',
              icon: Shield,
              title: 'Command',
              desc: 'Position, utilization, and recent activity.'
            }
          ].map(({ to, icon: Icon, title, desc }) => (
            <Link key={to} to={to} className="glass-interactive p-5 space-y-3 group">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-300 group-hover:bg-violet-500/25 transition">
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-slate-100">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* WISECRAFT preview */}
      <section className="glass-primary p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs text-violet-300 font-medium">
              <Sparkles size={14} /> WISECRAFT workspace
            </div>
            <h2 className="text-2xl font-bold text-white">Deterministic help, not a chatbot claim.</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ask about this month’s spending, remaining budget, or create a quick savings goal.
              Routing is rule-based. Optional remote intelligence stays behind a clear boundary.
            </p>
            <Link to="/wisecraft" className="glass-button inline-flex">
              Open workspace <ArrowRight size={16} />
            </Link>
          </div>
          <div className="glass-card p-4 space-y-3 text-sm">
            <div className="flex gap-2 justify-end">
              <span className="bg-violet-600 text-white px-3 py-2 rounded-2xl rounded-br-md max-w-[85%]">
                How much did I spend this month?
              </span>
            </div>
            <div className="flex gap-2">
              <span className="bg-white/5 text-slate-300 px-3 py-2 rounded-2xl rounded-bl-md max-w-[90%] border border-white/5">
                Exact totals from your local ledger — largest category included when data exists.
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <MessageSquare size={12} />
              {expenses.length} expenses · {budgets.length} budgets · {savingsGoals.length} goals
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
