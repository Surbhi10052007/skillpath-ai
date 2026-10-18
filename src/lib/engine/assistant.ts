import type { Analysis, StudentProfile } from "@/types";

export interface AssistantContext {
  profile: StudentProfile;
  analysis: Analysis;
}

export interface AssistantReply {
  content: string;
  suggestions: string[];
}

/** The mission the student is currently looking at, if any. */
export interface ProjectContext {
  title: string;
  milestone: string | null;
  skills: string[];
}

/**
 * Mission-aware answer. The assistant already knows the project, the current
 * milestone and the student's level, so they never have to re-explain it.
 */
export function generateProjectReply(
  message: string,
  ctx: AssistantContext,
  project: ProjectContext,
): AssistantReply {
  const { profile, analysis } = ctx;
  const first = profile.name.split(" ")[0];
  const levels = new Map(profile.skills.map((skill) => [skill.skill, skill.level]));
  const relevant = analysis.gaps.filter((gap) =>
    project.skills.some((skill) => skill.toLowerCase() === gap.skill.name.toLowerCase()),
  );
  const weakest = relevant[0];
  const strongest = [...profile.skills].sort((a, b) => b.level - a.level)[0];
  const milestone = project.milestone ?? "the first milestone";

  if (/debug|error|stuck|broken|fail/i.test(message)) {
    return {
      content:
        `Let's debug **${project.title}** at **${milestone}**.\n\n` +
        `• Reproduce it on the smallest possible input — one file, one record.\n` +
        `• Print the shape of the data right before the line that fails.\n` +
        `• ${weakest ? `This milestone leans on **${weakest.skill.name}**, which is at ${weakest.current}% for you — that's the usual source of surprises here.` : "Check your assumptions about the input format first."}\n\n` +
        `Paste the error and the failing function and I'll narrow it down.`,
      suggestions: ["Explain the hardest part", "What should I build first here?"],
    };
  }

  if (/first|start|begin|where/i.test(message)) {
    return {
      content:
        `Start **${project.title}** at **${milestone}**, ${first}.\n\n` +
        `• You already have ${strongest ? `**${strongest.skill ? skillLabel(strongest.skill) : "a solid base"}** at ${strongest.level}%` : "a base to build on"}, so scaffold with what you know first.\n` +
        `• Get an end-to-end slice working before polishing any single step.\n` +
        `• ${weakest ? `Expect **${weakest.skill.name}** to be the stretch — that's exactly why this mission is matched to you.` : "Keep the first version boring and working."}`,
      suggestions: ["Explain the hardest part", "Help me debug this"],
    };
  }

  if (/hard|difficult|challenge|tricky/i.test(message)) {
    return {
      content:
        `The hardest part of **${project.title}** for your current level is ${weakest ? `**${weakest.skill.name}** (${weakest.current}% → ${weakest.required}% expected for ${analysis.role.name})` : "holding the whole pipeline in your head at once"}.\n\n` +
        `Break it down:\n` +
        `• Write the dumbest version that returns a hardcoded answer.\n` +
        `• Replace one hardcoded piece at a time with real logic.\n` +
        `• Only then optimise.\n\n` +
        `That turns ${milestone} into four small wins instead of one wall.`,
      suggestions: ["What should I build first here?", "Help me debug this"],
    };
  }

  const known = project.skills.filter((skill) =>
    Array.from(levels.entries()).some(([slug, level]) => slug.includes(skill.toLowerCase()) && level >= 40),
  );

  return {
    content:
      `You're on **${project.title}** — current objective: **${milestone}**.\n\n` +
      `• Mission skills: ${project.skills.join(", ")}\n` +
      `${known.length ? `• You're already comfortable with ${known.join(", ")}\n` : ""}` +
      `${weakest ? `• This build closes your **${weakest.skill.name}** gap, your top priority for ${analysis.role.name}\n` : ""}` +
      `\nAsk me to break down a milestone, debug an error, or explain a concept at your level.`,
    suggestions: ["What should I build first here?", "Explain the hardest part", "Help me debug this"],
  };
}

