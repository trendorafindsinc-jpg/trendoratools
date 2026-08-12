import { Sparkles, Shield, Cpu, Radio } from 'lucide-react';
import { isWisecraftConfigured } from '../services/wisecraft/client';
import { Card } from '../components/Card';

export default function Wisecraft() {
  const configured = isWisecraftConfigured();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-brand">
          WISECRAFT
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Central intelligence boundary for the Command Center — optional, privacy-first, never
          hardcodes secrets.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-primary p-5 text-center">
          <Shield className="mx-auto mb-2 text-emerald-400" size={28} />
          <h3 className="font-semibold text-sm">Privacy first</h3>
          <p className="text-xs text-slate-400 mt-1">
            No API keys in the client. Financial data stays local by default.
          </p>
        </div>
        <div className="glass-primary p-5 text-center">
          <Cpu className="mx-auto mb-2 text-violet-300" size={28} />
          <h3 className="font-semibold text-sm">Deterministic core</h3>
          <p className="text-xs text-slate-400 mt-1">
            Budgets, expenses, and savings use integer minor units only.
          </p>
        </div>
        <div className="glass-primary p-5 text-center">
          <Radio className="mx-auto mb-2 text-cyan-300" size={28} />
          <h3 className="font-semibold text-sm">Optional remote</h3>
          <p className="text-xs text-slate-400 mt-1">
            Set VITE_WISECRAFT_ENDPOINT when a secure backend is ready.
          </p>
        </div>
      </div>

      <div className="glass-primary p-8 text-center border border-violet-500/20">
        <Sparkles className="mx-auto mb-3 text-violet-300 animate-pulse-glow" size={32} />
        <p className="text-sm text-slate-300 mb-4 max-w-md mx-auto">
          Advanced features require a secure backend. Until then, the conversational home routes
          with pure local rules — no hallucinated numbers or fake financial advice.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <div
            className={`w-2 h-2 rounded-full ${
              configured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
            }`}
          />
          <span className="text-xs font-medium text-slate-400">
            {configured ? 'Remote endpoint configured' : 'Environment: Local Deterministic'}
          </span>
        </div>
      </div>
    </div>
  );
}
