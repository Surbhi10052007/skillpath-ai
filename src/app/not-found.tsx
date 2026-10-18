import { AIOrb } from "@/components/fx/AIOrb";
import { MagneticButton } from "@/components/ui/MagneticButton";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <AIOrb size={96} />
      <p className="eyebrow mt-10">404</p>
      <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-fg sm:text-6xl">
        This path doesn&apos;t exist <span className="text-gradient">yet.</span>
      </h1>
      <p className="mt-4 max-w-md text-muted">The page you&apos;re looking for wandered off the roadmap.</p>
      <div className="mt-8 flex gap-3">
        <MagneticButton href="/">Back home</MagneticButton>
        <MagneticButton href="/dashboard" variant="secondary">Dashboard</MagneticButton>
      </div>
    </main>
  );
}
