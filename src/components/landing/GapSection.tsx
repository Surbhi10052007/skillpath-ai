"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Counter } from "@/components/ui/Counter";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { SectionTag } from "./ConstellationSection";
import type { HomeSnapshot } from "./useHomeData";

const SPECIMEN = [
  { skill: "Python", current: 82, required: 80 },
  { skill: "Machine Learning", current: 46, required: 75 },
  { skill: "SQL", current: 28, required: 55 },
  { skill: "Deep Learning", current: 0, required: 60 },
];

export function GapSection({ snapshot }: { snapshot: HomeSnapshot | null }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 55%"] });
  const [lit, setLit] = useState(0);

  const rows = SPECIMEN;
  const steps = rows.length;

  // Light the missing crossings one by one as the section scrolls past.
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.min(steps, Math.max(0, Math.round(value * (steps + 0.4))));
    setLit((current) => (current === next ? current : next));
  });

  const bridgeWidth = useTransform(scrollYProgress, [0.1, 0.9], ["4%", "100%"]);
  const readiness = snapshot?.readiness ?? 38;
  const target = snapshot?.roleName ?? "AI / ML Engineer";

  return (
    <section id="gap" ref={ref} className="relative scroll-mt-20 overflow-hidden border-t border-fg/10 bg-fg py-24 text-ink sm:py-32">
      <div className="mx-auto max-w-[1500px] px-5">
        <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <div className="[&_span:first-child]:text-neon [&_span:nth-child(2)]:text-ink/60 [&_span:last-child]:bg-ink/20">
              <SectionTag index="02" label="What's missing" />
            </div>
            <h2 className="mt-5 font-display text-5xl uppercase leading-[0.84] tracking-[-0.05em] sm:text-7xl">
              The distance
              <span className="block">is the work.</span>
            </h2>
            <p className="mt-6 max-w-sm leading-relaxed text-ink/70">
              A target role isn&apos;t a vibe — it&apos;s a set of expectations. The empty stretch between the two bars is exactly what you cross.
            </p>

            <div className="mt-8 border border-ink/20 p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">{snapshot ? "Your readiness" : "Specimen readiness"}</p>
              <p className="font-display text-7xl leading-none sm:text-8xl">
                <Counter value={readiness} suffix="%" />
              </p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/60">toward {target}</p>
            </div>

            <div className="mt-6">
              <MagneticButton href="/onboarding" className="[&_a]:bg-ink [&_a]:text-electric [&_a]:hover:bg-ink-3">
                Measure my real gap
              </MagneticButton>
            </div>
          </div>

          <div>
            <div className="space-y-8">
              {rows.map((row, index) => {
                const on = lit > index;
                const deficit = Math.max(0, row.required - row.current);
                return (
                  <div key={row.skill}>
                    <div className="mb-2 flex items-end justify-between gap-3">
                      <p className="font-display text-2xl uppercase sm:text-3xl">{row.skill}</p>
                      <p className="font-mono text-[11px] tabular-nums">
                        {row.current}% <span className="text-ink/40">/ {row.required}%</span>
                      </p>
                    </div>
                    <div className="relative h-10 bg-ink/10">
                      {/* required envelope */}
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-ink/15"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${row.required}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: index * 0.07 }}
                      />
                      {/* what the student has */}
                      <motion.div
                        className="absolute inset-y-1 left-1 bg-ink"
                        initial={{ width: 0 }}
                        whileInView={{ width: `calc(${row.current}% - 8px)` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: 0.15 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
                      />
                      {/* the gap, lighting up on scroll */}
                      {deficit > 0 && (
                        <motion.div
                          className="absolute inset-y-1 border border-dashed border-neon"
                          style={{ left: `${row.current}%`, width: `${deficit}%` }}
                          animate={{ opacity: on ? 1 : 0.25, backgroundColor: on ? "rgba(255,75,43,0.16)" : "rgba(255,75,43,0)" }}
                          transition={{ duration: 0.4 }}
                        >
                          <motion.span
                            animate={{ opacity: on ? 1 : 0 }}
                            className="absolute -top-0.5 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.14em] text-neon"
                          >
                            +{deficit}
                          </motion.span>
                        </motion.div>
                      )}
                      <span className="absolute inset-y-0 w-px bg-ink" style={{ left: `${row.required}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">The crossing</p>
              <div className="relative mt-3 h-px w-full bg-ink/20">
                <motion.span style={{ width: bridgeWidth }} className="absolute left-0 top-0 block h-px bg-neon" />
              </div>
              <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-ink/60">
                <span>You are here</span>
                <span>{target}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
