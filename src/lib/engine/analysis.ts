import type {
  Analysis,
  CareerRole,
  Catalog,
  GapStatus,
  Project,
  ProjectRecommendation,
  ProgressOverrides,
  RoadmapNode,
  SkillGap,
  StudentProfile,
} from "@/types";
import { clamp } from "@/lib/utils";

const COMPLETION_THRESHOLD = 0.8;

function gapStatus(current: number, required: number): GapStatus {
  if (current === 0) return "missing";
  const ratio = current / required;
  if (ratio >= 1) return "ready";
  if (ratio >= 0.7) return "close";
  return "gap";
}

const difficultyFit: Record<StudentProfile["experienceLevel"], Record<Project["difficulty"], number>> = {
  beginner: { Beginner: 1, Intermediate: 0.55, Advanced: 0.15 },
  intermediate: { Beginner: 0.5, Intermediate: 1, Advanced: 0.6 },
  advanced: { Beginner: 0.25, Intermediate: 0.7, Advanced: 1 },
};

export function getRole(catalog: Catalog, slug: string): CareerRole {
  return catalog.roles.find((r) => r.slug === slug) ?? catalog.roles[0];
}

export function skillLevelMap(profile: StudentProfile) {
  const map = new Map<string, number>();
  for (const s of profile.skills) map.set(s.skill, clamp(s.level));
  return map;
}

export function computeGaps(profile: StudentProfile, role: CareerRole, catalog: Catalog): SkillGap[] {
  const levels = skillLevelMap(profile);
  return role.requirements
    .map((req) => {
      const skill = catalog.skills.find((s) => s.slug === req.skill);
      if (!skill) return null;
      const current = levels.get(req.skill) ?? 0;
      const gap = Math.max(0, req.requiredLevel - current);
      return {
        skill,
        current,
        required: req.requiredLevel,
        gap,
        importance: req.importance,
        priority: Math.round(gap * req.importance),
        status: gapStatus(current, req.requiredLevel),
      } satisfies SkillGap;
    })
    .filter((g): g is SkillGap => g !== null);
}

export function computeReadiness(gaps: SkillGap[]) {
  const weight = gaps.reduce((acc, g) => acc + g.importance, 0) || 1;
  const score = gaps.reduce((acc, g) => acc + Math.min(1, g.current / g.required) * g.importance, 0);
  return Math.round((score / weight) * 100);
}

export function buildRoadmap(
  profile: StudentProfile,
  role: CareerRole,
  overrides: ProgressOverrides = {},
): RoadmapNode[] {
  const levels = skillLevelMap(profile);
  const reqMap = new Map(role.requirements.map((r) => [r.skill, r.requiredLevel]));

  const base = role.roadmap.map((node, index) => {
    let progress = 0;
    let completed = false;
    if (node.skill) {
      const required = reqMap.get(node.skill) ?? 70;
      const current = levels.get(node.skill) ?? 0;
      progress = Math.round(clamp((current / required) * 100));
      completed = current >= required * COMPLETION_THRESHOLD;
    }
    const override = overrides[node.slug];
    if (override === "completed") {
      completed = true;
      progress = 100;
    } else if (override === "locked") {
      completed = false;
    }
    return { ...node, index, progress, completed };
  });

  const allSkillNodesDone = base.filter((n) => n.skill).every((n) => n.completed);
  let currentAssigned = false;
  return base.map((n) => {
    let status: RoadmapNode["status"];
    if (!n.skill) {
      status = allSkillNodesDone ? "completed" : "locked";
    } else if (n.completed) {
      status = "completed";
    } else if (!currentAssigned) {
      status = "current";
      currentAssigned = true;
    } else {
      status = "locked";
    }
    return {
      slug: n.slug,
      title: n.title,
      skill: n.skill,
      description: n.description,
      estimatedWeeks: n.estimatedWeeks,
      resources: n.resources,
      index: n.index,
      status,
      progress: status === "completed" ? 100 : n.progress,
    };
  });
}

