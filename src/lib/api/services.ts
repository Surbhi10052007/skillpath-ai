import { request } from "./client";
import type {
  Activity,
  ActivityType,
  AuthUser,
  Catalog,
  ChatMessage,
  DashboardData,
  NodeStatus,
  Project,
  StudentProfile,
} from "@/types";

export interface ProfilePayload {
  name: string;
  email: string;
  headline: string;
  experienceLevel: StudentProfile["experienceLevel"];
  interests: string[];
  targetRole: string;
  weeklyHours: number;
  skills: { skill: string; level: number }[];
}

export const authService = {
  me: () => request<{ user: AuthUser | null }>("/auth/me", { cache: "no-store" }),
  login: (email: string, password: string) =>
    request<{ user: AuthUser; token: string }>("/auth/login", { method: "POST", body: { email, password } }),
  signup: (name: string, email: string, password: string) =>
    request<{ user: AuthUser; token: string }>("/auth/signup", { method: "POST", body: { name, email, password } }),

  /** Always resolves with a generic message — the API never reveals account existence. */
  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", { method: "POST", body: { email } }),

  /** POST (not a query string) so the token never lands in server access logs. */
  validateResetToken: (token: string) =>
    request<{ state: "valid" | "invalid" | "expired" | "used" }>("/auth/reset-password/validate", {
      method: "POST",
      body: { token },
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>("/auth/reset-password", { method: "POST", body: { token, password } }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
};

export const catalogService = {
  get: () => request<Catalog>("/catalog"),
  project: (slug: string) => request<{ project: Project }>(`/projects/${slug}`),
};

export const profileService = {
  get: () => request<{ profile: StudentProfile | null }>("/profile", { cache: "no-store" }),
  save: (payload: ProfilePayload) =>
    request<{ profile: StudentProfile; onboarded: boolean }>("/profile", { method: "PUT", body: payload }),
};

export const dashboardService = {
  /**
   * Resolves either the full dashboard or a benign `{ onboarded: false }`
   * payload for authenticated users who have not onboarded yet.
   */
  get: () =>
    request<DashboardData | { onboarded: false; code: string; error: string }>("/dashboard", {
      cache: "no-store",
    }),
};

export const roadmapService = {
  setStatus: (nodeSlug: string, status: NodeStatus) =>
    request<DashboardData>("/roadmap", { method: "PATCH", body: { nodeSlug, status } }),
};

export const chatService = {
  history: () => request<{ messages: ChatMessage[] }>("/chat", { cache: "no-store" }),
  send: (message: string, profile?: StudentProfile) =>
    request<{ message: ChatMessage }>("/chat", { method: "POST", body: { message, profile } }),
};

export const activityService = {
  list: () => request<{ activities: Activity[] }>("/activity", { cache: "no-store" }),
  log: (type: ActivityType, message: string) =>
    request<{ activities: Activity[] }>("/activity", { method: "POST", body: { type, message } }),
};
