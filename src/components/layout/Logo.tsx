import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={cn("shrink-0", className)}>
      <path d="M4 26 L12 8 L20 22 L28 6" fill="none" stroke="#d6ff3c" strokeWidth="1.6" />
      <circle cx="12" cy="8" r="2.2" fill="#f4f0e6" />
      <circle cx="20" cy="22" r="2.2" fill="#ff4b2b" />
      <circle cx="28" cy="6" r="2.2" fill="#d6ff3c" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-end gap-2", className)} aria-label="SkillPath home">
      <LogoMark className="mb-0.5 transition-transform duration-500 group-hover:-translate-y-0.5" />
      <span className="font-display text-[1.35rem] font-medium uppercase leading-none tracking-[-0.04em] text-fg">
        Skill<span className="text-electric">Path</span>
      </span>
    </Link>
  );
}
