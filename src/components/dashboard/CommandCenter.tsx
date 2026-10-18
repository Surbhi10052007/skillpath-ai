"use client";

import { motion } from "framer-motion";
import { PencilLine } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ProjectModal } from "@/components/projects/ProjectModal";
import { Roadmap } from "@/components/roadmap/Roadmap";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { skillName } from "@/lib/skills";
import { greeting } from "@/lib/utils";
import type { Activity, Analysis, Project, RoadmapNode, StudentProfile } from "@/types";

const SkillRadar = dynamic(() => import("@/components/charts/SkillRadar"), {
  ssr: false,
  loading: () => <Skeleton className="h-64" />,
});

const SPOTS = [
  { x: 50, y: 46 }, { x: 28, y: 30 }, { x: 74, y: 28 }, { x: 18, y: 62 },
  { x: 80, y: 64 }, { x: 42, y: 76 }, { x: 64, y: 78 }, { x: 34, y: 14 }, { x: 68, y: 14 },
];

interface CommandCenterProps {
  profile: StudentProfile;
  analysis: Analysis;
  activities: Activity[];
  source: "guest" | "account";
  openProject: Project | null;
  started: boolean;
  busySlug: string | null;
  onOpenProject: (project: Project) => void;
  onCloseProject: () => void;
  onStartProject: (project: Project) => void;
  onComplete: (node: RoadmapNode) => void;
  onReopen: (node: RoadmapNode) => void;
  matchScore?: number;
  reason?: string;
}

