"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfile } from "@/components/providers/ProfileProvider";
import { skillName } from "@/lib/skills";

export interface HomeNode {
  id: string;
  label: string;
  level: number;
  state: "done" | "here" | "next" | "locked";
}

export interface HomeSnapshot {
  readiness: number;
  roleName: string;
  nextSkill: string | null;
  projectTitle: string | null;
  weeksLeft: number;
  nodes: HomeNode[];
}

/**
 * Homepage personalisation, derived from the shared profile state.
 * No extra request: if the student has a saved profile we use it, otherwise
 * every section falls back to clearly-labelled specimen content.
 */
export function useHomeData() {
  const { user, isLoading } = useAuth();
  const { data, status } = useProfile();

  const snapshot = useMemo<HomeSnapshot | null>(() => {
    if (!data) return null;
    const { analysis, profile } = data;
    const nextSlug = analysis.nextSkill?.skill.slug;
    const strengths = [...profile.skills].sort((a, b) => b.level - a.level).slice(0, 4);
    const gaps = analysis.gaps.slice(0, 3);

    const nodes: HomeNode[] = [
      ...strengths.map<HomeNode>((item) => ({
        id: item.skill,
        label: skillName(item.skill),
        level: item.level,
        state: item.skill === nextSlug ? "here" : "done",
      })),
      ...gaps
        .filter((gap) => !strengths.some((item) => item.skill === gap.skill.slug))
        .map<HomeNode>((gap) => ({
          id: gap.skill.slug,
          label: gap.skill.name,
          level: gap.current,
          state: gap.skill.slug === nextSlug ? "here" : "locked",
        })),
    ];
    if (!nodes.some((node) => node.state === "here") && nodes.length) {
      nodes[nodes.length - 1].state = "next";
    }

    return {
      readiness: analysis.readiness,
      roleName: analysis.role.name,
      nextSkill: analysis.nextSkill?.skill.name ?? null,
      projectTitle: analysis.projects[0]?.project.title ?? null,
      weeksLeft: analysis.estimatedWeeks,
      nodes: nodes.slice(0, 6),
    };
  }, [data]);

  return {
    user,
    loading: isLoading || status === "loading",
    snapshot,
    personalised: Boolean(snapshot),
  };
}
