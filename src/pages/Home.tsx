import { Link } from 'react-router-dom';
import { ArrowRight, PieChart, Wallet, Target, BarChart3, Shield } from 'lucide-react';
import { AmbassadorVisual } from '../components/showcase/AmbassadorVisual';
import { useAppStore } from '../store';
import { formatMoney } from '../lib/utils';

export default function Home() {
  const { savingsGoals } = useAppStore();
  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);

  return (
    <div className="space-y-20 pb-8 animate-fade-in scroll-pad-nav lg:pb-0">
      <section className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center min-h-[70vh]">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-card">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-medium">A Trendora product · LUCIA</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gradient-brand leading-[1.1]">
            Take control of your money.
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-lg">
            Trendora Tools helps you understand your financial reality, plan with confidence, and get
            things done — with exact math, not guesses.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/expenses" className="glass-button">
              Record Transaction <ArrowRight size={18} />
            </Link>
            <Link
              to="/insights"
              className="px-6 py-3 rounded-xl font-medium text-slate-300 hover:text-white border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <BarChart3 size={18} /> View Insights
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

      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Powerful tools. Simply done.</h2>
          <p className="text-slate-400">
            Everything you need to track spending, set budgets, and grow savings — on your device.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { to: '/expenses', icon: PieChart, title: 'Expenses', desc: 'Log transactions with categories and notes.' },
            { to: '/budget', icon: Wallet, title: 'Budget', desc: 'Category limits with live utilization.' },
            { to: '/savings', icon: Target, title: 'Savings', desc: 'Goals with clear funding progress.' },
            { to: '/insights', icon: BarChart3, title: 'Insights', desc: 'Understand your recorded financial position.' }
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

      <section className="glass-primary p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs text-violet-300 font-medium">
              <BarChart3 size={14} /> Trendora Financial Insights
            </div>
            <h2 className="text-2xl font-bold text-white">See the picture without the noise.</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Review monthly cash flow, savings progress, bills, debt, and budget utilization from the
              numbers you have already recorded. Trendora Tools stays focused on practical financial tracking — not AI chat.
            </p>
            <Link to="/insights" className="glass-button inline-flex">
              Open Insights <ArrowRight size={16} />
            </Link>
          </div>
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-300">
                <Shield size={20} />
              </div>
              <div>
                <div className="font-semibold text-slate-100">Private by design</div>
                <div className="text-xs text-slate-500">Your financial records stay on your device.</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="glass-card p-3 text-slate-400">Exact calculations</div>
              <div className="glass-card p-3 text-slate-400">Local records</div>
              <div className="glass-card p-3 text-slate-400">No AI chatbot</div>
              <div className="glass-card p-3 text-slate-400">Actionable tools</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
