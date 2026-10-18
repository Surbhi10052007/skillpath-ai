"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * `useReducedMotion` resolves to `true` on the very first client render while
 * the server rendered `false`, which trips React hydration (error #418) in any
 * component whose *markup* branches on it. This defers the switch until after
 * mount so SSR and first paint always agree.
 */
export function useSafeReducedMotion() {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && Boolean(reduce);
}
