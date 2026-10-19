import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { activities, chatMessages, profiles, roadmapProgress, userSkills, users } from "@/db/schema";
import { buildAnalysis, nextStreak } from "@/lib/engine/analysis";
import { loadCatalog } from "./catalog";
import type {
  Activity,
  ActivityType,
  ChatMessage,
  DashboardData,
  ExperienceLevel,
  NodeStatus,
  ProgressOverrides,
  StudentProfile,
} from "@/types";
import { clamp } from "@/lib/utils";

export interface ProfileInput {
  name: string;
  email: string;
  headline?: string;
  experienceLevel?: ExperienceLevel;
  interests?: string[];
  targetRole: string;
  weeklyHours?: number;
  skills: { skill: string; level: number }[];
}

export function validateProfileInput(body: unknown): { ok: true; data: ProfileInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid payload." };
  const b = body as Record<string, unknown>;
  if (typeof b.name !== "string" || b.name.trim().length < 2) return { ok: false, error: "Enter your name." };
  if (typeof b.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) return { ok: false, error: "Enter a valid email address." };
  if (typeof b.targetRole !== "string" || !b.targetRole) return { ok: false, error: "Pick a target role." };
  if (!Array.isArray(b.skills) || b.skills.length === 0) return { ok: false, error: "Select at least one skill." };
  const skills = b.skills
    .filter((s): s is { skill: string; level: number } => !!s && typeof s === "object" && typeof (s as { skill?: unknown }).skill === "string")
    .map((s) => ({ skill: s.skill, level: clamp(Number(s.level) || 0) }));
  const level = b.experienceLevel;
  return {
    ok: true,
    data: {
      name: b.name.trim().slice(0, 120),
      email: b.email.toLowerCase().trim().slice(0, 255),
      targetRole: b.targetRole,
      skills,
      headline: typeof b.headline === "string" ? b.headline.slice(0, 120) : "",
      experienceLevel: level === "beginner" || level === "intermediate" || level === "advanced" ? level : "beginner",
      interests: Array.isArray(b.interests) ? b.interests.filter((i): i is string => typeof i === "string").slice(0, 12) : [],
      weeklyHours: clamp(Number(b.weeklyHours) || 6, 1, 60),
    },
  };
}

export async function getStudentProfile(userId: number): Promise<StudentProfile | null> {
  const [row] = await db
    .select({ profile: profiles, name: users.name, email: users.email })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(eq(profiles.userId, userId))
    .limit(1);
  if (!row) return null;
  const skillRows = await db.select().from(userSkills).where(eq(userSkills.userId, userId));
  return {
    name: row.name,
    email: row.email,
    headline: row.profile.headline,
    experienceLevel: row.profile.experienceLevel as ExperienceLevel,
    interests: row.profile.interests,
    targetRole: row.profile.targetRole,
    skills: skillRows.map((s) => ({ skill: s.skillSlug, level: s.level })),
    streak: row.profile.streak,
    weeklyHours: row.profile.weeklyHours,
  };
}

export async function saveStudentProfile(userId: number, input: ProfileInput) {
  const now = new Date();
  await db.transaction(async (tx) => {
    const [emailOwner] = await tx.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
    if (emailOwner && emailOwner.id !== userId) throw new Error("That email is already connected to another account.");
    await tx.update(users).set({ name: input.name, email: input.email }).where(eq(users.id, userId));
    const [existing] = await tx.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    const values = {
      headline: input.headline ?? "",
      experienceLevel: input.experienceLevel ?? "beginner",
      interests: input.interests ?? [],
      targetRole: input.targetRole,
      weeklyHours: input.weeklyHours ?? 6,
      updatedAt: now,
    };
    if (existing) {
      // `profiles` row existence is the onboarding-complete signal (see
      // getCurrentUser). Repair a null onboardedAt so the timestamp is always
      // consistent with that signal.
      await tx
        .update(profiles)
        .set(existing.onboardedAt ? values : { ...values, onboardedAt: now })
        .where(eq(profiles.userId, userId));
      if (existing.targetRole !== input.targetRole) {
        // A new destination means a fresh roadmap.
        await tx.delete(roadmapProgress).where(eq(roadmapProgress.userId, userId));
      }
    } else {
      await tx.insert(profiles).values({ userId, ...values, streak: 1, lastActiveAt: now, onboardedAt: now });
    }

    await tx.delete(userSkills).where(eq(userSkills.userId, userId));
    if (input.skills.length) {
      await tx.insert(userSkills).values(
        input.skills.map((s) => ({ userId, skillSlug: s.skill, level: s.level, updatedAt: now })),
      );
    }
    await tx.insert(activities).values({
      userId,
      type: "profile",
      message: existing ? "Updated profile and re-ran skill analysis" : "Built your first personalized path",
    });
  });
}

