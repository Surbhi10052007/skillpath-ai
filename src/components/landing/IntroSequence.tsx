/**
 * Pure-CSS entrance. No JS timers, no hydration risk, and it inherits the
 * global prefers-reduced-motion rule (which collapses it to ~0ms).
 */
export function IntroSequence() {
  return (
    <div aria-hidden className="sp-intro pointer-events-none fixed inset-0 z-[110] grid place-items-center bg-ink">
      <div className="w-full max-w-md px-6 text-center">
        <p className="sp-intro-word font-display text-4xl uppercase tracking-[0.2em] text-fg sm:text-6xl">
          Skill<span className="text-electric">Path</span>
        </p>
        <div className="mt-5 h-px w-full bg-fg/15">
          <span className="sp-intro-line block h-px origin-left bg-electric" />
        </div>
        <p className="sp-intro-word mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Plotting the route</p>
      </div>
    </div>
  );
}
