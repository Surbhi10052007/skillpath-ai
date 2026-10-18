import { db } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { careerRoles, projects, skills } from "@/db/schema";
import { PROJECTS, ROLES, SKILLS } from "@/data/mock";
import type { CareerRole, Catalog, Project, Skill } from "@/types";
import type { AccentKey } from "@/lib/utils";

const MOCK_CATALOG: Catalog = { skills: SKILLS, roles: ROLES, projects: PROJECTS };

/**
 * Loads the skill/role/project catalog from PostgreSQL.
 * Falls back to the in-code catalog when the tables are empty or unreachable,
 * so the UI is always functional.
 */
export async function loadCatalog(): Promise<Catalog> {
  try {
    await ensureSchema();
    const [skillRows, roleRows, projectRows] = await Promise.all([
      db.select().from(skills),
      db.select().from(careerRoles),
      db.select().from(projects),
    ]);
    if (!skillRows.length || !roleRows.length || !projectRows.length) return MOCK_CATALOG;

    return {
      skills: skillRows.map<Skill>((r) => ({
        slug: r.slug,
        name: r.name,
        category: r.category as Skill["category"],
        description: r.description,
        related: r.related,
      })),
      roles: roleRows.map<CareerRole>((r) => ({
        slug: r.slug,
        name: r.name,
        tagline: r.tagline,
        description: r.description,
        icon: r.icon,
        accent: r.accent as AccentKey,
        demand: r.demand,
        avgSalary: r.avgSalary,
        requirements: r.requirements,
        roadmap: r.roadmap,
      })),
      projects: projectRows.map<Project>((p) => ({
        slug: p.slug,
        title: p.title,
        tagline: p.tagline,
        description: p.description,
        difficulty: p.difficulty as Project["difficulty"],
        category: p.category,
        skills: p.skills,
        skillsGained: p.skillsGained,
        estimatedHours: p.estimatedHours,
        accent: p.accent as AccentKey,
        roles: p.roles,
        stack: p.stack,
        milestones: p.milestones,
        outcomes: p.outcomes,
      })),
    };
  } catch {
    return MOCK_CATALOG;
  }
}

/** Idempotently upserts the in-code catalog into PostgreSQL. */
export async function seedCatalog() {
  for (const s of SKILLS) {
    await db
      .insert(skills)
      .values({ slug: s.slug, name: s.name, category: s.category, description: s.description, related: s.related })
      .onConflictDoUpdate({
        target: skills.slug,
        set: { name: s.name, category: s.category, description: s.description, related: s.related },
      });
  }
  for (const r of ROLES) {
    const values = {
      slug: r.slug,
      name: r.name,
      tagline: r.tagline,
      description: r.description,
      icon: r.icon,
      accent: r.accent,
      demand: r.demand,
      avgSalary: r.avgSalary,
      requirements: r.requirements,
      roadmap: r.roadmap,
    };
    await db.insert(careerRoles).values(values).onConflictDoUpdate({ target: careerRoles.slug, set: values });
  }
  for (const p of PROJECTS) {
    const values = {
      slug: p.slug,
      title: p.title,
      tagline: p.tagline,
      description: p.description,
      difficulty: p.difficulty,
      category: p.category,
      skills: p.skills,
      skillsGained: p.skillsGained,
      estimatedHours: p.estimatedHours,
      accent: p.accent,
      roles: p.roles,
      stack: p.stack,
      milestones: p.milestones,
      outcomes: p.outcomes,
    };
    await db.insert(projects).values(values).onConflictDoUpdate({ target: projects.slug, set: values });
  }
  return { skills: SKILLS.length, roles: ROLES.length, projects: PROJECTS.length };
}
