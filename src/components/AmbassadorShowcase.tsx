import { Award, Users, Sparkles } from 'lucide-react';

/**
 * Ambassador Showcase — reserved growth / campaign surface.
 * Currently shows a premium placeholder; swap content without touching core tools.
 */
export function AmbassadorShowcase() {
  return (
    <section className="glass-primary p-6 relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500/30 to-cyan-500/20 border border-white/10 flex items-center justify-center shrink-0">
            <Award size={22} className="text-violet-300" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 tracking-tight">Ambassador Program</h3>
            <p className="text-sm text-slate-400 mt-0.5 max-w-md">
              Showcase partners and community leaders who grow the LUCIA ecosystem. Slot is live —
              content can be injected without changing financial tools.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
            <Users size={12} /> Community
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
            <Sparkles size={12} /> Growth layer
          </span>
        </div>
      </div>
    </section>
  );
}
