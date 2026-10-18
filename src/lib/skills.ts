import { SKILLS } from "@/data/mock";
import type { Difficulty, Skill } from "@/types";

const byslug = new Map(SKILLS.map((s) => [s.slug, s]));

export function skillName(slug: string, skills?: Skill[]) {
  if (skills) return skills.find((s) => s.slug === slug)?.name ?? slug;
  return byslug.get(slug)?.name ?? slug;
}

export function skillDescription(slug: string) {
  return byslug.get(slug)?.description ?? "";
}

export const DIFFICULTY_STYLES: Record<Difficulty, { text: string; bg: string; dots: number }> = {
  Beginner: { text: "text-mint", bg: "bg-mint/10 border-mint/30", dots: 1 },
  Intermediate: { text: "text-amber", bg: "bg-amber/10 border-amber/30", dots: 2 },
  Advanced: { text: "text-magenta", bg: "bg-magenta/10 border-magenta/30", dots: 3 },
};
