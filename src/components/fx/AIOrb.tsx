import { cn } from "@/lib/utils";

/** Geometric route mark. Kept so older surfaces never fall back to a glowing orb. */
export function AIOrb({ size = 56, className }: { size?: number; state?: "idle" | "thinking" | "speaking"; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className={cn("shrink-0", className)}>
      <path d="M8 50 L24 14 L40 42 L56 10" fill="none" stroke="#d6ff3c" strokeWidth="2" />
      <rect x="21" y="11" width="6" height="6" fill="#f4f0e6" transform="rotate(45 24 14)" />
      <rect x="53" y="7" width="6" height="6" fill="#ff4b2b" transform="rotate(45 56 10)" />
    </svg>
  );
}
