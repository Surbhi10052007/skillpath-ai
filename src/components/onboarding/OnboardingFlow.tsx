"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Mail,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfile } from "@/components/providers/ProfileProvider";
import { AIOrb } from "@/components/fx/AIOrb";
import { GradientBlobs } from "@/components/fx/GradientBlobs";
import { Logo } from "@/components/layout/Logo";
import { Chip } from "@/components/ui/Chip";
import { MagneticButton } from "@/components/ui/MagneticButton";
import {
  INTERESTS,
  PROJECTS,
  ROLES,
  SKILLS,
  SKILL_CATEGORIES,
} from "@/data/mock";
import { profileService } from "@/lib/api/services";
import { guestStore } from "@/lib/store/guest";
import { roleIcon } from "@/lib/roleIcons";
import { ACCENTS, cn, levelLabel } from "@/lib/utils";
import type { ExperienceLevel, StudentProfile } from "@/types";

const CATALOG = { skills: SKILLS, roles: ROLES, projects: PROJECTS };
const PRIMARY_ROLE_SLUGS = [
  "ai-ml-engineer",
  "frontend-engineer",
  "full-stack-developer",
  "data-scientist",
  "backend-engineer",
];
const PRIMARY_ROLES = ROLES.filter((role) => PRIMARY_ROLE_SLUGS.includes(role.slug)).sort(
  (a, b) => PRIMARY_ROLE_SLUGS.indexOf(a.slug) - PRIMARY_ROLE_SLUGS.indexOf(b.slug),
);

const STEPS = [
  { key: "about", title: "Let’s start with you.", short: "About you" },
  { key: "skills", title: "What do you already know?", short: "Your skills" },
  { key: "goal", title: "Where do you want to go?", short: "Your goal" },
  { key: "interests", title: "What kind of things do you enjoy building?", short: "Interests" },
  { key: "build", title: "Ready? Let’s build your path.", short: "Build" },
] as const;

const LEVELS: { key: ExperienceLevel; label: string; blurb: string }[] = [
  { key: "beginner", label: "Beginner", blurb: "I’m learning the foundations and trying things out." },
  { key: "intermediate", label: "Intermediate", blurb: "I’ve built a few things and can work independently." },
  { key: "advanced", label: "Advanced", blurb: "I’ve shipped projects and want more depth." },
];

const WEEKLY_TIME = [
  { label: "2–5 hours", value: 4 },
  { label: "5–10 hours", value: 8 },
  { label: "10–15 hours", value: 12 },
  { label: "15+ hours", value: 16 },
];

const CATEGORY_COLORS: Record<string, string> = {
  languages: "#a78bfa",
  "ai-ml": "#e879f9",
  data: "#3b82f6",
  web: "#22d3ee",
  backend: "#34d399",
  devops: "#fbbf24",
  tools: "#fb7185",
  design: "#f472b6",
};

const BUILD_STAGES = [
  "Mapping your skills...",
  "Finding skill gaps...",
  "Matching projects...",
  "Building your roadmap...",
];

const STEP_HELP = [
  "Don’t worry if you’re just starting. This helps us meet you where you are.",
  "You don’t need to know everything. Pick anything you’ve used, then rate it honestly.",
  "Choose the direction that feels most exciting. You can change it later.",
  "Optional, but helpful. Your interests make project suggestions feel more like you.",
  "We’ll figure out the next step with you — and everything stays editable.",
];

interface FormState {
  name: string;
  email: string;
  experienceLevel: ExperienceLevel;
  weeklyHours: number;
  selected: string[];
  levels: Record<string, number>;
  targetRole: string;
  interests: string[];
}

