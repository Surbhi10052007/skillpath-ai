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
  /** Re-read the profile from the server (or guest store). */
  refresh: () => Promise<void>;
  /** Apply a server response we already have, e.g. after a roadmap PATCH. */
  applyData: (next: DashboardData) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

/**
 * The single source of the signed-in student's profile + analysis.
 * Every surface (dashboard, roadmap, projects, home, assistant) reads from
 * here, so the app can never disagree with itself about who the user is or
 * whether they have onboarded.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const onboarded = user?.onboarded ?? false;
  const [data, setData] = useState<DashboardData | null>(null);
  const [status, setStatus] = useState<ProfileStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

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
    setError(null);
    if (isAuthenticated) {
      // The session already tells us whether a profile exists — skip the
      // guaranteed-404 round trip for users who haven't onboarded yet.
      if (!onboarded) {
        setData(null);
        setStatus("needs-onboarding");
        return;
      }
      try {
        const next = await dashboardService.get();
        setData(next);
        setStatus("ready");
      } catch (caught) {
        if (caught instanceof ApiError && caught.code === "NOT_ONBOARDED") {
          setData(null);
          setStatus("needs-onboarding");
          return;
        }
        if (caught instanceof ApiError && caught.status === 401) {
          // AuthProvider handles the session drop centrally.
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
    setData(guest);
    setStatus(guest ? "ready" : "anonymous");
  }, [isAuthenticated, onboarded, readGuest]);

  const refresh = useCallback(async () => {
    if (inFlight.current) return inFlight.current;
    const run = load().finally(() => {
      inFlight.current = null;
    });
    inFlight.current = run;
    return run;
  }, [load]);

  useEffect(() => {
    if (authLoading) {
      setStatus("loading");
      return;
    }
    void refresh();
  }, [authLoading, isAuthenticated, onboarded, refresh]);

  const applyData = useCallback((next: DashboardData) => {
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
