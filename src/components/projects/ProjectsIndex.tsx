"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useProfile } from "@/components/providers/ProfileProvider";
import { catalogService } from "@/lib/api/services";
import { skillName } from "@/lib/skills";
import type { Project } from "@/types";

export function ProjectsIndex() {
  const { data } = useProfile();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    catalogService
      .get()
      .then((catalog) => active && setProjects(catalog.projects))
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Could not load missions.");
      });
    return () => {
      active = false;
    };
  }, []);

  // Ranked matches come from the shared profile — no extra request.
  const ranked = new Map(data?.analysis.projects.map((item) => [item.project.slug, item.matchScore]) ?? []);

  return (
    <div className="mx-auto max-w-[1500px] px-5 pb-24 pt-28">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-electric">Missions</p>
      <h1 className="mt-3 font-display text-6xl uppercase leading-[0.84] sm:text-8xl">Choose a proof.</h1>
      <p className="mt-4 max-w-xl text-muted">
        {data
          ? `Every mission in the catalog. Percentages show the fit against your ${data.analysis.role.name} route.`
          : "Every mission in the catalog. Build your path to see which ones close your gaps."}
      </p>
      {error && <p className="mt-6 text-neon">{error}</p>}
      <div className="mt-12 divide-y divide-fg/10 border-y border-fg/10">
        {projects.map((project, index) => {
          const fit = ranked.get(project.slug);
          return (
            <motion.div key={project.slug} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.3) }}>
              <Link href={`/projects/${project.slug}`} className="grid gap-3 py-6 hover:text-electric sm:grid-cols-[80px_1fr_auto] sm:items-center">
                <span className="font-mono text-xs text-dim">{String(index + 1).padStart(2, "0")}</span>
                <span>
                  <span className="block font-display text-3xl uppercase sm:text-5xl">{project.title}</span>
                  <span className="mt-1 block text-sm text-muted">{project.tagline}</span>
                </span>
                <span className="text-right font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                  {fit !== undefined && <span className="mr-3 text-electric">{fit}% fit</span>}
                  {project.skills.slice(0, 2).map((skill) => skillName(skill)).join(" · ")}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