export async function getProgressOverrides(userId: number): Promise<ProgressOverrides> {
  const rows = await db.select().from(roadmapProgress).where(eq(roadmapProgress.userId, userId));
  const map: ProgressOverrides = {};
  for (const r of rows) map[r.nodeSlug] = r.status as NodeStatus;
  return map;
}

export async function setNodeStatus(userId: number, nodeSlug: string, status: NodeStatus) {
  await db
    .insert(roadmapProgress)
    .values({ userId, nodeSlug, status, completedAt: status === "completed" ? new Date() : null })
    .onConflictDoUpdate({
      target: [roadmapProgress.userId, roadmapProgress.nodeSlug],
      set: { status, completedAt: status === "completed" ? new Date() : null },
    });
}

export async function bumpSkill(userId: number, skillSlug: string, minimumLevel: number) {
  const [row] = await db
    .select()
    .from(userSkills)
    .where(and(eq(userSkills.userId, userId), eq(userSkills.skillSlug, skillSlug)))
    .limit(1);
  const level = clamp(Math.max(row?.level ?? 0, minimumLevel));
  await db
    .insert(userSkills)
    .values({ userId, skillSlug, level, updatedAt: new Date() })
    .onConflictDoUpdate({ target: [userSkills.userId, userSkills.skillSlug], set: { level, updatedAt: new Date() } });
  return level;
}

export async function logActivity(userId: number, type: ActivityType, message: string) {
  await db.insert(activities).values({ userId, type, message });
}

export async function getActivities(userId: number, limit = 8): Promise<Activity[]> {
  const rows = await db
    .select()
    .from(activities)
    .where(eq(activities.userId, userId))
    .orderBy(desc(activities.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    id: String(r.id),
    type: r.type as ActivityType,
    message: r.message,
    createdAt: r.createdAt.toISOString(),
  }));
}

/** Updates the daily streak based on the last active timestamp. */
export async function touchStreak(userId: number) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (!profile) return;
  const streak = nextStreak(profile.lastActiveAt, profile.streak);
  if (streak !== profile.streak || Date.now() - profile.lastActiveAt.getTime() > 3_600_000) {
    await db.update(profiles).set({ streak, lastActiveAt: new Date() }).where(eq(profiles.userId, userId));
    if (streak > profile.streak && streak % 5 === 0) {
      await logActivity(userId, "streak", `${streak}-day learning streak — keep it going`);
    }
  }
}

export async function getDashboard(userId: number): Promise<DashboardData | null> {
  await touchStreak(userId);
  const profile = await getStudentProfile(userId);
  if (!profile) return null;
  const [catalog, overrides, recent] = await Promise.all([
    loadCatalog(),
    getProgressOverrides(userId),
    getActivities(userId),
  ]);
  return {
    profile,
    analysis: buildAnalysis(profile, catalog, overrides),
    activities: recent,
    source: "account",
  };
}

export async function getChatHistory(userId: number, limit = 30): Promise<ChatMessage[]> {
  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
  return rows.reverse().map((r) => ({
    id: String(r.id),
    role: r.role as ChatMessage["role"],
    content: r.content,
    suggestions: r.suggestions,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function saveChatTurn(
  userId: number,
  userMessage: string,
  reply: { content: string; suggestions: string[] },
) {
  await db.insert(chatMessages).values([
    { userId, role: "user", content: userMessage, suggestions: [] },
    { userId, role: "assistant", content: reply.content, suggestions: reply.suggestions },
  ]);
}
