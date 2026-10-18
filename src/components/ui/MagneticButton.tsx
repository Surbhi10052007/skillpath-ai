"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import Link from "next/link";
import { useCallback, useRef, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface MagneticButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: Variant;
  size?: Size;
  className?: string;
  disabled?: boolean;
  strength?: number;
  ariaLabel?: string;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "text-ink bg-electric hover:bg-electric-2",
  secondary: "text-fg border border-fg/25 bg-transparent hover:border-electric hover:text-electric",
  ghost: "text-muted hover:text-fg hover:bg-fg/5",
  danger: "text-neon border border-neon/40 hover:bg-neon/10",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-6 text-[0.95rem] gap-2",
  lg: "h-14 px-8 text-base gap-2.5",
};

export function MagneticButton({
  children,
  href,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  className,
  disabled,
  strength = 0.35,
  ariaLabel,
  fullWidth,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  const onMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (reduce || disabled) return;
      const el = ref.current;
      if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      const rect = el.getBoundingClientRect();
      x.set((e.clientX - rect.left - rect.width / 2) * strength);
      y.set((e.clientY - rect.top - rect.height / 2) * strength);
    },
    [x, y, strength, reduce, disabled],
  );

  const onLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const inner = cn(
    "group relative inline-flex items-center justify-center overflow-hidden font-semibold uppercase tracking-[0.14em] transition-colors duration-300 select-none",
    "focus-visible:outline-2 focus-visible:outline-neon focus-visible:outline-offset-4",
    variantClasses[variant],
    sizeClasses[size],
    disabled && "pointer-events-none opacity-50",
    fullWidth && "w-full",
  );

  const content = (
    <>
      <span className="relative z-10 inline-flex items-center gap-[inherit]">{children}</span>
      {variant === "primary" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/25 opacity-0 blur-sm transition-opacity duration-300 group-hover:animate-shimmer group-hover:opacity-100"
        />
      )}
    </>
  );

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      className={cn("inline-block", fullWidth && "w-full", className)}
    >
      {href ? (
        <Link href={href} className={inner} aria-label={ariaLabel} onClick={onClick}>
          {content}
        </Link>
      ) : (
        <button type={type} onClick={onClick} className={inner} disabled={disabled} aria-label={ariaLabel}>
          {content}
        </button>
      )}
    </motion.div>
  );
}