export function recommendProjects(
  profile: StudentProfile,
  role: CareerRole,
  gaps: SkillGap[],
  catalog: Catalog,
  limit = 4,
): ProjectRecommendation[] {
  const levels = skillLevelMap(profile);
  const gapBySkill = new Map(gaps.filter((g) => g.gap > 0).map((g) => [g.skill.slug, g]));

  const scored = catalog.projects.map((project) => {
    const fit = difficultyFit[profile.experienceLevel][project.difficulty];
    const gainWeights: number[] = project.skillsGained.map((s) => gapBySkill.get(s)?.importance ?? 0);
    const coverage = gainWeights.reduce((a, b) => a + b, 0) / (project.skillsGained.length * 3);
    const relevance = project.roles.includes(role.slug) ? 1 : 0.35;
    const readyToStart =
      project.skills.filter((s) => (levels.get(s) ?? 0) >= 30).length / Math.max(1, project.skills.length);

    const matchScore = Math.round(100 * (0.35 * fit + 0.35 * coverage + 0.2 * relevance + 0.1 * readyToStart));
    const gainsForYou = project.skillsGained
      .filter((s) => gapBySkill.has(s))
      .sort((a, b) => (gapBySkill.get(b)?.priority ?? 0) - (gapBySkill.get(a)?.priority ?? 0))
      .map((s) => gapBySkill.get(s)!.skill.name);

    let reason: string;
    if (gainsForYou.length >= 2) reason = `Closes your ${gainsForYou[0]} and ${gainsForYou[1]} gaps`;
    else if (gainsForYou.length === 1) reason = `Directly targets your ${gainsForYou[0]} gap`;
    else if (relevance === 1) reason = `Core portfolio piece for ${role.name}s`;
    else reason = "Great for broadening your stack";
    if (readyToStart >= 0.99 && gainsForYou.length) reason += " — and you already have what you need to start";

    return { project, matchScore: clamp(matchScore, 5, 99), reason, gainsForYou };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}

export function buildAnalysis(
  profile: StudentProfile,
  catalog: Catalog,
  overrides: ProgressOverrides = {},
): Analysis {
  const role = getRole(catalog, profile.targetRole);
  const gaps = computeGaps(profile, role, catalog);
  const readiness = computeReadiness(gaps);
  const roadmap = buildRoadmap(profile, role, overrides);
  const projects = recommendProjects(profile, role, gaps, catalog);

  const openGaps = gaps.filter((g) => g.gap > 0).sort((a, b) => b.priority - a.priority);
  const strengths = gaps.filter((g) => g.status === "ready" || g.current >= 60).sort((a, b) => b.current - a.current);

  const currentNode = roadmap.find((n) => n.status === "current");
  const nextSkill =
    (currentNode?.skill && openGaps.find((g) => g.skill.slug === currentNode.skill)) || openGaps[0] || null;

  const skillNodes = roadmap.filter((n) => n.skill);
  const overallProgress = Math.round(
    skillNodes.reduce((acc, n) => acc + n.progress, 0) / Math.max(1, skillNodes.length),
  );

  const estimatedWeeks = Math.max(
    1,
    Math.round(roadmap.reduce((acc, n) => acc + n.estimatedWeeks * (1 - n.progress / 100), 0)),
  );

  const radar = gaps
    .slice()
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 7)
    .map((g) => ({ skill: g.skill.name, current: g.current, required: g.required }));

  const top = strengths[0];
  const unlockCount = nextSkill
    ? roadmap.filter((n) => n.status === "locked" && n.skill).length
    : 0;
  const summary = nextSkill
    ? `You're ${readiness}% of the way to ${role.name}. ${
        top ? `${top.skill.name} is your strongest asset.` : "You're building from a fresh start."
      } Focus on ${nextSkill.skill.name} next — it unlocks ${unlockCount} more steps on your path.`
    : `You meet every requirement for ${role.name}. Time to build, ship and apply.`;

  return {
    role,
    readiness,
    gapScore: 100 - readiness,
    overallProgress,
    gaps: openGaps,
    strengths,
    nextSkill,
    roadmap,
    projects,
    summary,
    estimatedWeeks,
    radar,
  };
}

/** Quick readiness preview used during onboarding. */
export function previewReadiness(profile: StudentProfile, role: CareerRole, catalog: Catalog) {
  return computeReadiness(computeGaps(profile, role, catalog));
}

/** Streak helper: given the last activity date, compute the updated streak. */
export function nextStreak(lastActive: Date | null, streak: number, now = new Date()) {
  if (!lastActive) return 1;
  const day = 86_400_000;
  const last = new Date(lastActive).setHours(0, 0, 0, 0);
  const today = new Date(now).setHours(0, 0, 0, 0);
  const diff = Math.round((today - last) / day);
  if (diff === 0) return Math.max(1, streak);
  if (diff === 1) return streak + 1;
  return 1;
}
