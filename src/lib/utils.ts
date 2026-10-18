import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function greeting(name?: string) {
  const h = new Date().getHours();
  const word = h < 5 ? "Burning the midnight oil" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${word}, ${name}` : word;
}

export function levelLabel(level: number) {
  if (level >= 85) return "Expert";
  if (level >= 65) return "Confident";
  if (level >= 45) return "Comfortable";
  if (level >= 25) return "Learning";
  return "Curious";
}

export const ACCENTS = {
  violet: {
    text: "text-ink",
    bg: "bg-electric",
    soft: "bg-electric/15",
    border: "border-electric/50",
    glow: "shadow-glow-violet",
    hex: "#d6ff3c",
    gradient: "from-electric to-fg",
  },
  cyan: {
    text: "text-fg",
    bg: "bg-neon",
    soft: "bg-neon/15",
    border: "border-neon/50",
    glow: "shadow-glow-cyan",
    hex: "#ff4b2b",
    gradient: "from-neon to-electric",
  },
  blue: {
    text: "text-ink",
    bg: "bg-fg",
    soft: "bg-fg/10",
    border: "border-fg/30",
    glow: "shadow-glow-soft",
    hex: "#f4f0e6",
    gradient: "from-fg to-electric",
  },
  pink: {
    text: "text-fg",
    bg: "bg-neon",
    soft: "bg-neon/12",
    border: "border-neon/40",
    glow: "shadow-glow-cyan",
    hex: "#ff4b2b",
    gradient: "from-neon to-fg",
  },
  emerald: {
    text: "text-ink",
    bg: "bg-electric",
    soft: "bg-electric/12",
    border: "border-electric/40",
    glow: "shadow-glow-violet",
    hex: "#d6ff3c",
    gradient: "from-electric to-fg",
  },
  amber: {
    text: "text-ink",
    bg: "bg-amber",
    soft: "bg-amber/15",
    border: "border-amber/40",
    glow: "shadow-glow-soft",
    hex: "#ffb020",
    gradient: "from-amber to-neon",
  },
} as const;

export type AccentKey = keyof typeof ACCENTS;
