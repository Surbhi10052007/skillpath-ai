"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useSafeReducedMotion } from "@/lib/useSafeReducedMotion";

const STAGES = ["Start", "Skills", "Gaps", "Build", "Prove", "Ready"];

/**
 * The continuous route. One fixed spine that fills as the visitor scrolls, so
 * every section reads as part of the same journey rather than separate blocks.
 */
export function JourneyRail() {
  const reduce = useSafeReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 });
  const scaleY = useTransform(progress, [0, 1], [0.02, 1]);
  const markerTop = useTransform(progress, [0, 1], ["0%", "100%"]);

  if (reduce) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed right-4 top-1/2 z-30 hidden h-[58vh] -translate-y-1/2 lg:block">
      <div className="relative h-full w-px bg-fg/12">
        <motion.div style={{ scaleY }} className="absolute inset-0 origin-top bg-electric" />
        <motion.div style={{ top: markerTop }} className="absolute -left-[3px] h-[7px] w-[7px] -translate-y-1/2 rotate-45 bg-neon" />
        {STAGES.map((stage, index) => (
          <div
            key={stage}
            className="absolute right-0 flex items-center justify-end gap-2"
            style={{ top: `${(index / (STAGES.length - 1)) * 100}%` }}
          >
            <span className="-translate-y-1/2 whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.2em] text-dim opacity-0 transition-opacity duration-300 xl:opacity-100">
              {stage}
            </span>
            <span className="h-[3px] w-[3px] -translate-y-1/2 translate-x-[1px] rounded-full bg-fg/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
