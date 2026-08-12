import { useState, useEffect } from 'react';
import { Wallet, PieChart, Target, Sparkles } from 'lucide-react';

const WELCOME_KEY = 'trendoratools_welcome_completed';

interface WelcomeExperienceProps {
  onComplete: () => void;
}

export function WelcomeExperience({ onComplete }: WelcomeExperienceProps) {
  const [stage, setStage] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem(WELCOME_KEY);

    if (hasVisited) {
      // Returning user: brief elegant transition
      setStage(5);
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onComplete, 600);
      }, 80);
      return () => clearTimeout(timer);
    }

    // First visit: cinematic sequence
    const timers = [
      setTimeout(() => setStage(1), 100),   // Background + orbs
      setTimeout(() => setStage(2), 700),   // Brand mark
      setTimeout(() => setStage(3), 2000),  // Feature glass cards
      setTimeout(() => setStage(4), 3600),  // WISECRAFT badge
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          localStorage.setItem(WELCOME_KEY, 'true');
          onComplete();
        }, 900);
      }, 5200)
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const handleSkip = () => {
    localStorage.setItem(WELCOME_KEY, 'true');
    setIsExiting(true);
    setTimeout(onComplete, 450);
  };

  return (
    <div
      role="dialog"
      aria-label="Welcome to TrendoraTools"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-slate-950 text-slate-100 ${
        isExiting ? 'animate-scale-out' : ''
      }`}
    >
      <WelcomeBackground visible={stage >= 1} />

      {/* Skip */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-0 right-0 safe-top pr-4 pt-2 z-20 text-xs font-medium text-slate-400 hover:text-white transition"
      >
        Skip
      </button>

      <div className="relative z-10 flex flex-col items-center px-6 max-w-lg w-full text-center">
        {/* Brand */}
        {stage >= 2 && (
          <div className="animate-slide-up mb-10">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <span className="text-2xl font-bold text-white">T</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gradient">
              TrendoraTools
            </h1>
            <p className="mt-2 text-sm text-slate-400 tracking-wide">
              LUCIA · by Trendora Inc.
            </p>
          </div>
        )}

        {/* Feature cards */}
        {stage >= 3 && (
          <div className="grid grid-cols-3 gap-3 w-full mb-10">
            <GlassCard
              icon={<Wallet size={22} />}
              label="Budget"
              delay={0}
              floatDelay={0}
            />
            <GlassCard
              icon={<PieChart size={22} />}
              label="Expenses"
              delay={120}
              floatDelay={0.4}
            />
            <GlassCard
              icon={<Target size={22} />}
              label="Savings"
              delay={240}
              floatDelay={0.8}
            />
          </div>
        )}

        {/* WISECRAFT */}
        {stage >= 4 && (
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-indigo-400/20">
              <Sparkles size={14} className="text-indigo-300 animate-pulse-glow" />
              <span className="text-xs font-medium text-slate-200 tracking-wide">
                Growth layer · WISECRAFT
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 tracking-[0.2em] uppercase">
              Deterministic tools · Not an AI chatbot
            </p>
          </div>
        )}

        <FutureAmbassadorSlot />
      </div>
    </div>
  );
}

function WelcomeBackground({ visible }: { visible: boolean }) {
  return (
    <div
      className={`absolute inset-0 transition-opacity duration-1000 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className="absolute top-1/4 left-1/4 w-80 h-80 sm:w-96 sm:h-96 bg-indigo-600/20 rounded-full blur-3xl animate-float"
        style={{ animationDelay: '0s' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 sm:w-96 sm:h-96 bg-emerald-500/15 rounded-full blur-3xl animate-float"
        style={{ animationDelay: '2s' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.75)_100%)]" />
    </div>
  );
}

function GlassCard({
  icon,
  label,
  delay,
  floatDelay
}: {
  icon: React.ReactNode;
  label: string;
  delay: number;
  floatDelay: number;
}) {
  return (
    <div
      className="glass-card p-4 flex flex-col items-center gap-2 animate-slide-up opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="text-emerald-300 animate-float" style={{ animationDelay: `${floatDelay}s` }}>
        {icon}
      </div>
      <span className="text-xs text-slate-300 font-medium">{label}</span>
    </div>
  );
}

/** Reserved for future ambassador / campaign UI */
function FutureAmbassadorSlot() {
  return null;
}
