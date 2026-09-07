import { useEffect, useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';

/** Default welcome video — loads immediately; override with VITE_TRENDORA_WELCOME_VIDEO_URL if needed. */
const DEFAULT_WELCOME_VIDEO = 'https://www.pexels.com/download/video/6773475/';

export function WelcomeExperience({ onGetStarted, onGuest }: { onGetStarted: () => void; onGuest: () => void }) {
  const [ready, setReady] = useState(false);
  const videoSrc =
    (import.meta.env.VITE_TRENDORA_WELCOME_VIDEO_URL as string | undefined)?.trim() ||
    DEFAULT_WELCOME_VIDEO;

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[var(--bg-deep)] text-[var(--text-primary)] flex items-end sm:items-center">
      <video
        className="absolute inset-0 w-full h-full object-cover welcome-video"
        src={videoSrc}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      {/* Theme-aware scrim: stronger in light so type stays readable over the video */}
      <div className="absolute inset-0 welcome-scrim" />
      <div className="absolute inset-0 opacity-25 theme-light:opacity-10 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:56px_56px] pointer-events-none" />

      <div
        className={`relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-10 py-10 sm:py-16 transition-all duration-700 ${
          ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <img
              src="./brand/trendora-mark.svg"
              alt="Trendora"
              className="w-12 h-12 drop-shadow-[0_0_28px_rgba(139,92,246,.35)]"
            />
            <div>
              <div className="text-[10px] tracking-[0.38em] uppercase text-[var(--text-faint)]">LUCIA</div>
              <div className="text-sm text-[var(--text-secondary)]">Trendora</div>
            </div>
          </div>
          <p className="text-sm sm:text-base text-violet-400 theme-dark:text-violet-200/90 mb-3 tracking-wide">
            Welcome to Trendora.
          </p>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[.98] text-[var(--text-primary)]">
            Make every move
            <br />
            count.
          </h1>
          <p className="mt-6 max-w-xl text-base sm:text-lg text-[var(--text-muted)] leading-relaxed">
            Simple tools to understand your money, plan your next step, and keep your progress moving forward —
            privately, clearly, and on your terms.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={onGetStarted} className="glass-button px-7 py-3.5">
              Get Started <ArrowRight size={18} />
            </button>
            <button
              type="button"
              onClick={onGuest}
              className="px-7 py-3.5 rounded-xl border border-[var(--glass-border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--nav-hover)] transition-all flex items-center justify-center gap-2"
            >
              <Play size={16} /> Continue as Guest
            </button>
          </div>
          <p className="mt-5 text-xs text-[var(--text-faint)]">
            Free to use. Your local data stays on your device unless you choose Lucia Cloud backup.
          </p>
        </div>
      </div>
    </main>
  );
}
