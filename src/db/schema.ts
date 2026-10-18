import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import type {
  ProjectMilestone,
  RoadmapTemplateNode,
  RoleRequirement,
} from "@/types";

/* ---------------- Catalog tables (seeded) ---------------- */
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  description: text("description").notNull().default(""),
  related: jsonb("related").$type<string[]>().notNull().default([]),
});

export const careerRoles = pgTable("career_roles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  tagline: text("tagline").notNull().default(""),
  description: text("description").notNull().default(""),
  icon: varchar("icon", { length: 32 }).notNull().default("sparkles"),
  accent: varchar("accent", { length: 16 }).notNull().default("violet"),
  demand: integer("demand").notNull().default(80),
  avgSalary: varchar("avg_salary", { length: 32 }).notNull().default(""),
  requirements: jsonb("requirements").$type<RoleRequirement[]>().notNull().default([]),
  roadmap: jsonb("roadmap").$type<RoadmapTemplateNode[]>().notNull().default([]),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 160 }).notNull(),
  tagline: text("tagline").notNull().default(""),
  description: text("description").notNull().default(""),
  difficulty: varchar("difficulty", { length: 16 }).notNull(),
  category: varchar("category", { length: 48 }).notNull().default(""),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  skillsGained: jsonb("skills_gained").$type<string[]>().notNull().default([]),
  estimatedHours: integer("estimated_hours").notNull().default(10),
  accent: varchar("accent", { length: 16 }).notNull().default("violet"),
  roles: jsonb("roles").$type<string[]>().notNull().default([]),
  stack: jsonb("stack").$type<string[]>().notNull().default([]),
  milestones: jsonb("milestones").$type<ProjectMilestone[]>().notNull().default([]),
  outcomes: jsonb("outcomes").$type<string[]>().notNull().default([]),
});

/* ---------------- User tables ---------------- */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  headline: varchar("headline", { length: 120 }).notNull().default(""),
  experienceLevel: varchar("experience_level", { length: 16 }).notNull().default("beginner"),
  interests: jsonb("interests").$type<string[]>().notNull().default([]),
  targetRole: varchar("target_role", { length: 64 }).notNull(),
  weeklyHours: integer("weekly_hours").notNull().default(6),
  streak: integer("streak").notNull().default(1),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }).notNull().defaultNow(),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userSkills = pgTable(
  "user_skills",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skillSlug: varchar("skill_slug", { length: 64 }).notNull(),
    level: integer("level").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_skills_user_skill_idx").on(t.userId, t.skillSlug)],
);

export const roadmapProgress = pgTable(
  "roadmap_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nodeSlug: varchar("node_slug", { length: 64 }).notNull(),
    status: varchar("status", { length: 16 }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("roadmap_progress_user_node_idx").on(t.userId, t.nodeSlug)],
);

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 16 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 16 }).notNull(),
  content: text("content").notNull(),
  suggestions: jsonb("suggestions").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------- Password reset ---------------- */
/**
 * Only a SHA-256 hash of the reset token is persisted — never the raw token.
 * Tokens are single-use (`usedAt`) and short-lived (`expiresAt`).
 */
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("password_reset_tokens_user_idx").on(t.userId)],
);
