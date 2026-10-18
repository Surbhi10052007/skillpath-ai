"use client";

import { motion } from "framer-motion";
import { PencilLine } from "lucide-react";
import Link from "next/link";
import { useProfile } from "@/components/providers/ProfileProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { AuthPending } from "@/components/auth/RequireAuth";
import { ROLES } from "@/data/mock";
import { skillName } from "@/lib/skills";
import { levelLabel } from "@/lib/utils";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function ProfileView() {
  const { user } = useAuth();
  const { data, status } = useProfile();

  if (status === "loading") return <AuthPending label="Loading your profile" />;

  if (status === "needs-onboarding" || !data) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-40 text-center">
        <h1 className="font-display text-5xl uppercase">No profile yet.</h1>
        <p className="mt-4 text-muted">Build your path once and everything on SkillPath runs from it.</p>
        <Link href="/onboarding" className="mt-8 inline-block bg-electric px-6 py-3 font-mono text-xs uppercase tracking-[0.16em] text-ink">
          Build my path
        </Link>
      </div>
    );
  }

  const { profile, analysis } = data;
  const role = ROLES.find((item) => item.slug === profile.targetRole);

  return (
    <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-28">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-fg/10 pb-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-electric">Profile</p>
          <h1 className="mt-3 font-display text-6xl uppercase leading-[0.84] sm:text-8xl">{profile.name}</h1>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-dim">
            {profile.email ?? user?.email} · saved {data.source === "account" ? "to your account" : "on this device"}
          </p>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 border border-fg/20 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-fg transition hover:border-electric hover:text-electric"
        >
          <PencilLine className="h-3.5 w-3.5" /> Edit profile
        </Link>
      </div>

      <div className="mt-10 grid gap-px bg-fg/10 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Target role", value: role?.name ?? profile.targetRole },
          { label: "Experience", value: LEVEL_LABEL[profile.experienceLevel] ?? profile.experienceLevel },
          { label: "Weekly hours", value: `${profile.weeklyHours}h` },
          { label: "Readiness", value: `${analysis.readiness}%` },
        ].map((item) => (
          <div key={item.label} className="bg-ink px-5 py-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-dim">{item.label}</p>
            <p className="mt-2 font-display text-2xl uppercase leading-tight text-fg">{item.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-14">
        <h2 className="font-display text-4xl uppercase">Your skills</h2>
        <p className="mt-2 text-sm text-muted">Saved once. Every recommendation, the roadmap and Path AI read from this.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {profile.skills.map((skill, index) => (
            <motion.div
              key={skill.skill}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.3) }}
              className="border border-fg/12 p-4"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-xl uppercase">{skillName(skill.skill)}</p>
                <p className="font-mono text-[11px] text-electric">{skill.level}% · {levelLabel(skill.level)}</p>
              </div>
              <div className="mt-3 h-1 bg-fg/10">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.level}%` }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="block h-full bg-electric"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {profile.interests.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-4xl uppercase">Interests</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span key={interest} className="border border-fg/15 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-fg">
                {interest}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="mt-14 border border-fg/12 p-6">
        <h2 className="font-display text-3xl uppercase">Current focus</h2>
        <p className="mt-3 text-muted">{analysis.summary}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard" className="bg-electric px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink">Open dashboard</Link>
          <Link href="/roadmap" className="border border-fg/20 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-fg hover:border-electric hover:text-electric">View roadmap</Link>
        </div>
      </section>
    </div>
  );
}
