"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";
import { destinationFor, safeNext } from "@/lib/auth/next";
import type { AuthUser } from "@/types";

const NODES = ["Start", "Python", "SQL", "ML", "Projects", "Role"];

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { user, loading, login, signup } = useAuth();
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [phase, setPhase] = useState<"form" | "submitting" | "success">("form");
  const [welcome, setWelcome] = useState("");
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [nextReady, setNextReady] = useState(false);
  const [expired, setExpired] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(safeNext(params.get("next")));
    setExpired(params.get("expired") === "1");
    setResetDone(params.get("reset") === "1");
    setNextReady(true);
  }, []);

  useEffect(() => {
    if (nextReady && !loading && user && phase === "form") router.replace(destinationFor(user, nextPath));
  }, [nextReady, loading, user, nextPath, router, phase]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (phase !== "form") return;
    setError(null);
    setPhase("submitting");
    try {
      const account: AuthUser = isSignup ? await signup(name, email, password) : await login(email, password);
      setWelcome(account.name.split(" ")[0]);
      setPhase("success");
      window.setTimeout(() => router.push(destinationFor(account, nextPath)), 700);
    } catch (caught) {
      setPassword("");
      setError(caught instanceof Error ? caught.message : "We couldn't reach the server. Try again.");
      setPhase("form");
      setShake((value) => value + 1);
    }
  };

  const field = "h-12 w-full border border-fg/15 bg-ink px-4 text-sm text-fg outline-none transition focus:border-electric";

  return (
    <div className="min-h-dvh bg-ink">
      <Navbar />
      <main id="main" className="grid min-h-dvh pt-16 lg:grid-cols-2">
        <section className="relative hidden overflow-hidden border-r border-fg/10 px-10 py-16 lg:flex lg:flex-col lg:justify-end">
          <div aria-hidden className="absolute inset-0 grid-fade opacity-40" />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-electric">{isSignup ? "New route" : "Return signal"}</p>
            <h1 className="mt-4 font-display text-7xl uppercase leading-[0.82] xl:text-8xl">
              {isSignup ? <>Create<br />your<br />path.</> : <>Welcome<br />back.</>}
            </h1>
            <p className="mt-4 max-w-md font-serif text-3xl italic text-fg/80">{isSignup ? "Your path starts now." : "Your path is waiting."}</p>
            <div className="mt-12 flex flex-wrap items-center gap-3">
              {NODES.map((node, index) => (
                <motion.span key={node} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + index * 0.08 }} className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  <motion.span animate={{ scale: [1, 1.35, 1] }} transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.2 }} className={`h-2 w-2 ${index === 2 ? "bg-neon" : "bg-electric"}`} />
                  {node}
                  {index < NODES.length - 1 && <span className="text-fg/30">/</span>}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="flex items-center px-5 py-16 sm:px-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {phase === "success" ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="border border-electric p-8">
                  <Check className="h-8 w-8 text-electric" />
                  <h2 className="mt-6 font-display text-5xl uppercase leading-none">{isSignup ? "Account created" : `Welcome back, ${welcome}`}</h2>
                  <p className="mt-3 font-serif text-2xl italic text-muted">{isSignup ? "Your path starts now." : "Picking up your route."}</p>
                </motion.div>
              ) : (
                <motion.form key={shake} onSubmit={submit} animate={error ? { x: [0, -8, 8, -4, 0] } : { x: 0 }} transition={{ duration: 0.35 }} className="space-y-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-electric">{isSignup ? "Sign up" : "Sign in"}</p>
                  <h2 className="font-display text-5xl uppercase">{isSignup ? "Start here." : "Enter."}</h2>
                  {expired && !error && (
                    <p role="status" className="border border-amber/40 px-3 py-2 text-sm text-amber">
                      Your session expired. Sign in and we&apos;ll take you back to where you were.
                    </p>
                  )}
                  {resetDone && !error && (
                    <p role="status" className="border border-electric/40 px-3 py-2 text-sm text-electric">
                      Password reset successfully. Please log in with your new password.
                    </p>
                  )}
                  {nextPath && !expired && (
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                      Returning to {nextPath} after sign in
                    </p>
                  )}
                  {isSignup && (
                    <label className="block text-sm text-muted">
                      Name
                      <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} autoComplete="name" className={`${field} mt-2`} />
                    </label>
                  )}
                  <label className="block text-sm text-muted">
                    Email
                    <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" className={`${field} mt-2`} />
                  </label>
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label htmlFor="auth-password" className="text-sm text-muted">Password</label>
                      {!isSignup && (
                        <Link href="/forgot-password" className="font-mono text-[10px] uppercase tracking-[0.14em] text-electric transition hover:underline">
                          Forgot password?
                        </Link>
                      )}
                    </div>
                    <div className="relative">
                      <input id="auth-password" value={password} onChange={(event) => setPassword(event.target.value)} type={show ? "text" : "password"} required minLength={8} autoComplete={isSignup ? "new-password" : "current-password"} className={`${field} pr-16`} />
                      <button type="button" onClick={() => setShow((value) => !value)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-fg">
                        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {error && <p role="alert" className="border border-neon/40 px-3 py-2 text-sm text-neon">{error}</p>}
                  <button type="submit" disabled={phase !== "form"} className="flex h-12 w-full items-center justify-center gap-2 bg-electric font-mono text-xs uppercase tracking-[0.16em] text-ink transition hover:bg-electric-2 active:translate-y-px disabled:opacity-60">
                    {phase === "submitting" ? (isSignup ? "Creating account..." : "Signing in...") : isSignup ? "Create account" : "Sign in"} {phase === "form" && <ArrowRight className="h-4 w-4" />}
                  </button>
                  <p className="text-sm text-muted">
                    {isSignup ? "Already have a route?" : "Don't have an account?"}{" "}
                    <Link href={isSignup ? `/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}` : `/signup${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`} className="text-electric hover:underline">
                      {isSignup ? "Sign in" : "Create your path →"}
                    </Link>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
