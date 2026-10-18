"use client";

import { motion } from "framer-motion";
import { Activity as ActivityIcon, ArrowRight, Flame, MessageSquare, Rocket, Route, Sparkles, Target, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { Counter } from "@/components/ui/Counter";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RingProgress } from "@/components/ui/RingProgress";
import { ACCENTS, cn, timeAgo } from "@/lib/utils";
import { skillName } from "@/lib/skills";
import type { Activity, Analysis, StudentProfile } from "@/types";

export function Card({ children, className, title, icon, action }: { children: ReactNode; className?: string; title?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn("glass relative overflow-hidden rounded-4xl p-6", className)}
    >
      {(title || action) && (
        <header className="mb-5 flex items-center justify-between gap-3">
          {title && (
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-fg">
              {icon && <span className="text-electric-2">{icon}</span>} {title}
            </h2>
          )}
          {action}
        </header>
      )}
      {children}
    </motion.section>
  );
}

/* ---------- Progress hero ---------- */
export function ProgressHero({ profile, analysis }: { profile: StudentProfile; analysis: Analysis }) {
  const accent = ACCENTS[analysis.role.accent];
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-4xl border border-white/10 p-6 sm:p-8"
      style={{ background: `linear-gradient(135deg, ${accent.hex}33 0%, rgba(16,16,26,0.9) 45%, rgba(34,211,238,0.12) 100%)` }}
    >
      <div aria-hidden className="absolute -right-20 -top-24 h-72 w-72 rounded-full blur-3xl opacity-50" style={{ background: accent.hex }} />
      <div aria-hidden className="absolute inset-0 grid-fade opacity-30" />
      <div className="relative grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
        <RingProgress value={analysis.overallProgress} size={168} stroke={14} from={accent.hex} to="#22d3ee" label={`${analysis.overallProgress}% overall progress`}>
          <div className="text-center">
            <p className="font-display text-5xl font-extrabold leading-none tracking-tight text-fg">
              <Counter value={analysis.overallProgress} />
              <span className="text-xl text-muted">%</span>
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-dim">overall</p>
          </div>
        </RingProgress>
        <div>
          <p className="eyebrow">Career goal</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">{analysis.role.name}</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">{analysis.summary}</p>
          <dl className="mt-6 grid grid-cols-3 gap-4">
            {[
              { label: "Readiness", value: analysis.readiness, suffix: "%" },
              { label: "Weeks left", value: analysis.estimatedWeeks, suffix: "" },
              { label: "Hours / wk", value: profile.weeklyHours, suffix: "h" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-ink/40 p-3">
                <dt className="text-[10px] uppercase tracking-widest text-dim">{s.label}</dt>
                <dd className="mt-1 font-display text-2xl font-bold text-fg"><Counter value={s.value} suffix={s.suffix} /></dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </motion.section>
  );
}

/* ---------- Student-selected skills ---------- */
export function CurrentSkillsCard({ profile }: { profile: StudentProfile }) {
  return (
    <Card title="Your skills" icon={<Sparkles className="h-4 w-4" />}>
      <p className="mb-5 text-xs leading-relaxed text-muted">Exactly as you rated them during onboarding. Edit your profile whenever your confidence changes.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {profile.skills.map((item, index) => (
          <ProgressBar
            key={item.skill}
            label={skillName(item.skill)}
            value={item.level}
            color={["#a78bfa", "#22d3ee", "#e879f9", "#3b82f6", "#34d399", "#fbbf24"][index % 6]}
            height={7}
            delay={index * 0.06}
          />
        ))}
      </div>
    </Card>
  );
}

/* ---------- Gap score ---------- */
export function GapScoreCard({ analysis }: { analysis: Analysis }) {
  const tone = analysis.gapScore > 60 ? "#fb7185" : analysis.gapScore > 35 ? "#fbbf24" : "#34d399";
  return (
    <Card title="Skill gap score" icon={<Target className="h-4 w-4" />} className="flex flex-col">
      <div className="flex items-center gap-5">
        <RingProgress value={analysis.gapScore} size={104} stroke={10} from={tone} to="#a78bfa" label={`Gap score ${analysis.gapScore}`}>
          <p className="font-display text-2xl font-bold text-fg"><Counter value={analysis.gapScore} /></p>
        </RingProgress>
        <div className="text-sm">
          <p className="font-semibold text-fg">{analysis.gapScore > 60 ? "Big runway" : analysis.gapScore > 35 ? "Closing in" : "Nearly there"}</p>
          <p className="mt-1 text-xs text-muted">Lower is better. {analysis.gaps.length} skills below target.</p>
        </div>
      </div>
      <ul className="mt-5 space-y-2.5">
        {analysis.gaps.slice(0, 3).map((g, i) => (
          <li key={g.skill.slug}>
            <ProgressBar label={g.skill.name} value={g.current} target={g.required} color={["#e879f9", "#a78bfa", "#22d3ee"][i]} height={6} delay={0.1 * i} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ---------- Streak ---------- */
export function StreakCard({ streak }: { streak: number }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const today = (new Date().getDay() + 6) % 7;
  return (
    <Card className="bg-gradient-to-br from-amber/15 via-transparent to-coral/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="eyebrow">Learning streak</p>
          <p className="mt-3 font-display text-6xl font-extrabold tracking-tight text-fg">
            <Counter value={streak} />
            <span className="ml-2 text-lg font-semibold text-muted">days</span>
          </p>
        </div>
        <motion.span
          animate={{ scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber/20 text-amber shadow-[0_0_30px_-6px_rgba(251,191,36,.9)]"
        >
          <Flame className="h-6 w-6" />
        </motion.span>
      </div>
      <div className="mt-6 flex justify-between">
        {days.map((d, i) => {
          const lit = i <= today && today - i < streak;
          return (
            <div key={`${d}-${i}`} className="flex flex-col items-center gap-2">
              <motion.span
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.06, type: "spring", stiffness: 300, damping: 18 }}
                className={cn("h-3 w-3 rounded-full", lit ? "bg-amber shadow-[0_0_12px_rgba(251,191,36,.9)]" : "bg-white/10", i === today && "ring-2 ring-amber/60 ring-offset-2 ring-offset-ink")}
              />
              <span className="font-mono text-[10px] text-dim">{d}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-5 text-xs text-muted">{streak >= 7 ? "A full week. Momentum compounds." : "Keep showing up — 7 days unlocks a badge."}</p>
    </Card>
  );
}

/* ---------- Next skill ---------- */
export function NextSkillCard({ analysis, onAsk }: { analysis: Analysis; onAsk: () => void }) {
  const next = analysis.nextSkill;
  if (!next) {
    return (
      <Card title="Recommended next skill" icon={<Sparkles className="h-4 w-4" />}>
        <p className="text-sm text-muted">You meet every requirement. Time to build and apply.</p>
      </Card>
    );
  }
  const current = analysis.roadmap.find((n) => n.status === "current");
  return (
    <Card title="Recommended next skill" icon={<Sparkles className="h-4 w-4" />} className="border-electric/30">
      <div aria-hidden className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-electric/25 blur-3xl" />
      <p className="font-display text-3xl font-extrabold tracking-tight text-gradient sm:text-4xl">{next.skill.name}</p>
      <p className="mt-2 text-sm text-muted">{next.skill.description}</p>
      <div className="mt-5">
        <ProgressBar value={next.current} target={next.required} color="#a78bfa" label={`${next.current}% → ${next.required}% needed`} showValue={false} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-magenta/30 bg-magenta/10 px-2.5 py-1 font-mono uppercase tracking-widest text-magenta">
          {next.importance === 3 ? "critical" : next.importance === 2 ? "high" : "medium"}
        </span>
        {current && <span className="rounded-full border border-white/10 px-2.5 py-1 text-muted">≈ {current.estimatedWeeks} weeks</span>}
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-muted">+{next.gap} points to close</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <a href="#roadmap-card" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-electric to-azure px-4 text-sm font-semibold text-white shadow-glow-violet transition hover:brightness-110">
          <Route className="h-4 w-4" /> Open in roadmap
        </a>
        <button type="button" onClick={onAsk} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/10 px-4 text-sm text-muted transition hover:text-fg">
          <MessageSquare className="h-4 w-4" /> Ask why
        </button>
      </div>
    </Card>
  );
}

/* ---------- Activity ---------- */
const ICONS = { skill: Sparkles, project: Rocket, roadmap: Route, streak: Flame, chat: MessageSquare, profile: UserRound } as const;
const COLORS = { skill: "text-electric-2", project: "text-neon", roadmap: "text-mint", streak: "text-amber", chat: "text-azure", profile: "text-magenta" } as const;

export function ActivityCard({ activities }: { activities: Activity[] }) {
  return (
    <Card title="Recent activity" icon={<ActivityIcon className="h-4 w-4" />}>
      {activities.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-6 text-center">
          <p className="text-sm text-muted">Nothing yet. Complete a roadmap step or start a project and it shows up here.</p>
        </div>
      ) : (
        <ol className="relative space-y-4 border-l border-white/10 pl-6">
          {activities.map((a, i) => {
            const Icon = ICONS[a.type] ?? Sparkles;
            return (
              <motion.li
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="relative"
              >
                <span className={cn("absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-ink-3", COLORS[a.type])}>
                  <Icon className="h-2.5 w-2.5" />
                </span>
                <p className="text-sm text-fg">{a.message}</p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-dim">{timeAgo(a.createdAt)}</p>
              </motion.li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

export function LinkAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="inline-flex items-center gap-1 text-xs font-medium text-muted transition hover:text-fg">
      {children} <ArrowRight className="h-3 w-3" />
    </a>
  );
}
