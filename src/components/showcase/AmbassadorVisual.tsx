import { TrendingUp, ShieldCheck, Wallet } from 'lucide-react';

/**
 * Offline-capable abstract ambassador visual — layered glass + SVG.
 * Represents a user in control of their financial life.
 */
export function AmbassadorVisual() {
  return (
    <div className="relative w-full aspect-square md:aspect-[4/5] max-w-md mx-auto">
      {/* Atmospheric glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-transparent to-cyan-600/20 rounded-full blur-3xl animate-pulse-slow" />

      {/* Outer glass ring */}
      <div className="absolute inset-[8%] rounded-[2rem] glass-primary border border-white/10 overflow-hidden">
        {/* Inner depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent" />

        {/* Abstract figure — geometric silhouette */}
        <svg
          viewBox="0 0 200 260"
          className="absolute inset-0 w-full h-full p-8 opacity-90"
          fill="none"
          aria-hidden="true"
        >
          {/* Head */}
          <circle cx="100" cy="58" r="28" fill="url(#gradHead)" opacity="0.9" />
          {/* Shoulders / torso */}
          <path
            d="M55 110 C55 90, 145 90, 145 110 L155 200 C155 220, 45 220, 45 200 Z"
            fill="url(#gradBody)"
            opacity="0.85"
          />
          {/* Accent arc — control / progress */}
          <path
            d="M40 130 Q100 90 160 130"
            stroke="url(#gradArc)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
          <defs>
            <linearGradient id="gradHead" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            <linearGradient id="gradBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="100%" stopColor="rgba(139,92,246,0.25)" />
            </linearGradient>
            <linearGradient id="gradArc" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating stat pills */}
        <div className="absolute top-[12%] left-[6%] glass-card px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] text-slate-200 shadow-lg">
          <TrendingUp size={12} className="text-emerald-400" />
          <span>On track</span>
        </div>
        <div className="absolute top-[28%] right-[4%] glass-card px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] text-slate-200 shadow-lg">
          <ShieldCheck size={12} className="text-cyan-400" />
          <span>Private</span>
        </div>
        <div className="absolute bottom-[18%] left-[10%] glass-card px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] text-slate-200 shadow-lg">
          <Wallet size={12} className="text-violet-300" />
          <span>In control</span>
        </div>
      </div>
    </div>
  );
}