function skillLabel(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Honest landing-page response when no student profile exists yet. */
export function generatePreOnboardingReply(message: string): AssistantReply {
  const text = message.toLowerCase();
  if (/project|build|portfolio/.test(text)) {
    return {
      content: "I can recommend a project, but I need to know **which skills you already have**, your confidence in them and the role you’re aiming for. Build your path first and I’ll rank projects that stretch you without throwing you in the deep end.",
      suggestions: ["What information do you need?", "How does project matching work?"],
    };
  }
  if (/ready|intern|job|apply|interview/.test(text)) {
    return {
      content: "I won’t guess whether you’re ready without seeing your starting point. Tell SkillPath what you know and which role you want, then I can compare your skills with the role’s expectations and give you a practical answer.",
      suggestions: ["What information do you need?", "How are skill gaps calculated?"],
    };
  }
  if (/learn|next|start|skill|gap/.test(text)) {
    return {
      content: "The honest answer is: **it depends on what you already know and where you want to go**. That’s why SkillPath asks first instead of showing everyone the same list. Onboarding takes a few minutes, and then your next step is based on your inputs.",
      suggestions: ["How are skill gaps calculated?", "What happens after onboarding?"],
    };
  }
  if (/information|need|onboard|happen|work|calculat|match/.test(text)) {
    return {
      content: "You’ll choose your current skills, rate your confidence, pick one career goal and optionally share what you enjoy building. SkillPath compares those inputs with the role, identifies the most useful gaps, then orders projects and learning steps around your weekly time.",
      suggestions: ["Why do you ask for confidence?", "Can I change my goal later?"],
    };
  }
  if (/change|later|goal/.test(text)) {
    return {
      content: "Yes. Skills grow and career goals change. You can update your confidence or switch roles later, and your gaps, projects and roadmap will be recalculated from the new information.",
      suggestions: ["What happens after onboarding?", "How does project matching work?"],
    };
  }
  return {
    content: "I can help you make sense of what to learn and build—but I won’t pretend to know you yet. Start by telling SkillPath what you know and where you want to go, and I’ll work from there.",
    suggestions: ["What information do you need?", "What happens after onboarding?"],
  };
}

type Intent =
  | "greeting"
  | "learn-next"
  | "project"
  | "readiness"
  | "resume"
  | "roadmap"
  | "gaps"
  | "streak"
  | "role-change"
  | "thanks"
  | "fallback";

const INTENTS: { intent: Intent; patterns: RegExp[] }[] = [
  { intent: "greeting", patterns: [/^(hi|hey|hello|yo|sup)\b/i] },
  { intent: "thanks", patterns: [/thank/i, /\bthx\b/i] },
  { intent: "learn-next", patterns: [/learn next/i, /what should i (learn|study)/i, /next skill/i, /where (do|should) i start/i, /focus/i] },
  { intent: "project", patterns: [/project/i, /build/i, /portfolio/i] },
  { intent: "readiness", patterns: [/ready/i, /internship/i, /\bjob\b/i, /hire/i, /interview/i, /apply/i] },
  { intent: "resume", patterns: [/resume/i, /\bcv\b/i, /linkedin/i] },
  { intent: "roadmap", patterns: [/roadmap/i, /how long/i, /timeline/i, /\bpath\b/i, /weeks?/i, /months?/i] },
  { intent: "gaps", patterns: [/gap/i, /weak/i, /missing/i, /improve/i, /lacking/i] },
  { intent: "streak", patterns: [/streak/i, /motivat/i, /tired/i, /stuck/i, /burn/i] },
  { intent: "role-change", patterns: [/switch/i, /change (my )?(role|goal|target)/i, /different (role|career)/i] },
];

export function detectIntent(message: string): Intent {
  const text = message.trim();
  for (const { intent, patterns } of INTENTS) {
    if (patterns.some((p) => p.test(text))) return intent;
  }
  return "fallback";
}

const pick = <T,>(arr: T[], seed: number) => arr[seed % arr.length];

export function generateAssistantReply(message: string, ctx: AssistantContext): AssistantReply {
  const { profile, analysis } = ctx;
  const { role, readiness, nextSkill, gaps, projects, roadmap, estimatedWeeks, strengths } = analysis;
  const seed = message.length;
  const first = profile.name.split(" ")[0];
  const current = roadmap.find((n) => n.status === "current");
  const topProject = projects[0];
  const critical = gaps.filter((g) => g.importance === 3 && g.gap > 0);

  switch (detectIntent(message)) {
    case "greeting":
      return {
        content: `Hey ${first} 👋 I've got your profile loaded — you're targeting **${role.name}** and you're **${readiness}%** ready. Ask me what to learn, what to build, or whether you're ready to apply.`,
        suggestions: ["What should I learn next?", "Which project should I build?", "Am I ready for an AI internship?"],
      };

    case "thanks":
      return {
        content: pick(
          [
            `Anytime, ${first}. Go ship something today — even 30 minutes on **${nextSkill?.skill.name ?? "your roadmap"}** keeps the streak alive.`,
            `You've got this. Your ${profile.streak}-day streak says more about you than any single skill score.`,
          ],
          seed,
        ),
        suggestions: ["Show my roadmap", "What are my biggest gaps?"],
      };

    case "learn-next": {
      if (!nextSkill) {
        return {
          content: `Honestly? You've covered everything ${role.name} requires. Your next move is depth: pick your weakest strength and build something that stretches it in public.`,
          suggestions: ["Which project should I build?", "How can I improve my resume?"],
        };
      }
      const after = roadmap.find((n) => n.index > (current?.index ?? -1) && n.skill && n.status === "locked");
      return {
        content:
          `Focus on **${nextSkill.skill.name}**. You're at ${nextSkill.current}% and ${role.name} roles expect around ${nextSkill.required}%, so that's a ${nextSkill.gap}-point gap with **${nextSkill.importance === 3 ? "critical" : nextSkill.importance === 2 ? "high" : "medium"}** importance.\n\n` +
          `Why now: ${nextSkill.skill.description} ${after ? `It also unlocks **${after.title}** right after.` : ""}\n\n` +
          `• Spend ~${current?.estimatedWeeks ?? 2} weeks on it at your pace\n` +
          `• Pair it with a project — **${topProject?.project.title ?? "something small"}** uses it directly\n` +
          `• Re-rate your confidence when you can explain it to a friend`,
        suggestions: ["Which project should I build?", `How long until I'm a ${role.name}?`, "What are my biggest gaps?"],
      };
    }

    case "project": {
      if (!topProject) {
        return { content: "I don't have a project match yet — finish onboarding and I'll pick one for you.", suggestions: ["What should I learn next?"] };
      }
      const second = projects[1];
      return {
        content:
          `Build **${topProject.project.title}** — ${topProject.matchScore}% match. ${topProject.reason}.\n\n` +
          `• Difficulty: ${topProject.project.difficulty} · ~${topProject.project.estimatedHours}h\n` +
          `• You'll gain: ${topProject.project.skillsGained.length ? topProject.gainsForYou.slice(0, 3).join(", ") || "core portfolio depth" : "core portfolio depth"}\n` +
          (second ? `\nIf you want something lighter first, **${second.project.title}** (${second.matchScore}% match) is a great warm-up.` : ""),
        suggestions: ["What should I learn next?", "How can I improve my resume?", "Show my roadmap"],
      };
    }

    case "readiness": {
      const verdict =
        readiness >= 80
          ? "Yes — start applying this week."
          : readiness >= 55
            ? "Close. Apply to a few now and keep building — interviews are great feedback."
            : "Not quite yet, but you're closer than you think.";
      return {
        content:
          `**${verdict}**\n\nYou're **${readiness}%** ready for ${role.name} roles. ` +
          (critical.length
            ? `The gaps that matter most to recruiters: ${critical.slice(0, 3).map((g) => `**${g.skill.name}** (${g.current}% → ${g.required}%)`).join(", ")}.\n\n`
            : "No critical gaps remain — nice work.\n\n") +
          `• Ship ${Math.max(1, 3 - Math.floor(readiness / 34))} more project${readiness < 67 ? "s" : ""} you can talk about for 10 minutes\n` +
          `• Lead with ${strengths[0]?.skill.name ?? "your strongest skill"} in your story\n` +
          `• Practice explaining trade-offs, not just tools`,
        suggestions: ["Which project should I build?", "How can I improve my resume?", "What are my biggest gaps?"],
      };
    }

    case "resume":
      return {
        content:
          `Three moves that make a student resume stand out for **${role.name}**:\n\n` +
          `• **Lead with projects, not coursework.** Put ${topProject ? `**${topProject.project.title}**` : "your best project"} at the top with a live link and a one-line outcome.\n` +
          `• **Quantify.** “Trained a model to 91% accuracy on 50k rows” beats “worked on ML”.\n` +
          `• **Mirror the role.** ${role.name} postings mention ${role.requirements.filter((r) => r.importance === 3).slice(0, 3).map((r) => analysisSkillName(ctx, r.skill)).join(", ")} — make sure those words appear where they're true.\n\n` +
          `Your strongest proof points right now: ${strengths.slice(0, 2).map((s) => s.skill.name).join(" and ") || "the projects you ship next"}.`,
        suggestions: ["Am I ready for an AI internship?", "Which project should I build?"],
      };

    case "roadmap": {
      const done = roadmap.filter((n) => n.status === "completed" && n.skill).length;
      const total = roadmap.filter((n) => n.skill).length;
      return {
        content:
          `Your path to **${role.name}** has ${total} skill milestones — you've completed **${done}** and you're currently on **${current?.title ?? "the final stretch"}**.\n\n` +
          roadmap.map((n) => `${n.status === "completed" ? "✓" : n.status === "current" ? "→" : "·"} ${n.title}${n.status === "current" ? ` (${n.progress}%)` : ""}`).join("\n") +
          `\n\nAt ~${profile.weeklyHours} hours a week that's roughly **${estimatedWeeks} weeks** to go. Double your hours and it's about ${Math.max(1, Math.round(estimatedWeeks / 2))}.`,
        suggestions: ["What should I learn next?", "Which project should I build?"],
      };
    }

    case "gaps":
      return {
        content:
          `Your biggest gaps for **${role.name}**, ranked by how much they matter:\n\n` +
          gaps.slice(0, 5).map((g, i) => `${i + 1}. **${g.skill.name}** — ${g.current}% now, ${g.required}% expected (${g.importance === 3 ? "critical" : g.importance === 2 ? "high" : "medium"})`).join("\n") +
          `\n\nDon't try to close them all at once. ${nextSkill ? `Start with **${nextSkill.skill.name}** — it's next on your roadmap.` : ""}`,
        suggestions: ["What should I learn next?", "Which project should I build?"],
      };

    case "streak":
      return {
        content:
          `You're on a **${profile.streak}-day streak**, ${first}. ${profile.streak >= 7 ? "That's real momentum." : "Every streak starts small."}\n\n` +
          `When you feel stuck, shrink the task: one notebook cell, one function, one commit. Today's tiny win: spend 20 minutes on **${nextSkill?.skill.name ?? current?.title ?? "your current milestone"}** and log it.`,
        suggestions: ["What should I learn next?", "Show my roadmap"],
      };

    case "role-change":
      return {
        content:
          `You can re-run onboarding anytime to change your target role — your skill ratings carry over, and I'll recompute your gaps and roadmap instantly. Your current skills transfer best to roles that share **${strengths.slice(0, 2).map((s) => s.skill.name).join(" and ") || "your fundamentals"}**.`,
        suggestions: ["What are my biggest gaps?", "Show my roadmap"],
      };

    default:
      return {
        content:
          `I'm best at questions about *your* path, ${first}. Right now I can see you're ${readiness}% ready for ${role.name}, your next skill is ${nextSkill ? `**${nextSkill.skill.name}**` : "depth"} and your top project match is ${topProject ? `**${topProject.project.title}**` : "coming soon"}.\n\nTry one of these:`,
        suggestions: ["What should I learn next?", "Which project should I build?", "Am I ready for an AI internship?", "How can I improve my resume?"],
      };
  }
}

function analysisSkillName(ctx: AssistantContext, slug: string) {
  const all = [...ctx.analysis.gaps, ...ctx.analysis.strengths];
  return all.find((g) => g.skill.slug === slug)?.skill.name ?? slug;
}
