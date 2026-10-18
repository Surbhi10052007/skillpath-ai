"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";

const NODES = ["Start", "Python", "SQL", "ML", "Projects", "Role"];

/**
 * Shared frame for every auth screen (login, signup, forgot, reset) so the
 * recovery flow reads as the same product rather than a bolted-on template.
 */
export function AuthShell({
  eyebrow,
  heading,
  tagline,
  children,
}: {
  eyebrow: string;
  heading: ReactNode;
  tagline: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-ink">
      <Navbar />
      <main id="main" className="grid min-h-dvh pt-16 lg:grid-cols-2">
        <section className="relative hidden overflow-hidden border-r border-fg/10 px-10 py-16 lg:flex lg:flex-col lg:justify-end">
          <div aria-hidden className="absolute inset-0 grid-fade opacity-40" />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-electric">{eyebrow}</p>
            <h1 className="mt-4 font-display text-7xl uppercase leading-[0.82] xl:text-8xl">{heading}</h1>
            <p className="mt-4 max-w-md font-serif text-3xl italic text-fg/80">{tagline}</p>
            <div className="mt-12 flex flex-wrap items-center gap-3">
              {NODES.map((node, index) => (
                <motion.span
                  key={node}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.08 }}
                  className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted"
                >
                  <motion.span
                    animate={{ scale: [1, 1.35, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.2 }}
                    className={`h-2 w-2 ${index === 2 ? "bg-neon" : "bg-electric"}`}
                  />
                  {node}
                  {index < NODES.length - 1 && <span className="text-fg/30">/</span>}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="flex items-center px-5 py-16 sm:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </section>
      </main>
    </div>
  );
}

export const authFieldClass =
  "h-12 w-full border border-fg/15 bg-ink px-4 text-sm text-fg outline-none transition focus:border-electric";

export const authSubmitClass =
  "flex h-12 w-full items-center justify-center gap-2 bg-electric font-mono text-xs uppercase tracking-[0.16em] text-ink transition hover:bg-electric-2 active:translate-y-px disabled:opacity-60";
