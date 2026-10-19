"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { PROJECTS, ROLES, SKILLS } from "@/data/mock";
import { ApiError } from "@/lib/api/client";
import { dashboardService } from "@/lib/api/services";
import { buildAnalysis } from "@/lib/engine/analysis";
import { guestStore } from "@/lib/store/guest";
import type { DashboardData } from "@/types";

const CATALOG = { skills: SKILLS, roles: ROLES, projects: PROJECTS };

export type ProfileStatus =
  | "loading"
  | "ready"
  | "needs-onboarding"
  | "anonymous"
  | "error";

interface ProfileContextValue {
  data: DashboardData | null;
  status: ProfileStatus;
  error: string | null;
  /** Re-read the profile from the server (or guest store). Always authoritative. */
  refresh: () => Promise<void>;
  /** Apply a server response we already have, e.g. after a roadmap PATCH. */
  applyData: (next: DashboardData) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

/**
 * The single source of the signed-in student's profile + analysis.
 *
 * IMPORTANT: `load` deliberately asks the server every time instead of
 * short-circuiting on a locally cached "onboarded" flag. That flag lives on the
 * auth user object, so a refresh fired immediately after onboarding used to run
 * with a *stale* closure (`onboarded: false`) and write `needs-onboarding` over
 * correct state — which bounced students straight back into onboarding.
 *
 * A monotonically increasing sequence number means only the newest request may
 * commit its result, so an in-flight older refresh can never clobber a newer one.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [status, setStatus] = useState<ProfileStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const sequence = useRef(0);

  const readGuest = useCallback((): DashboardData | null => {
    const profile = guestStore.getProfile();
    if (!profile) return null;
    return {
      profile,
      analysis: buildAnalysis(profile, CATALOG, guestStore.getProgress()),
      activities: guestStore.getActivities(),
      source: "guest",
    };
  }, []);

  const load = useCallback(async () => {
    const requestId = ++sequence.current;
    setError(null);

    if (isAuthenticated) {
      try {
        const next = await dashboardService.get();
        if (requestId !== sequence.current) return; // a newer load already answered
        // The endpoint answers 200 with { onboarded:false } rather than 404.
        if ("onboarded" in next && next.onboarded === false) {
          setData(null);
          setStatus("needs-onboarding");
          return;
        }
        setData(next as DashboardData);
        setStatus("ready");
      } catch (caught) {
        if (requestId !== sequence.current) return;
        if (caught instanceof ApiError && caught.code === "NOT_ONBOARDED") {
          setData(null);
          setStatus("needs-onboarding");
          return;
        }
        if (caught instanceof ApiError && caught.status === 401) {
          // AuthProvider owns the session-drop behaviour.
          setData(null);
          setStatus("anonymous");
          return;
        }
        setError(caught instanceof Error ? caught.message : "Could not load your profile.");
        setStatus("error");
      }
      return;
    }

    const guest = readGuest();
    if (requestId !== sequence.current) return;
    setData(guest);
    setStatus(guest ? "ready" : "anonymous");
  }, [isAuthenticated, readGuest]);

  const refresh = useCallback(() => load(), [load]);

  useEffect(() => {
    if (authLoading) {
      setStatus("loading");
      return;
    }
    void refresh();
  }, [authLoading, isAuthenticated, refresh]);

  const applyData = useCallback((next: DashboardData) => {
    // Treat externally-supplied data as the newest source of truth.
    sequence.current += 1;
    setData(next);
    setStatus("ready");
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({ data, status, error, refresh, applyData }),
    [data, status, error, refresh, applyData],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
