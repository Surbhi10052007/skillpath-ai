"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { authService } from "@/lib/api/services";
import { AuthShell, authFieldClass, authSubmitClass } from "./AuthShell";

type TokenState = "checking" | "valid" | "invalid" | "expired" | "used" | "missing";

const LINK_ERRORS: Record<Exclude<TokenState, "checking" | "valid">, { title: string; body: string }> = {
  missing: {
    title: "Link incomplete.",
    body: "This reset link is missing its token. Request a new link to continue.",
  },
  invalid: {
    title: "Link not valid.",
    body: "We couldn't verify this reset link. It may have been mistyped or already replaced.",
  },
  expired: {
    title: "Link expired.",
    body: "Reset links are valid for 30 minutes. Request a fresh one and we'll email it right away.",
  },
  used: {
    title: "Link already used.",
    body: "This reset link has already been used. Request a new one if you still need to change your password.",
  },
};

function strengthOf(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 5);
}

const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Good", "Strong", "Excellent"];

export function ResetPasswordForm() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [tokenState, setTokenState] = useState<TokenState>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [phase, setPhase] = useState<"form" | "submitting" | "success">("form");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);

  // Validate the link before showing the form. The token is POSTed, never put
  // in a URL, so it stays out of server access logs.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("token");
    if (!fromUrl) {
      setTokenState("missing");
      return;
    }
    setToken(fromUrl);
    let active = true;
    authService
      .validateResetToken(fromUrl)
      .then(({ state }) => {
        if (active) setTokenState(state);
      })
      .catch(() => {
        if (active) setTokenState("invalid");
      });
    return () => {
      active = false;
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (phase === "submitting" || !token) return;
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setShake((value) => value + 1);
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      setShake((value) => value + 1);
      return;
    }

    setPhase("submitting");
    try {
      await authService.resetPassword(token, password);
      setPhase("success");
      // No session is created: the user signs in with the new password.
      window.setTimeout(() => router.push("/login?reset=1"), 1400);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "We couldn't reset your password.";
      setError(message);
      setPhase("form");
      setShake((value) => value + 1);
      // A dead link can't be retried — surface that instead of another attempt.
      if (/already been used/i.test(message)) setTokenState("used");
      else if (/expired/i.test(message)) setTokenState("expired");
      else if (/not valid/i.test(message)) setTokenState("invalid");
    }
  };

  const shell = (children: ReactNode) => (
    <AuthShell eyebrow="Account recovery" heading={<>New<br />password.</>} tagline="Back to your route.">
      {children}
    </AuthShell>
  );

  if (tokenState === "checking") {
    return shell(
      <div className="border border-fg/15 p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-electric">Verifying link</p>
        <div className="mt-6 flex items-center gap-3">
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="h-2 w-2 bg-electric"
          />
          <p className="text-sm text-muted">Checking your reset link…</p>
        </div>
      </div>,
    );
  }

  if (tokenState !== "valid") {
    const info = LINK_ERRORS[tokenState];
    return shell(
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="border border-neon/40 p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neon">Reset link</p>
        <h2 className="mt-4 font-display text-5xl uppercase leading-none">{info.title}</h2>
        <p role="alert" className="mt-4 text-sm leading-relaxed text-muted">{info.body}</p>
        <div className="mt-7 flex flex-col gap-3">
          <Link
            href="/forgot-password"
            className="inline-flex h-12 items-center justify-center gap-2 bg-electric font-mono text-xs uppercase tracking-[0.16em] text-ink transition hover:bg-electric-2"
          >
            Request a new link <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted transition hover:text-fg"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to login
          </Link>
        </div>
      </motion.div>,
    );
  }

  if (phase === "success") {
    return shell(
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="border border-electric p-8">
        <Check className="h-8 w-8 text-electric" />
        <h2 className="mt-6 font-display text-5xl uppercase leading-none">Password reset</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted" role="status">
          Password reset successfully. Please log in with your new password.
        </p>
        <Link
          href="/login?reset=1"
          className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 bg-electric font-mono text-xs uppercase tracking-[0.16em] text-ink transition hover:bg-electric-2"
        >
          Go to login <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>,
    );
  }

  const strength = strengthOf(password);
  const field = authFieldClass;

  return shell(
    <motion.form
      key={shake}
      onSubmit={submit}
      animate={error ? { x: [0, -8, 8, -4, 0] } : { x: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
      noValidate
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-electric">Reset password</p>
      <h2 className="font-display text-5xl uppercase">Reset your password</h2>
      <p className="pb-2 text-sm leading-relaxed text-muted">Choose a new password for your SkillPath account.</p>

      <label className="block text-sm text-muted">
        New password
        <span className="relative mt-2 block">
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            aria-describedby="password-strength"
            className={`${field} pr-14`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dim transition hover:text-fg"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </span>
      </label>

      {password.length > 0 && (
        <div id="password-strength" aria-live="polite">
          <div className="flex gap-1" aria-hidden>
            {[0, 1, 2, 3, 4].map((index) => (
              <span
                key={index}
                className={`h-1 flex-1 transition-colors ${index < strength ? (strength >= 4 ? "bg-electric" : strength >= 3 ? "bg-amber" : "bg-neon") : "bg-fg/10"}`}
              />
            ))}
          </div>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">{STRENGTH_LABELS[strength]}</p>
        </div>
      )}

      <label className="block text-sm text-muted">
        Confirm password
        <span className="relative mt-2 block">
          <input
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            type={showConfirm ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            className={`${field} pr-14`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((value) => !value)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dim transition hover:text-fg"
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </span>
      </label>

      {confirm.length > 0 && password !== confirm && (
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-neon">Passwords don&apos;t match yet</p>
      )}

      {error && (
        <p role="alert" className="border border-neon/40 px-3 py-2 text-sm text-neon">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={phase === "submitting" || !password || !confirm}
        className={authSubmitClass}
      >
        {phase === "submitting" ? "Resetting..." : "Reset password"}
        {phase !== "submitting" && <ArrowRight className="h-4 w-4" />}
      </button>

      <Link
        href="/login"
        className="inline-flex items-center gap-2 pt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted transition hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to login
      </Link>
    </motion.form>,
  );
}
