"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Clock, Sparkles } from "lucide-react";
import { TiltCard } from "@/components/ui/TiltCard";
import { ACCENTS, cn } from "@/lib/utils";
import { DIFFICULTY_STYLES, skillName } from "@/lib/skills";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  matchScore?: number;
  reason?: string;
  onOpen: (project: Project) => void;
  compact?: boolean;
}

export function ProjectCard({ project, matchScore, reason, onOpen, compact }: ProjectCardProps) {
  const accent = ACCENTS[project.accent];
  const diff = DIFFICULTY_STYLES[project.difficulty];

  return (
    <TiltCard
      className="group h-full cursor-pointer rounded-4xl"
      onClick={() => onOpen(project)}
      role="button"
      tabIndex={0}
      ariaLabel={`Open ${project.title}`}
    >
      <article className="glass relative flex h-full flex-col overflow-hidden rounded-4xl p-6 transition-[border-color,box-shadow] duration-500 group-hover:border-white/20 group-hover:shadow-glow-violet">
        {/* accent aura */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl transition-opacity duration-700 group-hover:opacity-80"
          style={{ background: accent.hex }}
        />

        <div className="relative flex items-start justify-between gap-3">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest", diff.bg, diff.text)}>
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i < diff.dots ? "bg-current" : "bg-current/20")} />
              ))}
            </span>
            {project.difficulty}
          </span>
          {matchScore !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 font-mono text-[11px] text-fg">
              <Sparkles className="h-3 w-3 text-electric-2" /> {matchScore}% match
            </span>
          )}
        </div>

        <h3 className="relative mt-5 font-display text-2xl font-bold leading-tight tracking-tight text-fg">{project.title}</h3>
        <p className="relative mt-2 text-sm leading-relaxed text-muted">{project.tagline}</p>
        {reason && <p className={cn("relative mt-2 text-xs font-medium", accent.text)}>{reason}</p>}

        {!compact && (
          <div className="relative mt-5">
            <p className="text-[10px] uppercase tracking-widest text-dim">Skills</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {project.skills.map((s) => (
                <span key={s} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-muted">
                  {skillName(s)}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="relative mt-5">
          <p className="text-[10px] uppercase tracking-widest text-dim">Skills you&apos;ll gain</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {project.skillsGained.map((s, i) => (
              <motion.span
                key={s}
                className={cn("rounded-full border px-2.5 py-1 text-xs font-medium text-fg transition-colors duration-300", accent.border, accent.soft)}
                initial={false}
                whileHover={{ y: -2 }}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                + {skillName(s)}
              </motion.span>
            ))}
          </div>
        </div>

        <div className="relative mt-auto flex items-center justify-between pt-6 text-sm">
          <span className="inline-flex items-center gap-1.5 text-muted">
            <Clock className="h-4 w-4" /> ~{project.estimatedHours}h
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-fg">
            View details
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </article>
    </TiltCard>
  );
}
