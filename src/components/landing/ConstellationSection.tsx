"use client";

import { motion, useInView } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { skillName } from "@/lib/skills";
import type { HomeSnapshot } from "./useHomeData";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  level: number;
  kind: "strong" | "mid" | "weak" | "missing";
  note: string;
  used: string[];
}

const SPECIMEN: Node[] = [
  { id: "python", label: "Python", x: 46, y: 26, level: 82, kind: "strong", note: "Foundation skill", used: ["ML", "Automation", "Data"] },
  { id: "git", label: "Git", x: 20, y: 44, level: 61, kind: "mid", note: "Collaboration baseline", used: ["Every project"] },
  { id: "sql", label: "SQL", x: 32, y: 70, level: 28, kind: "weak", note: "Current gap · recommended next", used: ["Data", "Backends"] },
  { id: "ml", label: "Machine Learning", x: 72, y: 40, level: 46, kind: "mid", note: "Half-built", used: ["Models", "Analysis"] },
  { id: "nlp", label: "NLP", x: 84, y: 68, level: 0, kind: "missing", note: "Not started", used: ["Text", "LLM apps"] },
  { id: "deploy", label: "Deployment", x: 58, y: 86, level: 0, kind: "missing", note: "Not started", used: ["Shipping"] },
];

const LINKS: [string, string][] = [
  ["python", "git"], ["python", "sql"], ["python", "ml"], ["ml", "nlp"], ["sql", "deploy"], ["git", "sql"],
];

const TONE: Record<Node["kind"], string> = {
  strong: "#d6ff3c",
  mid: "#f4f0e6",
  weak: "#ff4b2b",
  missing: "#7c7a70",
};

export function ConstellationSection({ snapshot }: { snapshot: HomeSnapshot | null }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const [active, setActive] = useState("sql");

  const nodes = useMemo<Node[]>(() => {
    if (!snapshot?.nodes.length) return SPECIMEN;
    return snapshot.nodes.slice(0, 6).map((node, index) => ({
      id: node.id,
      label: node.label,
      x: SPECIMEN[index]?.x ?? 50,
      y: SPECIMEN[index]?.y ?? 50,
      level: node.level,
      kind: node.level === 0 ? "missing" : node.level >= 70 ? "strong" : node.level >= 40 ? "mid" : "weak",
      note: node.state === "here" ? "You are here" : node.state === "locked" ? "Not started" : "On your map",
      used: [skillName(node.id)],
    }));
  }, [snapshot]);

  const map = new Map(nodes.map((node) => [node.id, node]));
  const current = map.get(active) ?? nodes[0];
  const links = snapshot?.nodes.length
    ? nodes.slice(1).map((node, index) => [nodes[index].id, node.id] as [string, string])
    : LINKS;

  return (
    <section id="constellation" ref={ref} className="relative scroll-mt-20 overflow-hidden border-t border-fg/10 py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1500px] items-center gap-12 px-5 lg:grid-cols-[0.78fr_1.22fr]">
        <div>
          <SectionTag index="01" label="Where you are" />
          <h2 className="mt-5 font-display text-5xl uppercase leading-[0.86] tracking-[-0.05em] sm:text-7xl">
            Not a list.
            <span className="block font-serif text-[0.78em] italic normal-case text-fg/80">A constellation.</span>
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-muted">
            Strong skills hold the map together. Weak ones sag. Missing ones are the dark crossings between where you are and where you want to be.
          </p>

          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-8 border border-fg/15 p-5"
          >
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-display text-3xl uppercase text-fg">{current.label}</p>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: TONE[current.kind] }}>
                {current.kind === "missing" ? "Missing" : `${current.level}%`}
              </span>
            </div>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{current.note}</p>
            <div className="mt-4 h-1 w-full bg-fg/10">
              <motion.span
                key={`${current.id}-bar`}
                initial={{ width: 0 }}
                animate={{ width: `${current.level}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="block h-full"
                style={{ background: TONE[current.kind] }}
              />
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-dim">Used across</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {current.used.map((item) => (
                <li key={item} className="border border-fg/15 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-fg">{item}</li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="relative aspect-[4/3] w-full border border-fg/10 bg-ink-2/60">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
            {links.map(([a, b], index) => {
              const from = map.get(a);
              const to = map.get(b);
              if (!from || !to) return null;
              const hot = active === a || active === b;
              return (
                <motion.line
                  key={`${a}-${b}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={hot ? "#d6ff3c" : "rgba(244,240,230,0.16)"}
                  strokeWidth={hot ? 0.45 : 0.22}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={inView ? { pathLength: 1, opacity: 1 } : undefined}
                  transition={{ duration: 0.7, delay: 0.1 + index * 0.08 }}
                />
              );
            })}
          </svg>

          {nodes.map((node, index) => {
            const on = active === node.id;
            return (
              <motion.button
                key={node.id}
                type="button"
                data-cursor="node"
                onMouseEnter={() => setActive(node.id)}
                onFocus={() => setActive(node.id)}
                onClick={() => setActive(node.id)}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={inView ? { opacity: 1, scale: 1 } : undefined}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.25 + index * 0.07 }}
                className="absolute -translate-x-1/2 -translate-y-1/2 p-2 text-left"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                aria-label={`${node.label}: ${node.note}`}
              >
                <motion.span
                  animate={{ scale: on ? 1.5 : 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 18 }}
                  className={`block h-3 w-3 rotate-45 ${node.kind === "missing" ? "border border-dashed" : ""}`}
                  style={{ background: node.kind === "missing" ? "transparent" : TONE[node.kind], borderColor: TONE[node.kind] }}
                />
                <span className={`mt-2 block whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.12em] sm:text-[10px] ${on ? "text-electric" : "text-fg"}`}>
                  {node.label}
                </span>
              </motion.button>
            );
          })}
          <span className="absolute bottom-3 left-4 font-mono text-[9px] uppercase tracking-[0.18em] text-dim">
            {snapshot ? "Your map" : "Specimen map · hover to trace"}
          </span>
        </div>
      </div>
    </section>
  );
}

export function SectionTag({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-end gap-4">
      <motion.span
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="font-display text-6xl leading-none text-electric sm:text-7xl"
      >
        {index}
      </motion.span>
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-2 font-mono text-[10px] uppercase tracking-[0.26em] text-muted"
      >
        {label}
      </motion.span>
      <motion.span
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="mb-3 h-px flex-1 origin-left bg-fg/20"
      />
    </div>
  );
}
