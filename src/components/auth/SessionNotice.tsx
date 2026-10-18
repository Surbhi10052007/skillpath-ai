"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

const PUBLIC = ["/", "/login", "/signup"];

/** One place that tells the user their session ended, then moves them to login. */
export function SessionNotice() {
  const { sessionExpired, clearSessionExpired } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!sessionExpired) return;
    const timer = window.setTimeout(() => {
      clearSessionExpired();
      if (!PUBLIC.includes(pathname)) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}&expired=1`);
      }
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [sessionExpired, pathname, router, clearSessionExpired]);

  return (
    <AnimatePresence>
      {sessionExpired && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed left-1/2 top-20 z-[130] -translate-x-1/2 border border-neon bg-ink px-5 py-3"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-neon">
            Your session has expired. Please sign in again.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
