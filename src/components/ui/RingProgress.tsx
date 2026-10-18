"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RingProgressProps {
  value: number;
  size?: number;
  stroke?: number;
  from?: string;
  to?: string;
  trackColor?: string;
  delay?: number;
  className?: string;
  children?: ReactNode;
  label?: string;
  immediate?: boolean;
}

export function RingProgress({
  value,
  size = 120,
  stroke = 10,
  from = "#8b5cf6",
  to = "#22d3ee",
  trackColor = "rgba(255,255,255,0.07)",
  delay = 0,
  className,
  children,
  label,
  immediate,
}: RingProgressProps) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  const reduce = useReducedMotion();
  const active = inView || immediate;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, value)) / 100);

  return (
    <div
      ref={ref}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${value}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={`ring-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
          <filter id={`glow-${id}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#ring-${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          filter={`url(#glow-${id})`}
          initial={{ strokeDashoffset: reduce ? offset : c }}
          animate={active ? { strokeDashoffset: offset } : undefined}
          transition={{ duration: 1.6, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
