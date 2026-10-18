"use client";

import { AnimatePresence, motion, type MotionValue, useTransform } from "framer-motion";
import { useSafeReducedMotion } from "@/lib/useSafeReducedMotion";
import { useState } from "react";
import { smoothPath, type Pt } from "@/lib/path";
import type { HomeNode } from "./useHomeData";

const VIEW = { w: 1000, h: 820 };

const SPECIMEN: HomeNode[] = [
  { id: "start", label: "Start", level: 100, state: "done" },
  { id: "python", label: "Python", level: 82, state: "done" },
  { id: "sql", label: "SQL", level: 28, state: "here" },
  { id: "ml", label: "Machine Learning", level: 46, state: "next" },
  { id: "projects", label: "Projects", level: 0, state: "locked" },
  { id: "role", label: "AI / ML Engineer", level: 0, state: "locked" },
];

const LAYOUT: Pt[] = [
  { x: 90, y: 740 },
  { x: 250, y: 596 },
  { x: 392, y: 648 },
  { x: 548, y: 436 },
  { x: 716, y: 330 },
  { x: 886, y: 132 },
];

const DETAIL: Record<string, string> = {
  start: "Where every route begins — what you can already do today.",
  python: "Foundation skill. Feeds ML, automation and data work.",
  sql: "Current gap. Recommended next crossing on this route.",
  ml: "Unlocks once the data foundation underneath it is solid.",
  projects: "Proof. A build that forces the new skill into the open.",
  role: "The destination this specimen route is aiming at.",
};

interface CareerMapProps {
  nodes?: HomeNode[];
  /** Normalised pointer offsets (-0.5 → 0.5) shared with the hero. */
  mx: MotionValue<number>;
  my: MotionValue<number>;
  personalised?: boolean;
}

export function CareerMap({ nodes, mx, my, personalised = false }: CareerMapProps) {
  const reduce = useSafeReducedMotion();
  const [active, setActive] = useState<string | null>(null);

  const data = (nodes?.length ? nodes : SPECIMEN).slice(0, LAYOUT.length);
  const points = LAYOUT.slice(0, data.length);
  const d = smoothPath(points);

  // Depth parallax — one transform per layer, no React re-renders while moving.
  const deepX = useTransform(mx, [-0.5, 0.5], [26, -26]);
  const deepY = useTransform(my, [-0.5, 0.5], [18, -18]);
  const midX = useTransform(mx, [-0.5, 0.5], [-16, 16]);
  const midY = useTransform(my, [-0.5, 0.5], [-10, 10]);

  const style = reduce ? undefined : { x: midX, y: midY };
  const deepStyle = reduce ? undefined : { x: deepX, y: deepY };

  return (
    <div className="relative h-full w-full select-none">
      <motion.div style={deepStyle} aria-hidden className="absolute inset-0">
        <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="h-full w-full">
          <path d={d} fill="none" stroke="rgba(244,240,230,0.07)" strokeWidth="26" strokeLinecap="round" />
        </svg>
      </motion.div>

      <motion.div style={style} className="absolute inset-0">
        <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="h-full w-full overflow-visible" role="img" aria-label={personalised ? "Your career route" : "Specimen career route"}>
          <defs>
            <linearGradient id="routeGrad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#d6ff3c" />
              <stop offset="60%" stopColor="#d6ff3c" />
              <stop offset="100%" stopColor="#ff4b2b" />
            </linearGradient>
          </defs>

          <path d={d} fill="none" stroke="rgba(244,240,230,0.16)" strokeWidth="1.25" strokeDasharray="1 7" strokeLinecap="round" />
          <motion.path
            d={d}
            fill="none"
            stroke="url(#routeGrad)"
            strokeWidth="2.25"
            initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.9, ease: [0.22, 1, 0.36, 1], delay: 0.9 }}
          />

          {!reduce &&
            [0, 1, 2].map((index) => (
              <circle key={index} r={index === 1 ? 3.5 : 2.4} fill={index === 1 ? "#ff4b2b" : "#d6ff3c"} opacity="0.9">
                <animateMotion dur={`${7 + index * 2.5}s`} begin={`${2.4 + index * 1.9}s`} repeatCount="indefinite" path={d} />
              </circle>
            ))}

          {points.map((point, index) => {
            const node = data[index];
            const here = node.state === "here";
            const done = node.state === "done";
            const on = active === node.id;
            return (
              <g key={node.id}>
                {here && !reduce && <circle cx={point.x} cy={point.y} r="17" fill="none" stroke="#ff4b2b" className="animate-pulse-ring" />}
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  r={here ? 9 : done ? 7 : 6}
                  fill={here ? "#ff4b2b" : done ? "#d6ff3c" : "#090a08"}
                  stroke={here || done ? "none" : "#f4f0e6"}
                  strokeWidth="1.6"
                  initial={reduce ? { scale: 1 } : { scale: 0 }}
                  animate={{ scale: on ? 1.45 : 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 18, delay: reduce ? 0 : 1.1 + index * 0.13 }}
                  style={{ transformOrigin: `${point.x}px ${point.y}px` }}
                />
              </g>
            );
          })}
        </svg>

        {points.map((point, index) => {
          const node = data[index];
          const on = active === node.id;
          const left = `${(point.x / VIEW.w) * 100}%`;
          const top = `${(point.y / VIEW.h) * 100}%`;
          return (
            <div key={node.id} className="absolute" style={{ left, top }}>
              <motion.button
                type="button"
                data-cursor="node"
                onMouseEnter={() => setActive(node.id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(node.id)}
                onBlur={() => setActive(null)}
                onClick={() => setActive(on ? null : node.id)}
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 1.2 + index * 0.13 }}
                aria-label={`${node.label}${node.state === "here" ? " — you are here" : ""}`}
                className="-translate-y-1/2 translate-x-4 text-left"
              >
                <span className={`block whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.16em] transition-colors sm:text-[11px] ${node.state === "here" ? "text-neon" : on ? "text-electric" : "text-fg"}`}>
                  {node.label}
                </span>
                <span className="block whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.18em] text-dim sm:text-[9px]">
                  {node.state === "here" ? "You are here" : node.state === "locked" ? "Locked" : node.state === "next" ? "Next" : "Cleared"}
                </span>
              </motion.button>

              <AnimatePresence>
                {on && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-4 top-8 z-20 w-56 border border-electric/40 bg-ink-2/95 p-3 backdrop-blur-sm"
                  >
                    <p className="font-display text-xl uppercase leading-none text-fg">{node.label}</p>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted">
                      {personalised
                        ? node.state === "locked"
                          ? "Not started yet. It opens as the skills before it land."
                          : `Your confidence: ${node.level}%`
                        : DETAIL[node.id] ?? "Part of the specimen route."}
                    </p>
                    {!personalised && node.level > 0 && (
                      <div className="mt-3 h-1 w-full bg-fg/10">
                        <motion.span initial={{ width: 0 }} animate={{ width: `${node.level}%` }} transition={{ duration: 0.5 }} className="block h-full bg-electric" />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
