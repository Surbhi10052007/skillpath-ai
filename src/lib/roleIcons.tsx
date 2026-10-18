import { BarChart3, Brain, Cloud, Database, Layers, Server, Sparkles, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  brain: Brain,
  layers: Layers,
  chart: BarChart3,
  sparkles: Sparkles,
  server: Server,
  database: Database,
  cloud: Cloud,
};

export function roleIcon(name: string): LucideIcon {
  return ICONS[name] ?? Sparkles;
}
