import { useState, useEffect } from 'react';

const WELCOME_KEY = 'trendora_tools_welcome_v6';

export function WelcomeExperience({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(WELCOME_KEY)) {
      setIsExiting(true);
      const t = setTimeout(onComplete, 300);
      return () => clearTimeout(t);
    }

    const timers = [
      setTimeout(() => setStage(1), 100),
      setTimeout(() => setStage(2), 1500),
      setTimeout(() => setStage(3), 3000),
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          localStorage.setItem(WELCOME_KEY, 'true');
          onComplete();
        }, 800);
      }, 4500)
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const skip = () => {
    localStorage.setItem(WELCOME_KEY, 'true');
    setIsExiting(true);
    setTimeout(onComplete, 300);
  };

  return (
    <div
      role="dialog"
      aria-label="Welcome to Trendora Tools"
      aria-modal="true"
      className={`fixed inset-0 z-[100] bg-[#07070A] flex items-center justify-center transition-all duration-700 ${
        isExiting ? 'animate-scale-out' : ''
      }`}
    >
      <button
        type="button"
        onClick={skip}
        className="absolute top-0 right-0 safe-top pr-6 pt-4 text-xs text-slate-500 hover:text-white z-50"
      >
        Skip
      </button>

      <div className="text-center space-y-4 px-6">
        {stage >= 1 && (
          <p className="text-slate-500 tracking-[0.3em] uppercase text-sm animate-fade-in">
            LUCIA
          </p>
        )}
        {stage >= 2 && (
          <p className="text-indigo-400 tracking-[0.2em] uppercase text-lg font-light animate-fade-in">
            Trendora
          </p>
        )}
        {stage >= 3 && (
          <div className="animate-slide-up space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold text-gradient-brand">Trendora Tools</h1>
            <p className="text-slate-400 text-base sm:text-lg">
              Your tools. Your progress. Your control.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