export function CommandCenter({
  profile, analysis, activities, source, openProject, started, busySlug,
  onOpenProject, onCloseProject, onStartProject, onComplete, onReopen, matchScore, reason,
}: CommandCenterProps) {
  const first = profile.name.split(" ")[0];
  const next = analysis.nextSkill;
  const current = analysis.roadmap.find((node) => node.status === "current");
  const week = analysis.roadmap.filter((node) => node.status !== "completed").slice(0, 4);
  const block = Math.max(25, Math.round((profile.weeklyHours / 4) * 60));
  const known = new Set(profile.skills.map((skill) => skill.skill));
  const missing = analysis.gaps.filter((gap) => !known.has(gap.skill.slug)).slice(0, 3);
  const nodes = [
    ...profile.skills.slice(0, 6).map((skill) => ({ id: skill.skill, label: skillName(skill.skill), level: skill.level, missing: false })),
    ...missing.map((gap) => ({ id: gap.skill.slug, label: gap.skill.name, level: 0, missing: true })),
  ].map((node, index) => ({ ...node, ...SPOTS[index], here: node.id === next?.skill.slug }));
  const here = nodes.find((node) => node.here) ?? nodes[0];

  return (
    <div className="mx-auto max-w-[1500px] px-5 pb-28 pt-24">
      {source === "guest" && (
        <div className="mb-6 flex flex-col justify-between gap-3 border border-electric/40 px-4 py-3 sm:flex-row sm:items-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-electric">Guest route · saved on this device · built from your inputs</p>
          <MagneticButton href="/signup" size="sm">Save progress</MagneticButton>
        </div>
      )}

      <header className="grid items-end gap-8 border-b border-fg/10 pb-8 lg:grid-cols-[1.3fr_.7fr]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-dim">{greeting(first)}</p>
          <h1 className="mt-2 font-display text-6xl uppercase leading-[0.8] tracking-[-0.06em] sm:text-8xl lg:text-[8.5rem]">{first}</h1>
          <p className="mt-4 font-serif text-3xl italic text-electric sm:text-5xl">{analysis.role.name}</p>
        </div>
        <div className="lg:text-right">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-dim">Readiness</p>
          <p className="font-display text-8xl leading-none text-fg sm:text-9xl">{analysis.readiness}<span className="text-electric">%</span></p>
          <Link href="/onboarding" className="mt-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted hover:text-electric">
            <PencilLine className="h-3.5 w-3.5" /> Recalibrate
          </Link>
        </div>
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
        <div className="relative min-h-[560px] border border-fg/10 bg-ink-2">
          <div className="absolute left-4 top-4 z-10 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">Live career map · your inputs</div>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {here && nodes.filter((node) => node.id !== here.id).map((node) => (
              <line key={node.id} x1={here.x} y1={here.y} x2={node.x} y2={node.y} stroke={node.missing ? "rgba(255,75,43,0.45)" : "rgba(214,255,60,0.35)"} strokeWidth="0.35" />
            ))}
          </svg>
          {nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              className="absolute -translate-x-1/2 -translate-y-1/2 text-left"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              onClick={() => window.dispatchEvent(new CustomEvent("skillpath:ask", { detail: { prompt: `Why does ${node.label} matter for my path?` } }))}
            >
              <span className={`block h-3 w-3 rotate-45 ${node.here ? "bg-neon" : node.missing ? "border border-dashed border-neon" : "bg-electric"}`} />
              <span className="mt-2 block max-w-28 font-mono text-[10px] uppercase tracking-[0.12em] text-fg">{node.label}</span>
              <span className="font-mono text-[9px] text-dim">{node.here ? "YOU ARE HERE" : node.missing ? "MISSING" : `${node.level}%`}</span>
            </button>
          ))}
        </div>

        <aside className="flex flex-col justify-between border border-fg/10 p-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neon">Your next move</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-[0.88]">{next?.skill.name ?? current?.title ?? "Depth"}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">{next?.skill.description ?? current?.description ?? "You meet the listed requirements. Build something public."}</p>
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-electric">Today’s block · {block} min</p>
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <MagneticButton onClick={() => document.getElementById("week")?.scrollIntoView({ behavior: "smooth" })}>Continue</MagneticButton>
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("skillpath:ask", { detail: { prompt: "Give me a 30 minute task" } }))} className="border border-fg/20 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted hover:border-electric hover:text-electric">
              Ask Path AI why
            </button>
          </div>
        </aside>
      </section>

      <section id="week" className="mt-6 grid gap-px bg-fg/10 lg:grid-cols-[1fr_1fr]">
        <div className="bg-ink p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-dim">This week</p>
          <ol className="mt-6 space-y-4">
            {week.map((node, index) => (
              <li key={node.slug} className="grid grid-cols-[52px_1fr_auto] items-baseline gap-3 border-b border-fg/10 pb-4">
                <span className="font-mono text-electric">0{index + 1}</span>
                <span className="font-display text-2xl uppercase">{node.title}</span>
                <span className="font-mono text-[10px] uppercase text-dim">{node.status}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="bg-ink p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-dim">Signal vs requirement</p>
          <SkillRadar data={analysis.radar} height={280} />
        </div>
      </section>

      <section className="mt-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-electric">Missions matched to you</p>
        <div className="mt-4 divide-y divide-fg/10 border-y border-fg/10">
          {analysis.projects.slice(0, 3).map((rec, index) => (
            <button key={rec.project.slug} type="button" onClick={() => onOpenProject(rec.project)} className="grid w-full gap-3 py-6 text-left sm:grid-cols-[90px_1fr_auto] sm:items-center">
              <span className="font-mono text-xs text-dim">0{index + 1}</span>
              <span>
                <span className="block font-display text-3xl uppercase sm:text-5xl">{rec.project.title}</span>
                <span className="mt-1 block text-sm text-muted">{rec.reason}</span>
              </span>
              <span className="font-mono text-xs text-electric">{rec.matchScore}% fit</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-10 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-4xl uppercase">Your route</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">{analysis.roadmap.filter((node) => node.status === "completed").length}/{analysis.roadmap.length} cleared</span>
          </div>
          <Roadmap nodes={analysis.roadmap} align="left" interactive busySlug={busySlug} onComplete={onComplete} onReopen={onReopen} />
        </div>
        <div>
          <h2 className="font-display text-4xl uppercase">Recent signal</h2>
          <ul className="mt-5 space-y-4">
            {activities.length === 0 && <li className="text-sm text-muted">No movement yet. Clear a node and it lands here.</li>}
            {activities.map((activity) => (
              <li key={activity.id} className="border-b border-fg/10 pb-3">
                <p className="text-sm text-fg">{activity.message}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">{activity.type}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8 border border-fg/10 p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-dim">Streak</p>
            <p className="font-display text-6xl uppercase">{profile.streak}<span className="ml-2 text-xl text-muted">days</span></p>
          </div>
        </div>
      </section>

      <ProjectModal project={openProject} onClose={onCloseProject} matchScore={matchScore} reason={reason} onStart={onStartProject} started={started} />
    </div>
  );
}

export function CommandSkeleton() {
  return (
    <div className="mx-auto max-w-[1500px] px-5 pb-24 pt-28" aria-busy="true" aria-label="Loading command center">
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-display text-5xl uppercase">Plotting your route…</motion.p>
      <Skeleton className="mt-8 h-[420px]" />
    </div>
  );
}
