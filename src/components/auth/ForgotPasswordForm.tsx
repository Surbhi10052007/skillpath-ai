"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Mail } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authService } from "@/lib/api/services";
import { AuthShell, authFieldClass, authSubmitClass } from "./AuthShell";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<"form" | "submitting" | "sent">("form");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [notice, setNotice] = useState(
    "If an account exists for this email, a password reset link has been sent.",
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (phase === "submitting") return;
    setError(null);

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Enter a valid email address.");
      setShake((value) => value + 1);
      return;
    }

    setPhase("submitting");
    try {
      const result = await authService.forgotPassword(email.trim());
      setNotice(result.message);
      setPhase("sent");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We couldn't send the reset link. Please try again shortly.",
      );
      setPhase("form");
      setShake((value) => value + 1);
    }
  };

  return (
    <AuthShell eyebrow="Account recovery" heading={<>Find your<br />way back.</>} tagline="Your path is waiting.">
      <AnimatePresence mode="wait">
        {phase === "sent" ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="border border-electric p-8"
          >
            <Check className="h-8 w-8 text-electric" />
            <h2 className="mt-6 font-display text-5xl uppercase leading-none">Check your email</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted" role="status">{notice}</p>
            <p className="mt-3 text-xs leading-relaxed text-dim">
              The link expires in 30 minutes. If it doesn&apos;t arrive, check your spam folder.
            </p>
            <div className="mt-7 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setPhase("form");
                  setError(null);
                }}
                className="border border-fg/20 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-fg transition hover:border-electric hover:text-electric"
              >
                Use a different email
              </button>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted transition hover:text-fg"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to login
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key={shake}
            onSubmit={submit}
            animate={error ? { x: [0, -8, 8, -4, 0] } : { x: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
            noValidate
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-electric">Forgot password</p>
            <h2 className="font-display text-5xl uppercase">Reset link.</h2>
            <p className="pb-2 text-sm leading-relaxed text-muted">
              Enter your email address and we&apos;ll send you a secure reset link.
            </p>

            <label className="block text-sm text-muted">
              Email
              <span className="relative mt-2 block">
                <Mail className="pointer-events-none absolute left-0 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-dim" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@university.edu"
                  aria-invalid={Boolean(error)}
                  className={authFieldClass}
                />
              </span>
            </label>

            {error && (
              <p role="alert" className="border border-neon/40 px-3 py-2 text-sm text-neon">
                {error}
              </p>
            )}

            <button type="submit" disabled={phase === "submitting"} className={authSubmitClass}>
              {phase === "submitting" ? "Sending link..." : "Send reset link"}
              {phase !== "submitting" && <ArrowRight className="h-4 w-4" />}
            </button>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 pt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted transition hover:text-fg"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to login
            </Link>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
