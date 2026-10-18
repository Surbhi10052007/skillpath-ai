import type { AccentKey } from "@/lib/utils";

export type SkillCategory =
  | "languages"
  | "ai-ml"
  | "data"
  | "web"
  | "backend"
  | "devops"
  | "tools"
  | "design";

export interface Skill {
  slug: string;
  name: string;
  category: SkillCategory;
  description: string;
  related: string[];
}

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type Importance = 1 | 2 | 3;

export interface RoleRequirement {
  skill: string;
  requiredLevel: number;
  importance: Importance;
}

export interface RoadmapTemplateNode {
  slug: string;
  title: string;
  skill?: string;
  description: string;
  estimatedWeeks: number;
  resources: string[];
}

export interface CareerRole {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  accent: AccentKey;
  demand: number;
  avgSalary: string;
  requirements: RoleRequirement[];
  roadmap: RoadmapTemplateNode[];
}

export interface ProjectMilestone {
  title: string;
  description: string;
}

export interface Project {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  skills: string[];
  skillsGained: string[];
  estimatedHours: number;
  accent: AccentKey;
  roles: string[];
  stack: string[];
  milestones: ProjectMilestone[];
  outcomes: string[];
}

export interface UserSkill {
  skill: string;
  level: number;
}

export interface StudentProfile {
  name: string;
  email?: string;
  headline: string;
  experienceLevel: ExperienceLevel;
  interests: string[];
  targetRole: string;
  skills: UserSkill[];
  streak: number;
  weeklyHours: number;
}

export type GapStatus = "ready" | "close" | "gap" | "missing";

export interface SkillGap {
  skill: Skill;
  current: number;
  required: number;
  gap: number;
  importance: Importance;
  priority: number;
  status: GapStatus;
}

export type NodeStatus = "completed" | "current" | "locked";

export interface RoadmapNode extends RoadmapTemplateNode {
  index: number;
  status: NodeStatus;
  progress: number;
}

export interface ProjectRecommendation {
  project: Project;
  matchScore: number;
  reason: string;
  gainsForYou: string[];
}

export interface Analysis {
  role: CareerRole;
  readiness: number;
  gapScore: number;
  overallProgress: number;
  gaps: SkillGap[];
  strengths: SkillGap[];
  nextSkill: SkillGap | null;
  roadmap: RoadmapNode[];
  projects: ProjectRecommendation[];
  summary: string;
  estimatedWeeks: number;
  radar: { skill: string; current: number; required: number }[];
}

export type ActivityType = "skill" | "project" | "roadmap" | "streak" | "chat" | "profile";

export interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  suggestions?: string[];
}

export interface DashboardData {
  profile: StudentProfile;
  analysis: Analysis;
  activities: Activity[];
  source: "guest" | "account";
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  onboarded: boolean;
}

export interface Catalog {
  skills: Skill[];
  roles: CareerRole[];
  projects: Project[];
}

export type ProgressOverrides = Record<string, NodeStatus>;
