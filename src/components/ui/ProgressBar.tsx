"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  /** Secondary "target" marker, e.g. required level. */
  target?: number;
  color?: string;
  label?: string;
  hint?: string;
  showValue?: boolean;
  height?: number;
  delay?: number;
  className?: string;
  immediate?: boolean;
}

export function ProgressBar({
  value,
  target,
  color = "#8b5cf6",
  label,
  hint,
  showValue = true,
  height = 8,
  delay = 0,
  className,
  immediate,
}: ProgressBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  const reduce = useReducedMotion();
  const active = inView || immediate;

  return (
    <div ref={ref} className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          {label && <span className="text-sm font-medium text-fg">{label}</span>}
          {showValue && (
            <span className="font-mono text-xs text-muted tabular-nums">
              {value}%{target !== undefined && <span className="text-dim"> / {target}%</span>}
            </span>
          )}
        </div>
      )}
      <div
        className="relative w-full overflow-hidden rounded-full bg-white/[0.06]"
        style={{ height }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        {target !== undefined && (
          <motion.span
            aria-hidden
            className="absolute inset-y-0 rounded-full border-r border-dashed border-white/40"
            initial={{ width: 0 }}
            animate={active ? { width: `${target}%` } : undefined}
            transition={{ duration: 1.2, delay: delay + 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: `linear-gradient(90deg, transparent, ${color}1f)` }}
          />
        )}
        <motion.div
          className="relative h-full rounded-full"
          initial={{ width: reduce ? `${value}%` : 0 }}
          animate={active ? { width: `${value}%` } : undefined}
          transition={{ duration: 1.3, delay, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: `linear-gradient(90deg, ${color}aa, ${color})`,
            boxShadow: `0 0 18px -2px ${color}`,
          }}
        >
          <span
            aria-hidden
            className="absolute inset-y-0 w-1/3 bg-white/30 blur-[2px] animate-shimmer"
          />
        </motion.div>
      </div>
      {hint && <p className="mt-1.5 text-xs text-dim">{hint}</p>}
    </div>
  );
}
