"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChipProps {
  children: ReactNode;
  color?: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md";
  icon?: ReactNode;
}

export function Chip({ children, color, selected, onClick, className, size = "sm", icon }: ChipProps) {
  const base = cn(
    "inline-flex items-center gap-1.5 rounded-full border font-medium tracking-tight transition-colors duration-300",
    size === "sm" ? "h-7 px-3 text-xs" : "h-9 px-4 text-sm",
    selected
      ? "border-electric/60 bg-electric/20 text-white shadow-[0_0_24px_-6px_rgba(139,92,246,.9)]"
      : "border-white/10 bg-white/[0.04] text-muted hover:border-white/25 hover:text-fg",
    className,
  );

  const dot = color ? (
    <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
  ) : null;

  if (onClick) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        whileTap={{ scale: 0.94 }}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className={cn(base, "cursor-pointer select-none")}
      >
        {icon ?? dot}
        {children}
      </motion.button>
    );
  }
  return (
    <span className={base}>
      {icon ?? dot}
      {children}
    </span>
  );
}
