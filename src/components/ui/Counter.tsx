"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface CounterProps {
  value: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  /** Animate immediately instead of waiting for the viewport. */
  immediate?: boolean;
}

export function Counter({ value, duration = 1.6, delay = 0, prefix = "", suffix = "", decimals = 0, className, immediate }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!(inView || immediate)) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const from = started.current ? display : 0;
    started.current = true;
    const controls = animate(from, value, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, immediate, value, reduce]);

  return (
    <span ref={ref} className={className} aria-live="polite">
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
