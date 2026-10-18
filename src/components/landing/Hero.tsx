"use client";

import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { useSafeReducedMotion } from "@/lib/useSafeReducedMotion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Counter } from "@/components/ui/Counter";
import { CareerMap } from "./CareerMap";
import type { HomeSnapshot } from "./useHomeData";
import type { AuthUser } from "@/types";

const WORDS = ["Build", "your", "path."];

interface HeroProps {
  user: AuthUser | null;
  loading: boolean;
  snapshot: HomeSnapshot | null;
}

export function Hero({ user, loading, snapshot }: HeroProps) {
  const reduce = useSafeReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 70, damping: 20, mass: 0.5 });
  const smy = useSpring(my, { stiffness: 70, damping: 20, mass: 0.5 });

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const typeY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const mapY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  // Typography drifts opposite the map for depth.
  const typeX = useTransform(smx, [-0.5, 0.5], [12, -12]);
  const gridX = useTransform(smx, [-0.5, 0.5], [-30, 30]);
  const gridY = useTransform(smy, [-0.5, 0.5], [-20, 20]);

  const personalised = Boolean(snapshot);
  const cta = user?.onboarded ? "Continue your path" : "Build my path";
  const href = user?.onboarded ? "/dashboard" : "/onboarding";

  const hud = personalised
    ? [
        { label: "Current target", value: snapshot!.roleName },
        { label: "Readiness", value: `${snapshot!.readiness}%` },
        { label: "Next skill", value: snapshot!.nextSkill ?? "All clear" },
      ]
    : [
        { label: "Specimen target", value: "AI / ML Engineer" },
        { label: "Route length", value: "6 crossings" },
        { label: "Your data", value: "Not used yet" },
      ];

  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] overflow-hidden pt-16"
      onPointerMove={(event) => {
        if (reduce || event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        mx.set((event.clientX - rect.left) / rect.width - 0.5);
        my.set((event.clientY - rect.top) / rect.height - 0.5);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <motion.div aria-hidden style={reduce ? undefined : { x: gridX, y: gridY }} className="absolute -inset-16 grid-fade opacity-45" />
      <motion.span aria-hidden className="sp-sweep pointer-events-none absolute inset-y-0 left-0 w-[40vw]" />

      <motion.div style={reduce ? undefined : { opacity: fade }} className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-[1500px] grid-cols-1 items-center gap-6 px-5 lg:grid-cols-[0.92fr_1.08fr]">
        <motion.div style={reduce ? undefined : { y: typeY, x: typeX }} className="relative z-10 pt-10 lg:pt-0">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="font-mono text-[10px] uppercase tracking-[0.3em] text-electric sm:text-[11px]"
          >
            {personalised ? `Welcome back, ${user!.name.split(" ")[0]}` : "Career route system"}
          </motion.p>

          <h1 className="mt-4 font-display text-[21vw] font-medium uppercase leading-[0.76] tracking-[-0.06em] text-fg sm:text-[15vw] lg:text-[9.5rem]">
            {WORDS.map((word, index) => (
              <span key={word} className="block overflow-hidden">
                <motion.span
                  className={`block ${index === 2 ? "text-electric" : ""}`}
                  initial={reduce ? { y: 0 } : { y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.85, ease: [0.19, 1, 0.22, 1], delay: 1.05 + index * 0.11 }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="mt-6 max-w-md text-base leading-relaxed text-muted sm:text-lg"
          >
            {personalised
              ? `You're ${snapshot!.readiness}% ready for ${snapshot!.roleName}. Next crossing: ${snapshot!.nextSkill ?? "keep building"}.`
              : "A route from the skills you have to the role you want. You mark the start. We draw what comes next."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.62, duration: 0.5 }}
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3"
          >
            <MagneticButton href={href} size="lg">
              {cta} <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </MagneticButton>
            <a href="#constellation" data-cursor="link" className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition hover:text-fg">
              Explore SkillPath ↓
            </a>
            {!loading && !user && (
              <span className="flex items-center gap-4">
                <Link href="/login" className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg hover:text-electric">Sign in</Link>
                <Link href="/signup" className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg hover:text-electric">Create account</Link>
              </span>
            )}
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.6 }}
            className="mt-12 grid max-w-lg grid-cols-3 gap-px border-t border-fg/10 bg-fg/10 pt-px"
          >
            {hud.map((item) => (
              <div key={item.label} className="bg-ink px-3 py-4">
                <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-dim">{item.label}</dt>
                <dd className="mt-1.5 font-display text-base uppercase leading-tight text-fg sm:text-xl">
                  {item.value.endsWith("%") ? <Counter value={parseInt(item.value, 10)} suffix="%" immediate /> : item.value}
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        <motion.div style={reduce ? undefined : { y: mapY }} className="relative h-[52vh] min-h-[340px] w-full sm:h-[62vh] lg:h-[82vh]">
          <CareerMap mx={smx} my={smy} nodes={snapshot?.nodes} personalised={personalised} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        className="pointer-events-none absolute bottom-5 left-5 hidden font-mono text-[9px] uppercase tracking-[0.22em] text-dim xl:block"
      >
        {personalised ? "Live · from your profile" : "Specimen route · hover any node"}
      </motion.div>
    </section>
  );
}
