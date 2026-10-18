"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Check, Clock, Layers, Rocket, Target } from "lucide-react";
import Link from "next/link";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ACCENTS, cn } from "@/lib/utils";
import { DIFFICULTY_STYLES, skillDescription, skillName } from "@/lib/skills";
import type { Project } from "@/types";

interface ProjectDetailProps {
  project: Project;
  matchScore?: number;
  reason?: string;
  onStart?: (project: Project) => void;
  started?: boolean;
  showPageLink?: boolean;
}

export function ProjectDetail({ project, matchScore, reason, onStart, started, showPageLink }: ProjectDetailProps) {
  const accent = ACCENTS[project.accent];
  const diff = DIFFICULTY_STYLES[project.difficulty];

  return (
    <div>
      {/* header */}
      <div className="relative overflow-hidden rounded-t-[inherit] px-6 pb-8 pt-10 sm:px-10 sm:pt-12">
        <div aria-hidden className={cn("absolute inset-0 bg-gradient-to-br opacity-30", accent.gradient)} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-3 via-ink-3/60 to-transparent" />
        <div aria-hidden className="absolute -right-10 -top-20 h-64 w-64 rounded-full blur-3xl opacity-50" style={{ background: accent.hex }} />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest", diff.bg, diff.text)}>{project.difficulty}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">{project.category}</span>
            {matchScore !== undefined && (
              <span className="rounded-full border border-electric/40 bg-electric/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-electric-2">{matchScore}% match</span>
            )}
          </div>
          <h2 className="mt-5 font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-fg sm:text-5xl">{project.title}</h2>
          <p className="mt-3 max-w-2xl text-base text-muted sm:text-lg">{project.tagline}</p>
          {reason && <p className={cn("mt-2 text-sm font-medium", accent.text)}>{reason}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> ~{project.estimatedHours} hours</span>
            <span className="inline-flex items-center gap-1.5"><Layers className="h-4 w-4" /> {project.milestones.length} milestones</span>
            <span className="inline-flex items-center gap-1.5"><Target className="h-4 w-4" /> {project.skillsGained.length} skills gained</span>
          </div>
        </div>
      </div>

      <div className="grid gap-10 px-6 pb-10 sm:px-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-base leading-relaxed text-muted">{project.description}</p>

          <h3 className="mt-10 font-display text-lg font-bold text-fg">Milestones</h3>
          <ol className="relative mt-5 space-y-5 border-l border-white/10 pl-7">
            {project.milestones.map((m, i) => (
              <motion.li
                key={m.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <span
                  className="absolute -left-[37px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-ink-3 font-mono text-[10px] text-fg"
                  style={{ boxShadow: `0 0 16px -4px ${accent.hex}` }}
                >
                  {i + 1}
                </span>
                <p className="font-semibold text-fg">{m.title}</p>
                <p className="mt-1 text-sm text-muted">{m.description}</p>
              </motion.li>
            ))}
          </ol>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5">
            <p className="eyebrow mb-4">Skills you&apos;ll gain</p>
            <ul className="space-y-3">
              {project.skillsGained.map((s) => (
                <li key={s} className="flex gap-3">
                  <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", accent.soft, accent.text)}>
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-fg">{skillName(s)}</p>
                    <p className="text-xs text-dim">{skillDescription(s)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5">
            <p className="eyebrow mb-4">Stack</p>
            <div className="flex flex-wrap gap-1.5">
              {project.stack.map((s) => (
                <span key={s} className="rounded-full border border-white/10 bg-ink/50 px-2.5 py-1 font-mono text-xs text-muted">{s}</span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5">
            <p className="eyebrow mb-4">What you walk away with</p>
            <ul className="space-y-2 text-sm text-muted">
              {project.outcomes.map((o) => (
                <li key={o} className="flex gap-2"><Rocket className="mt-0.5 h-4 w-4 shrink-0 text-neon" /> {o}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            {onStart && (
              <MagneticButton onClick={() => onStart(project)} fullWidth disabled={started}>
                {started ? (<><Check className="h-4 w-4" /> Added to your path</>) : (<><Rocket className="h-4 w-4" /> Start this project</>)}
              </MagneticButton>
            )}
            {showPageLink && (
              <Link href={`/projects/${project.slug}`} className="inline-flex items-center justify-center gap-1 text-sm text-muted transition hover:text-fg">
                Open full page <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
