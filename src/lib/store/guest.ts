import type { Activity, ChatMessage, ProgressOverrides, StudentProfile } from "@/types";

/**
 * Guest mode persistence. Lets a student complete onboarding and use the
 * dashboard before creating an account; everything syncs to the API on signup.
 */
const KEYS = {
  profile: "skillpath:guest:profile",
  progress: "skillpath:guest:progress",
  activity: "skillpath:guest:activity",
  chat: "skillpath:guest:chat",
} as const;

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — ignore */
  }
}

export const guestStore = {
  getProfile: () => read<StudentProfile | null>(KEYS.profile, null),
  setProfile: (profile: StudentProfile) => write(KEYS.profile, profile),
  getProgress: () => read<ProgressOverrides>(KEYS.progress, {}),
  setProgress: (progress: ProgressOverrides) => write(KEYS.progress, progress),
  getActivities: () => read<Activity[]>(KEYS.activity, []),
  addActivity: (activity: Omit<Activity, "id" | "createdAt">) => {
    const next: Activity[] = [
      { ...activity, id: `g-${Date.now()}`, createdAt: new Date().toISOString() },
      ...read<Activity[]>(KEYS.activity, []),
    ].slice(0, 20);
    write(KEYS.activity, next);
    return next;
  },
  getChat: () => read<ChatMessage[]>(KEYS.chat, []),
  setChat: (messages: ChatMessage[]) => write(KEYS.chat, messages.slice(-40)),
  clear: () => {
    if (!isBrowser()) return;
    Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
  },
  hasProfile: () => !!read<StudentProfile | null>(KEYS.profile, null),
};
