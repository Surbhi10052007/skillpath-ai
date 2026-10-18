"use client";

import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { BookOpen, Check, ChevronDown, Flag, Lock, RotateCcw, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { RoadmapNode } from "@/types";

interface RoadmapProps {
  nodes: RoadmapNode[];
  align?: "alternate" | "left";
  interactive?: boolean;
  onComplete?: (node: RoadmapNode) => void;
  onReopen?: (node: RoadmapNode) => void;
  busySlug?: string | null;
  className?: string;
}

export function Roadmap({ nodes, align = "alternate", interactive, onComplete, onReopen, busySlug, className }: RoadmapProps) {
  const ref = useRef<HTMLOListElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const reduce = useReducedMotion();
  const [expanded, setExpanded] = useState<string | null>(nodes.find((n) => n.status === "current")?.slug ?? null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const runnerTop = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const currentIndex = Math.max(0, nodes.findIndex((n) => n.status === "current"));
  const completedFraction = nodes.length > 1 ? currentIndex / (nodes.length - 1) : 1;
  const alternate = align === "alternate";

  return (
    <ol ref={ref} className={cn("relative", className)} aria-label="Learning roadmap">
      {/* spine */}
      <div
        aria-hidden
        className={cn("absolute bottom-7 top-7 w-px bg-white/[0.08]", alternate ? "left-7 md:left-1/2 md:-translate-x-1/2" : "left-7")}
      >
        <motion.div
          className="absolute inset-x-0 top-0 bg-gradient-to-b from-electric via-electric-2 to-neon shadow-[0_0_16px_rgba(139,92,246,.9)]"
          initial={{ height: 0 }}
          animate={inView ? { height: `${completedFraction * 100}%` } : undefined}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
        {!reduce && (
          <motion.span
            style={{ top: runnerTop }}
            className="absolute left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon shadow-[0_0_14px_3px_rgba(34,211,238,.8)]"
          />
        )}
      </div>

      {nodes.map((node, i) => {
        const isLeft = alternate && i % 2 === 0;
        const isOpen = expanded === node.slug;
        const isGoal = !node.skill;
        const busy = busySlug === node.slug;

        return (
          <motion.li
            key={node.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative grid items-start gap-4 pb-8 last:pb-0",
              alternate ? "grid-cols-[56px_1fr] md:grid-cols-[1fr_56px_1fr]" : "grid-cols-[56px_1fr]",
            )}
          >
            {/* node marker */}
            <div
              className={cn(
                "relative flex h-14 w-14 items-center justify-center",
                alternate && "md:col-start-2",
                !alternate && "col-start-1",
              )}
            >
              {node.status === "current" && !reduce && (
                <>
                  <span aria-hidden className="absolute inset-1 rounded-full border border-electric-2 animate-pulse-ring" />
                  <span aria-hidden className="absolute inset-1 rounded-full border border-neon animate-pulse-ring [animation-delay:0.8s]" />
                </>
              )}
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : node.slug)}
                aria-expanded={isOpen}
                aria-label={`${node.title} — ${node.status}`}
                className={cn(
                  "relative z-10 flex h-11 w-11 items-center justify-center rounded-full border transition-transform duration-300 hover:scale-110 focus-visible:scale-110",
                  node.status === "completed" && "border-transparent bg-gradient-to-br from-electric to-neon text-white shadow-[0_0_28px_-4px_rgba(139,92,246,.95)]",
                  node.status === "current" && "border-electric-2 bg-ink-3 text-electric-2 shadow-[0_0_30px_-4px_rgba(167,139,250,.9)]",
                  node.status === "locked" && "border-white/10 bg-ink-3/80 text-dim",
                )}
              >
                {node.status === "completed" ? (
                  <Check className="h-5 w-5" strokeWidth={3} />
                ) : isGoal ? (
                  <Flag className="h-4 w-4" />
                ) : node.status === "current" ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* card */}
            <div
              className={cn(
                "min-w-0",
                alternate && (isLeft ? "md:col-start-1 md:row-start-1 md:text-right" : "md:col-start-3 md:row-start-1"),
              )}
            >
              <motion.div
                layout
                className={cn(
                  "overflow-hidden rounded-3xl border transition-colors duration-500",
                  node.status === "completed" && "border-electric/30 bg-electric/[0.07]",
                  node.status === "current" && "border-neon/40 bg-ink-3/80 shadow-[0_0_60px_-24px_rgba(34,211,238,.8)]",
                  node.status === "locked" && "border-white/[0.06] bg-white/[0.02] opacity-60",
                  isGoal && node.status !== "completed" && "border-dashed",
                )}
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : node.slug)}
                  aria-expanded={isOpen}
                  className={cn("flex w-full items-center gap-4 px-5 py-4 text-left", alternate && isLeft && "md:flex-row-reverse md:text-right")}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
                      {isGoal ? "Destination" : `Step ${String(i + 1).padStart(2, "0")}`}
                      {node.status === "current" && <span className="ml-2 text-neon">· in progress</span>}
                      {node.status === "completed" && <span className="ml-2 text-electric-2">· complete</span>}
                    </p>
                    <h4 className={cn("mt-1 truncate font-display text-lg font-bold tracking-tight", node.status === "locked" ? "text-muted" : "text-fg")}>
                      {node.title}
                    </h4>
                  </div>
                  {!isGoal && (
                    <div className="hidden w-24 shrink-0 sm:block">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-electric to-neon"
                          initial={{ width: 0 }}
                          animate={inView ? { width: `${node.progress}%` } : undefined}
                          transition={{ duration: 1.2, delay: 0.3 + i * 0.1 }}
                        />
                      </div>
                      <p className="mt-1 text-right font-mono text-[10px] text-dim">{node.progress}%</p>
                    </div>
                  )}
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-dim transition-transform duration-300", isOpen && "rotate-180")} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className={cn("border-t border-white/[0.06] px-5 pb-5 pt-4", alternate && isLeft && "md:text-right")}>
                        <p className="text-sm leading-relaxed text-muted">{node.description}</p>
                        {node.estimatedWeeks > 0 && (
                          <p className="mt-3 font-mono text-xs text-dim">≈ {node.estimatedWeeks} week{node.estimatedWeeks > 1 ? "s" : ""}</p>
                        )}
                        {node.resources.length > 0 && (
                          <ul className={cn("mt-3 flex flex-wrap gap-1.5", alternate && isLeft && "md:justify-end")}>
                            {node.resources.map((r) => (
                              <li key={r} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-ink/40 px-2.5 py-1 text-xs text-muted">
                                <BookOpen className="h-3 w-3" /> {r}
                              </li>
                            ))}
                          </ul>
                        )}
                        {interactive && !isGoal && (
                          <div className={cn("mt-4 flex gap-2", alternate && isLeft && "md:justify-end")}>
                            {node.status !== "completed" ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => onComplete?.(node)}
                                className="inline-flex h-9 items-center gap-1.5 bg-electric px-4 text-sm font-semibold uppercase tracking-[0.12em] text-ink transition hover:bg-electric-2 disabled:opacity-60"
                              >
                                <Check className="h-4 w-4" /> {busy ? "Saving…" : "Mark complete"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => onReopen?.(node)}
                                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-4 text-sm text-muted transition hover:text-fg disabled:opacity-60"
                              >
                                <RotateCcw className="h-4 w-4" /> Reopen
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
