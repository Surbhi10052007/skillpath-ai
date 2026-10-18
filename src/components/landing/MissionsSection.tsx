"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useSafeReducedMotion } from "@/lib/useSafeReducedMotion";
import { useState, type MouseEvent } from "react";
import { ProjectModal } from "@/components/projects/ProjectModal";
import { PROJECTS } from "@/data/mock";
import { skillName } from "@/lib/skills";
import { SectionTag } from "./ConstellationSection";
import type { Project } from "@/types";

const FEATURED = ["ai-resume-analyzer", "smart-expense-predictor", "ai-study-assistant"];
const PHASES = ["Build", "Test", "Deploy", "Prove"];

function MissionCard({ project, index, onOpen }: { project: Project; index: number; onOpen: (project: Project) => void }) {
  const reduce = useSafeReducedMotion();
  const [hover, setHover] = useState(false);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [6, -6]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(px, [0, 1], [-8, 8]), { stiffness: 200, damping: 20 });
  const glowX = useTransform(px, [0, 1], ["0%", "100%"]);
  const glow = useMotionTemplate`radial-gradient(420px circle at ${glowX} 50%, rgba(214,255,60,0.10), transparent 70%)`;

  const move = (event: MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width);
    py.set((event.clientY - rect.top) / rect.height);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={move}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        px.set(0.5);
        py.set(0.5);
      }}
      style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 1200 }}
      className="group relative border-y border-fg/10"
    >
      <motion.span aria-hidden style={{ background: glow }} className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <button
        type="button"
        data-cursor="link"
        onClick={() => onOpen(project)}
        className="relative grid w-full gap-5 py-8 text-left lg:grid-cols-[130px_1.15fr_1fr] lg:items-center"
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-dim">
          Mission {String(index + 1).padStart(2, "0")}
        </span>

        <span>
          <motion.span
            animate={{ x: hover && !reduce ? 10 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="block font-display text-4xl uppercase leading-[0.9] tracking-[-0.04em] text-fg transition-colors group-hover:text-electric sm:text-6xl"
          >
            {project.title}
          </motion.span>
          <span className="mt-3 block max-w-md text-sm text-muted">{project.tagline}</span>
        </span>

        <span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {PHASES.map((phase, phaseIndex) => (
              <span key={phase} className="inline-flex items-center gap-2">
                <motion.span
                  animate={{ color: hover ? "#d6ff3c" : "#b9b5a8" }}
                  transition={{ delay: hover ? phaseIndex * 0.07 : 0, duration: 0.2 }}
                >
                  {phase}
                </motion.span>
                {phaseIndex < PHASES.length - 1 && <span className="text-fg/25">→</span>}
              </span>
            ))}
          </span>
          <span className="mt-4 flex flex-wrap gap-2">
            {project.skillsGained.slice(0, 4).map((skill, skillIndex) => (
              <motion.span
                key={skill}
                animate={{
                  borderColor: hover ? "rgba(214,255,60,0.6)" : "rgba(244,240,230,0.15)",
                  color: hover ? "#d6ff3c" : "#f4f0e6",
                }}
                transition={{ delay: hover ? skillIndex * 0.05 : 0, duration: 0.22 }}
                className="border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]"
              >
                {skillName(skill)}
              </motion.span>
            ))}
          </span>
        </span>
      </button>
    </motion.div>
  );
}

export function MissionsSection() {
  const [open, setOpen] = useState<Project | null>(null);
  const missions = FEATURED.map((slug) => PROJECTS.find((project) => project.slug === slug)!).filter(Boolean);

  return (
    <section id="missions" className="relative scroll-mt-20 overflow-hidden border-t border-fg/10 py-24 sm:py-32">
      <div className="mx-auto max-w-[1500px] px-5">
        <SectionTag index="03" label="What to build" />
        <h2 className="mt-5 max-w-4xl font-display text-5xl uppercase leading-[0.84] tracking-[-0.05em] sm:text-7xl">
          Projects are bridges
          <span className="block font-serif text-[0.8em] italic normal-case text-fg/80">across the gap.</span>
        </h2>
        <p className="mt-6 max-w-xl leading-relaxed text-muted">
          Each mission is chosen to close a specific crossing. Hover one to see which skills it lights up on your map.
        </p>

        <div className="mt-14">
          {missions.map((project, index) => (
            <MissionCard key={project.slug} project={project} index={index} onOpen={setOpen} />
          ))}
        </div>
      </div>
      <ProjectModal project={open} onClose={() => setOpen(null)} />
    </section>
  );
}
