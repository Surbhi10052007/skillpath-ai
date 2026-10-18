"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { UNAUTHORIZED_EVENT } from "@/lib/api/client";
import { authService, profileService } from "@/lib/api/services";
import { guestStore } from "@/lib/store/guest";
import type { AuthUser } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  /** True once the session check has resolved and a user exists. */
  isAuthenticated: boolean;
  /** True while the initial /api/auth/me check is in flight. */
  isLoading: boolean;
  /** Set when a request 401s after the user was previously signed in. */
  sessionExpired: boolean;
  /** True briefly during sign-out so route guards don't hijack the redirect. */
  loggingOut: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  clearSessionExpired: () => void;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** Locally mark onboarding complete so the UI updates without a refetch. */
  markOnboarded: () => void;
  /** @deprecated use isLoading — kept so existing callers keep compiling. */
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** After auth, push any guest onboarding data into the real account once. */
async function syncGuestProfile(user: AuthUser): Promise<AuthUser> {
  const guest = guestStore.getProfile();
  if (!guest) return user;
  try {
    await profileService.save({
      name: guest.name,
      email: user.email,
      headline: guest.headline,
      experienceLevel: guest.experienceLevel,
      interests: guest.interests,
      targetRole: guest.targetRole,
      weeklyHours: guest.weeklyHours,
      skills: guest.skills,
    });
    guestStore.clear();
    return { ...user, onboarded: true };
  } catch {
    return user;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  // Mirrors `user` so async callbacks never read a stale closure.
  const userRef = useRef<AuthUser | null>(null);
  const loggingOutRef = useRef(false);

  const refreshUser = useCallback(async () => {
    try {
      const { user: next } = await authService.me();
      // Signed in a moment ago, gone now → the cookie expired or was cleared.
      if (!next && userRef.current && !loggingOutRef.current) setSessionExpired(true);
      if (next) setSessionExpired(false);
      userRef.current = next;
      setUser(next);
      return next;
    } catch {
      userRef.current = null;
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // One session check for the whole app, on mount, then revalidated whenever
  // the route changes so an expired cookie is caught during navigation.
  useEffect(() => {
    void refreshUser();
  }, [refreshUser, pathname]);

  // Central 401 handling: any API route rejecting the cookie drops the session.
  useEffect(() => {
    const onUnauthorized = () => {
      if (userRef.current && !loggingOutRef.current) setSessionExpired(true);
      userRef.current = null;
      setUser(null);
      setIsLoading(false);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  // Keep tabs in sync: re-check the cookie when a tab regains focus.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshUser();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: next } = await authService.login(email, password);
    const synced = await syncGuestProfile(next);
    setSessionExpired(false);
    userRef.current = synced;
    setUser(synced);
    return synced;
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const { user: next } = await authService.signup(name, email, password);
    const synced = await syncGuestProfile(next);
    setSessionExpired(false);
    userRef.current = synced;
    setUser(synced);
    return synced;
  }, []);

  const logout = useCallback(async () => {
    // Suppress protected-route guards so the sign-out redirect wins the race.
    loggingOutRef.current = true;
    setLoggingOut(true);
    await authService.logout().catch(() => undefined);
    guestStore.clear();
    setSessionExpired(false);
    userRef.current = null;
    setUser(null);
    window.setTimeout(() => {
      loggingOutRef.current = false;
      setLoggingOut(false);
    }, 1500);
  }, []);

  const markOnboarded = useCallback(() => {
    setUser((current) => {
      if (!current || current.onboarded) return current;
      const next = { ...current, onboarded: true };
      userRef.current = next;
      return next;
    });
  }, []);

  const clearSessionExpired = useCallback(() => setSessionExpired(false), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      loading: isLoading,
      sessionExpired,
      loggingOut,
      refreshUser,
      clearSessionExpired,
      login,
      signup,
      logout,
      markOnboarded,
    }),
    [user, isLoading, sessionExpired, loggingOut, refreshUser, clearSessionExpired, login, signup, logout, markOnboarded],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
