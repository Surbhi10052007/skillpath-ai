"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { skillName } from "@/lib/skills";
import type { Project } from "@/types";

export function MissionLaunch({ project, started, onStart }: { project: Project; started: boolean; onStart: (project: Project) => void }) {
  const [active, setActive] = useState(0);
  const milestone = project.milestones[active];

  return (
    <section className="border border-fg/10">
      <div className="grid gap-8 border-b border-fg/10 p-6 lg:grid-cols-[1.1fr_.9fr] lg:p-10">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-electric">Mission / {project.category}</p>
          <h1 className="mt-3 font-display text-5xl uppercase leading-[0.84] tracking-[-0.05em] sm:text-7xl">{project.title}</h1>
          <p className="mt-5 max-w-xl text-lg text-muted">{project.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {project.skills.map((skill) => (
              <span key={skill} className="border border-fg/15 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em]">{skillName(skill)}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between border border-fg/10 p-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">Build status</p>
            <p className="mt-2 font-display text-6xl uppercase">{started ? "Live" : "Armed"}</p>
            <div className="mt-4 h-2 bg-fg/10">
              <div className="h-full bg-electric" style={{ width: started ? "18%" : "4%" }} />
            </div>
            <p className="mt-3 text-sm text-muted">{started ? "Mission logged. The first objective is open." : "Not started. No fake progress — launch it when you're ready."}</p>
          </div>
          <div className="mt-8 space-y-3">
            <MagneticButton onClick={() => onStart(project)} disabled={started} fullWidth>
              {started ? "Mission started" : "Start mission"}
            </MagneticButton>
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("skillpath:ask", { detail: { prompt: "What should I build first here?" } }),
                )
              }
              className="w-full border border-fg/20 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted transition hover:border-electric hover:text-electric"
            >
              Ask Path AI about this mission
            </button>
          </div>
        </div>
      </div>
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        <ol className="border-b border-fg/10 lg:border-b-0 lg:border-r">
          {project.milestones.map((item, index) => (
            <li key={item.title}>
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                className={`flex w-full items-center gap-4 px-6 py-5 text-left ${active === index ? "bg-electric text-ink" : "hover:bg-fg/5"}`}
              >
                <span className="font-mono text-xs">0{index + 1}</span>
                <span className="font-display text-2xl uppercase">{item.title}</span>
                {started && index === 0 && <span className="ml-auto font-mono text-[10px] uppercase">You are here</span>}
              </button>
            </li>
          ))}
        </ol>
        <motion.div key={milestone?.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neon">Current objective</p>
          <h2 className="mt-3 font-display text-5xl uppercase leading-none">{milestone?.title}</h2>
          <p className="mt-4 max-w-lg text-muted">{milestone?.description}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {project.skillsGained.map((skill) => (
              <span key={skill} className="bg-fg px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink">+ {skillName(skill)}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
