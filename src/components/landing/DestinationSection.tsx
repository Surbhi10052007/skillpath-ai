"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useSafeReducedMotion } from "@/lib/useSafeReducedMotion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { smoothPath } from "@/lib/path";
import { SectionTag } from "./ConstellationSection";
import type { AuthUser } from "@/types";
import type { HomeSnapshot } from "./useHomeData";

const STATIONS = [
  { n: "01", title: "Beginner", copy: "Name what you can already do." },
  { n: "02", title: "Foundation", copy: "Finish the skill everything else leans on." },
  { n: "03", title: "Intermediate", copy: "Close one specific gap instead of collecting tutorials." },
  { n: "04", title: "Projects", copy: "Turn the gap into something a person can click." },
  { n: "05", title: "Advanced", copy: "Depth, tradeoffs, and the words to explain them." },
  { n: "06", title: "Job ready", copy: "A route you can walk an interviewer through." },
];

const CURVE = smoothPath([
  { x: 0, y: 120 },
  { x: 220, y: 60 },
  { x: 460, y: 140 },
  { x: 700, y: 50 },
  { x: 940, y: 120 },
  { x: 1180, y: 30 },
]);

export function DestinationSection({ user, snapshot }: { user: AuthUser | null; snapshot: HomeSnapshot | null }) {
  const reduce = useSafeReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 40%"] });
  const x = useTransform(scrollYProgress, [0, 1], ["2%", "-24%"]);
  const dash = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const target = snapshot?.roleName ?? "your target role";

  return (
    <section id="roadmap" className="relative scroll-mt-20 overflow-hidden border-t border-fg/10 py-24 sm:py-32">
      <div className="mx-auto max-w-[1500px] px-5">
        <SectionTag index="04" label="Where you're going" />
        <h2 className="mt-5 font-display text-5xl uppercase leading-[0.84] tracking-[-0.05em] sm:text-7xl">
          Travel the whole
          <span className="block">distance.</span>
        </h2>
      </div>

      <div ref={ref} className="relative mt-12 overflow-x-clip">
        <svg viewBox="0 0 1180 180" className="pointer-events-none absolute inset-x-0 top-0 h-28 w-full" aria-hidden preserveAspectRatio="none">
          <path d={CURVE} fill="none" stroke="rgba(244,240,230,0.12)" strokeWidth="1.5" />
          <motion.path d={CURVE} fill="none" stroke="#d6ff3c" strokeWidth="2" style={{ pathLength: reduce ? 1 : dash }} />
        </svg>

        <motion.div style={reduce ? undefined : { x }} className="mt-20 flex gap-4 px-5 pb-4">
          {STATIONS.map((station, index) => (
            <motion.article
              key={station.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="relative min-w-[76vw] border border-fg/15 bg-ink-2 p-6 sm:min-w-[360px] sm:p-8"
            >
              <p className="font-mono text-xs text-electric">{station.n}</p>
              <h3 className="mt-10 font-display text-4xl uppercase leading-none sm:text-6xl">{station.title}</h3>
              <p className="mt-4 max-w-xs text-sm text-muted">{station.copy}</p>
              <span className="mt-8 block h-2 w-2 rotate-45 bg-electric" />
            </motion.article>
          ))}
        </motion.div>
      </div>

      {/* Final CTA, folded into the end of the journey */}
      <div className="relative mt-16 overflow-hidden bg-electric text-ink">
        <div aria-hidden className="pointer-events-none absolute -right-6 top-0 select-none font-display text-[26vw] uppercase leading-none text-ink/10">
          Next
        </div>
        <div className="relative mx-auto flex min-h-[60vh] max-w-[1500px] flex-col justify-end px-5 py-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] sm:text-[11px]">
            {snapshot ? `Resume · ${snapshot.readiness}% toward ${target}` : "Enter the next stage"}
          </p>
          <h2 className="mt-4 max-w-5xl font-display text-5xl uppercase leading-[0.82] tracking-[-0.06em] sm:text-8xl lg:text-[7.5rem]">
            Your next version
            <span className="block">is waiting.</span>
          </h2>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href={user?.onboarded ? "/dashboard" : "/onboarding"}
              data-cursor="link"
              className="group inline-flex items-center gap-3 bg-ink px-6 py-4 font-mono text-xs uppercase tracking-[0.18em] text-electric transition hover:bg-ink-3"
            >
              {user?.onboarded ? "Continue your path" : "Build my path"}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            {!user && (
              <Link href="/signup" data-cursor="link" className="font-mono text-xs uppercase tracking-[0.16em] text-ink/70 hover:text-ink">
                Create an account
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
