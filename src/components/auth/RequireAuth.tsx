"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

/**
 * The only protected-route implementation in the app.
 * It never redirects while the session check is still running, which is what
 * caused the "logged in → page loads → suddenly login again" flash.
 */
export function RequireAuth({ children, returnTo }: { children: ReactNode; returnTo: string }) {
  const { isAuthenticated, isLoading, loggingOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || isAuthenticated || loggingOut) return;
    router.replace(`/login?next=${encodeURIComponent(returnTo)}`);
  }, [isLoading, isAuthenticated, loggingOut, router, returnTo]);

  if (isLoading) return <AuthPending label="Verifying your session" />;
  if (loggingOut) return <AuthPending label="Signing you out" />;
  if (!isAuthenticated) return <AuthPending label="Taking you to sign in" />;
  return <>{children}</>;
}

export function AuthPending({ label }: { label: string }) {
  return (
    <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-5 py-40">
      <span className="h-2 w-2 animate-pulse bg-electric" />
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-dim">{label}…</p>
    </div>
  );
}