const ease = [0.22, 1, 0.36, 1] as const;
const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function OnboardingFlow() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { user, loading, markOnboarded } = useAuth();
  const { refresh: refreshProfile } = useProfile();
  const [hydrated, setHydrated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [query, setQuery] = useState("");
  const [building, setBuilding] = useState(false);
  const [buildStage, setBuildStage] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    experienceLevel: "beginner",
    weeklyHours: 4,
    selected: [],
    levels: {},
    targetRole: "",
    interests: [],
  });

  /**
   * Prefill from whatever already exists so a returning student is never asked
   * to re-enter data: saved account profile first, then a local guest draft.
   */
  useEffect(() => {
    if (loading || hydrated) return;
    let active = true;

    const hydrate = async () => {
      const apply = (source: StudentProfile, editing: boolean) => {
        if (!active) return;
        setForm({
          name: source.name || user?.name || "",
          email: source.email || user?.email || "",
          experienceLevel: source.experienceLevel,
          weeklyHours: source.weeklyHours,
          selected: source.skills.map((skill) => skill.skill),
          levels: Object.fromEntries(source.skills.map((skill) => [skill.skill, skill.level])),
          targetRole: source.targetRole,
          interests: source.interests,
        });
        setIsEditing(editing);
      };

      if (user) {
        try {
          const { profile } = await profileService.get();
          if (profile) {
            apply(profile, true);
            setHydrated(true);
            return;
          }
        } catch {
          /* fall through to guest/blank */
        }
      }

      const guest = guestStore.getProfile();
      if (guest) apply(guest, false);
      else if (active) {
        setForm((current) => ({
          ...current,
          name: current.name || user?.name || "",
          email: current.email || user?.email || "",
        }));
      }
      if (active) setHydrated(true);
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, [user, loading, hydrated]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleSkill = (slug: string) => {
    setForm((current) => {
      const selected = current.selected.includes(slug);
      return {
        ...current,
        selected: selected
          ? current.selected.filter((skill) => skill !== slug)
          : [...current.selected, slug],
        levels: selected
          ? current.levels
          : { ...current.levels, [slug]: current.levels[slug] ?? 40 },
      };
    });
  };

  const selectedRole = ROLES.find((role) => role.slug === form.targetRole);
  const weeklyLabel = WEEKLY_TIME.find((option) => option.value === form.weeklyHours)?.label ?? `${form.weeklyHours} hours`;
  const draftProfile = useMemo<StudentProfile>(
    () => ({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      headline: `${LEVELS.find((level) => level.key === form.experienceLevel)?.label ?? "Beginner"} learner`,
      experienceLevel: form.experienceLevel,
      interests: form.interests,
      targetRole: form.targetRole || PRIMARY_ROLES[0].slug,
      skills: form.selected.map((skill) => ({ skill, level: form.levels[skill] ?? 40 })),
      streak: 1,
      weeklyHours: form.weeklyHours,
    }),
    [form],
  );

  const canContinue = [
    form.name.trim().length >= 2 && validEmail(form.email),
    form.selected.length > 0,
    Boolean(form.targetRole),
    true,
    true,
  ][step];

  const validationHint = [
    !form.name.trim() ? "Add your name to continue." : "Enter a valid email address.",
    "Pick at least one skill — even if you’ve only just started learning it.",
    "Choose one primary career goal.",
    "",
    "",
  ][step];

  const goTo = (next: number) => {
    if (next > step && !canContinue) {
      setTouched(true);
      return;
    }
    setTouched(false);
    setDirection(next > step ? 1 : -1);
    setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const generatePath = async () => {
    if (building) return;
    setBuilding(true);
    setError(null);
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, reduce ? 20 : ms));

    for (let index = 0; index < BUILD_STAGES.length; index += 1) {
      setBuildStage(index);
      await wait(360);
    }

    try {
      if (user) {
        await profileService.save({
          name: draftProfile.name,
          email: draftProfile.email ?? user.email,
          headline: draftProfile.headline,
          experienceLevel: draftProfile.experienceLevel,
          interests: draftProfile.interests,
          targetRole: draftProfile.targetRole,
          weeklyHours: draftProfile.weeklyHours,
          skills: draftProfile.skills,
        });
        guestStore.clear();
        markOnboarded();
      } else {
        guestStore.setProfile(draftProfile);
        guestStore.setProgress({});
        guestStore.addActivity({ type: "profile", message: "Built your first personalized path" });
      }
      await refreshProfile();
      setBuildStage(BUILD_STAGES.length);
      await wait(300);
      router.push(isEditing ? "/profile" : "/dashboard");
    } catch (caught) {
      setBuilding(false);
      setBuildStage(-1);
      setError(caught instanceof Error ? caught.message : "We couldn’t save your path. Please try again.");
    }
  };

  const filteredSkills = SKILLS.filter((skill) =>
    skill.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const progress = ((step + 1) / STEPS.length) * 100;
  const inputClass =
    "h-12 w-full rounded-2xl border border-white/10 bg-ink/50 pl-11 pr-4 text-sm text-fg placeholder:text-dim transition focus:border-electric/60 focus:outline-none focus:shadow-[0_0_0_4px_rgba(139,92,246,.12)]";

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <GradientBlobs className="-z-10" />
      <div aria-hidden className="absolute inset-0 -z-10 grid-fade opacity-50" />

      <div className="mx-auto grid min-h-dvh max-w-7xl lg:grid-cols-[310px_1fr]">
        <aside className="flex flex-col justify-between border-white/[0.06] px-6 py-6 lg:border-r lg:px-8 lg:py-10">
          <div>
            <Logo />
            <ol className="mt-10 hidden space-y-1 lg:block" aria-label="Onboarding steps">
              {STEPS.map((item, index) => {
                const state = index < step ? "done" : index === step ? "active" : "todo";
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => index < step && goTo(index)}
                      disabled={index > step}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition",
                        state === "active" && "bg-white/[0.05]",
                        state === "todo" && "opacity-45",
                        index < step && "hover:bg-white/[0.04]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs",
                          state === "done" && "border-transparent bg-gradient-to-br from-electric to-neon text-white",
                          state === "active" && "border-electric-2 text-electric-2 shadow-[0_0_20px_-4px_rgba(167,139,250,.9)]",
                          state === "todo" && "border-white/10 text-dim",
                        )}
                      >
                        {state === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : `0${index + 1}`}
                      </span>
                      <span className={cn("text-sm font-medium", state === "active" ? "text-fg" : "text-muted")}>{item.short}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mt-8 hidden lg:block">
            <div className="glass rounded-3xl p-5">
              <div className="flex items-center gap-3">
                <AIOrb size={34} state={building ? "thinking" : "idle"} />
                <p className="text-xs leading-relaxed text-muted">{STEP_HELP[step]}</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex flex-col px-6 py-6 lg:px-12 lg:py-10" aria-live="polite">
          <div className="mb-8">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.25em] text-dim">
              <span>Step {step + 1} of {STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-electric via-electric-2 to-neon shadow-[0_0_12px_rgba(139,92,246,.8)]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease }}
              />
            </div>
          </div>

          <div className="relative flex-1">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={step}
                custom={direction}
                initial={{ opacity: 0, x: direction * 36, filter: "blur(5px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: direction * -36, filter: "blur(5px)" }}
                transition={{ duration: 0.42, ease }}
              >
                <p className="eyebrow mb-4">
                  {isEditing ? `Editing profile · ${STEPS[step].short}` : STEPS[step].short}
                </p>
                <h1 className="max-w-4xl font-display text-4xl font-extrabold tracking-[-0.03em] text-fg sm:text-5xl">
                  {isEditing && step === 0 ? "Update your details." : STEPS[step].title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{STEP_HELP[step]}</p>

                {step === 0 && (
                  <div className="mt-10 max-w-3xl space-y-8">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="mb-2 block text-sm text-muted">Name</label>
                        <div className="relative">
                          <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
                          <input
                            id="name"
                            value={form.name}
                            onChange={(event) => update("name", event.target.value)}
                            placeholder="What should we call you?"
                            autoComplete="name"
                            autoFocus
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="email" className="mb-2 block text-sm text-muted">Email</label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
                          <input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(event) => update("email", event.target.value)}
                            placeholder="you@university.edu"
                            autoComplete="email"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-sm text-muted">Experience level</p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {LEVELS.map((level) => (
                          <button
                            key={level.key}
                            type="button"
                            onClick={() => update("experienceLevel", level.key)}
                            aria-pressed={form.experienceLevel === level.key}
                            className={cn(
                              "rounded-3xl border p-4 text-left transition-all duration-300",
                              form.experienceLevel === level.key
                                ? "border-electric/60 bg-electric/15 shadow-glow-violet"
                                : "border-white/10 bg-white/[0.03] hover:border-white/25",
                            )}
                          >
                            <p className="font-display text-base font-bold text-fg">{level.label}</p>
                            <p className="mt-1 text-xs leading-relaxed text-muted">{level.blurb}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 flex items-center gap-2 text-sm text-muted">
                        <Clock3 className="h-4 w-4" /> Weekly time available
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {WEEKLY_TIME.map((option) => (
                          <Chip
                            key={option.value}
                            size="md"
                            selected={form.weeklyHours === option.value}
                            onClick={() => update("weeklyHours", option.value)}
                          >
                            {option.label}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    {touched && !canContinue && <p role="alert" className="text-sm text-coral">{validationHint}</p>}
                  </div>
                )}

                {step === 1 && (
                  <div className="mt-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="relative max-w-sm flex-1">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
                        <input
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Search skills…"
                          aria-label="Search skills"
                          className="h-11 w-full rounded-full border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-fg placeholder:text-dim focus:border-electric/50 focus:outline-none"
                        />
                      </div>
                      <p className={cn("font-mono text-xs uppercase tracking-widest", form.selected.length ? "text-mint" : "text-muted")}>{form.selected.length} selected</p>
                    </div>

                    <div className="mt-7 max-h-[38vh] space-y-6 overflow-y-auto pr-2 no-scrollbar sm:max-h-[34vh]">
                      {SKILL_CATEGORIES.map((category) => {
                        const categorySkills = filteredSkills.filter((skill) => skill.category === category.key);
                        if (!categorySkills.length) return null;
                        return (
                          <div key={category.key}>
                            <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-dim">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: CATEGORY_COLORS[category.key] }} />
                              {category.label}
                            </p>
                            <div className="flex flex-wrap gap-2.5">
                              {categorySkills.map((skill) => {
                                const selected = form.selected.includes(skill.slug);
                                return (
                                  <motion.button
                                    key={skill.slug}
                                    type="button"
                                    onClick={() => toggleSkill(skill.slug)}
                                    aria-pressed={selected}
                                    whileHover={{ y: -2, scale: 1.03 }}
                                    whileTap={{ scale: 0.96 }}
                                    className={cn(
                                      "relative h-10 rounded-full border px-4 text-sm font-medium transition-colors duration-300",
                                      selected
                                        ? "border-transparent text-white"
                                        : "border-white/10 bg-white/[0.03] text-muted hover:border-white/25 hover:text-fg",
                                    )}
                                    style={selected ? { background: `linear-gradient(135deg, ${CATEGORY_COLORS[category.key]}cc, ${CATEGORY_COLORS[category.key]}66)`, boxShadow: `0 0 24px -7px ${CATEGORY_COLORS[category.key]}` } : undefined}
                                  >
                                    {selected && <Check className="mr-1.5 inline h-3.5 w-3.5" strokeWidth={3} />}
                                    {skill.name}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <AnimatePresence>
                      {form.selected.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-8 border-t border-white/[0.08] pt-7"
                        >
                          <h2 className="font-display text-2xl font-bold text-fg">How confident are you?</h2>
                          <p className="mt-1 text-sm text-muted">A rough answer is perfect. You can update this anytime.</p>
                          <div className="mt-5 grid gap-3 md:grid-cols-2">
                            {form.selected.map((slug) => {
                              const skill = SKILLS.find((item) => item.slug === slug)!;
                              const value = form.levels[slug] ?? 40;
                              const color = CATEGORY_COLORS[skill.category];
                              return (
                                <motion.div layout key={slug} className="glass rounded-3xl p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <label htmlFor={`confidence-${slug}`} className="text-sm font-semibold text-fg">{skill.name}</label>
                                    <span className="font-mono text-xs" style={{ color }}>{value}% · {levelLabel(value)}</span>
                                  </div>
                                  <input
                                    id={`confidence-${slug}`}
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={5}
                                    value={value}
                                    onChange={(event) => update("levels", { ...form.levels, [slug]: Number(event.target.value) })}
                                    className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_14px_var(--c)]"
                                    style={{ ["--c" as string]: color, background: `linear-gradient(90deg, ${color} ${value}%, rgba(255,255,255,0.08) ${value}%)` }}
                                  />
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {touched && !form.selected.length && <p role="alert" className="mt-6 text-sm text-coral">{validationHint}</p>}
                  </div>
                )}

                {step === 2 && (
                  <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {PRIMARY_ROLES.map((role) => {
                      const Icon = roleIcon(role.icon);
                      const accent = ACCENTS[role.accent];
                      const selected = form.targetRole === role.slug;
                      return (
                        <motion.button
                          key={role.slug}
                          type="button"
                          onClick={() => update("targetRole", role.slug)}
                          aria-pressed={selected}
                          whileHover={{ y: -5 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "group relative min-h-48 overflow-hidden rounded-4xl border p-6 text-left transition-colors duration-300",
                            selected
                              ? cn("bg-white/[0.07]", accent.border)
                              : "border-white/10 bg-white/[0.03] hover:border-white/25",
                          )}
                          style={selected ? { boxShadow: `0 0 50px -12px ${accent.hex}` } : undefined}
                        >
                          <div aria-hidden className="absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-35 blur-3xl transition-opacity group-hover:opacity-60" style={{ background: accent.hex }} />
                          <div className="relative flex h-full flex-col">
                            <div className="flex items-start justify-between">
                              <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", accent.soft, accent.text)}>
                                <Icon className="h-6 w-6 transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110" />
                              </span>
                              {selected && <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-electric to-neon text-white"><Check className="h-4 w-4" strokeWidth={3} /></span>}
                            </div>
                            <h2 className="mt-6 font-display text-xl font-bold text-fg">{role.name}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-muted">{role.tagline}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                    {touched && !form.targetRole && <p role="alert" className="text-sm text-coral sm:col-span-2">{validationHint}</p>}
                  </div>
                )}

                {step === 3 && (
                  <div className="mt-10 max-w-4xl">
                    <div className="flex flex-wrap gap-3">
                      {INTERESTS.map((interest, index) => {
                        const selected = form.interests.includes(interest);
                        return (
                          <motion.div
                            key={interest}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.035 }}
                          >
                            <Chip
                              size="md"
                              selected={selected}
                              onClick={() => update("interests", selected ? form.interests.filter((item) => item !== interest) : [...form.interests, interest])}
                            >
                              {interest}
                            </Chip>
                          </motion.div>
                        );
                      })}
                    </div>
                    <div className="glass mt-10 rounded-4xl p-6">
                      <div className="flex items-start gap-4">
                        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-electric-2" />
                        <div>
                          <p className="font-semibold text-fg">This step is optional.</p>
                          <p className="mt-1 text-sm leading-relaxed text-muted">Interests help us recommend projects you’ll actually want to finish. Skip it if you’re still figuring that out.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="mt-9 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
                    <div className="glass rounded-4xl p-6 sm:p-8">
                      <p className="eyebrow mb-6">Your starting point</p>
                      <dl className="space-y-5 text-sm">
                        <div className="flex items-center justify-between gap-5 border-b border-white/[0.06] pb-4">
                          <dt className="text-muted">Student</dt>
                          <dd className="text-right font-semibold text-fg">{form.name} · {LEVELS.find((item) => item.key === form.experienceLevel)?.label}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-5 border-b border-white/[0.06] pb-4">
                          <dt className="text-muted">Weekly time</dt>
                          <dd className="font-semibold text-fg">{weeklyLabel}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-5 border-b border-white/[0.06] pb-4">
                          <dt className="text-muted">Target role</dt>
                          <dd className="text-right font-display text-lg font-bold text-gradient">{selectedRole?.name}</dd>
                        </div>
                        <div>
                          <dt className="mb-3 text-muted">Current skills</dt>
                          <dd className="flex flex-wrap gap-2">
                            {draftProfile.skills.map((item) => (
                              <span key={item.skill} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-fg">
                                {CATALOG.skills.find((skill) => skill.slug === item.skill)?.name}
                                <span className="ml-1.5 font-mono text-electric-2">{item.level}%</span>
                              </span>
                            ))}
                          </dd>
                        </div>
                        <div>
                          <dt className="mb-3 text-muted">Interests</dt>
                          <dd className="flex flex-wrap gap-2">
                            {form.interests.length ? form.interests.map((interest) => (
                              <span key={interest} className="rounded-full border border-neon/20 bg-neon/[0.07] px-3 py-1.5 text-xs text-neon">{interest}</span>
                            )) : <span className="text-xs text-dim">No interests selected — that’s completely fine.</span>}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="glass-strong relative flex min-h-[390px] flex-col items-center justify-center overflow-hidden rounded-4xl p-8 text-center">
                      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(139,92,246,0.3),transparent_58%)]" />
                      <AIOrb size={112} state={building ? "thinking" : "idle"} />
                      <AnimatePresence mode="wait">
                        {!building ? (
                          <motion.div key="ready" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative mt-8">
                            <h2 className="font-display text-2xl font-bold text-fg">Everything looks good.</h2>
                            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">We’ll compare your real skills with what {selectedRole?.name} roles expect, then turn the gaps into clear next steps.</p>
                            <div className="mt-7">
                              <MagneticButton onClick={() => void generatePath()} size="lg">
                                {isEditing ? "Save changes" : "Generate My Path"} <ArrowRight className="h-5 w-5" />
                              </MagneticButton>
                            </div>
                            {error && <p role="alert" className="mt-4 text-sm text-coral">{error}</p>}
                            {!user && !loading && <p className="mt-4 text-xs text-dim">Saved on this device. You can create an account later to sync it.</p>}
                          </motion.div>
                        ) : (
                          <motion.ul key="building" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative mt-8 w-full max-w-xs space-y-2 text-left">
                            {BUILD_STAGES.map((label, index) => {
                              const done = buildStage > index;
                              const active = buildStage === index;
                              return (
                                <motion.li
                                  key={label}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: buildStage >= index ? 1 : 0.3, x: 0 }}
                                  className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm", active && "bg-white/[0.05]")}
                                >
                                  <span className={cn(
                                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                                    done && "border-transparent bg-gradient-to-br from-electric to-neon text-white",
                                    active && "border-neon text-neon",
                                    !done && !active && "border-white/10 text-dim",
                                  )}>
                                    {done ? <Check className="h-3 w-3" strokeWidth={3} /> : active ? <span className="h-2 w-2 rounded-full bg-neon animate-pulse" /> : null}
                                  </span>
                                  <span className={done || active ? "text-fg" : "text-muted"}>{label}</span>
                                </motion.li>
                              );
                            })}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {!building && (
            <div className="mt-10 flex items-center justify-between border-t border-white/[0.06] pt-6">
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                disabled={step === 0}
                className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm text-muted transition hover:text-fg disabled:invisible"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              {step < STEPS.length - 1 && (
                <div className="flex items-center gap-4">
                  {!canContinue && <span className="hidden text-xs text-dim sm:inline">{validationHint}</span>}
                  <MagneticButton onClick={() => goTo(step + 1)}>
                    {step === 3 ? "Review my path" : "Continue"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </MagneticButton>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
