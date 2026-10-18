"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

/** Small signal dot. Expands over links and nodes. Hidden on touch and reduced motion. */
export function SignalCursor() {
  const reduce = useReducedMotion();
  const [on, setOn] = useState(false);
  const [hot, setHot] = useState(false);
  const x = useMotionValue(-20);
  const y = useMotionValue(-20);
  const sx = useSpring(x, { stiffness: 700, damping: 40, mass: 0.2 });
  const sy = useSpring(y, { stiffness: 700, damping: 40, mass: 0.2 });

  useEffect(() => {
    if (reduce || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    setOn(true);
    const move = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      const target = event.target instanceof Element ? event.target : null;
      setHot(Boolean(target?.closest("a,button,[data-cursor]")));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [reduce, x, y]);

  if (!on) return null;
  return (
    <motion.div aria-hidden style={{ x: sx, y: sy }} className="pointer-events-none fixed left-0 top-0 z-[120] hidden md:block">
      <motion.div
        animate={{ scale: hot ? 1.8 : 1 }}
        transition={{ duration: 0.18 }}
        className="-translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-electric mix-blend-difference"
      />
    </motion.div>
  );
}
