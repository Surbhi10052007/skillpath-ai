"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChatPanel } from "@/components/assistant/ChatPanel";
import { useProfile } from "@/components/providers/ProfileProvider";
import { PROJECTS } from "@/data/mock";
import { guestStore } from "@/lib/store/guest";
import { skillName } from "@/lib/skills";
import type { ProjectContext } from "@/lib/engine/assistant";

export function PathAssistant() {
  const pathname = usePathname();
  const { data } = useProfile();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);

  useEffect(() => {
    const openWithPrompt = (event: Event) => {
      const detail = (event as CustomEvent<{ prompt?: string }>).detail;
      setOpen(true);
      if (detail?.prompt) setPrompt(`${detail.prompt}\u0000${Date.now()}`);
    };
    window.addEventListener("skillpath:ask", openWithPrompt);
    return () => window.removeEventListener("skillpath:ask", openWithPrompt);
  }, []);

  const context = useMemo(
    () => (data ? { profile: data.profile, analysis: data.analysis } : undefined),
    [data],
  );

  // On a project page the assistant should already know the mission.
  const projectContext = useMemo<ProjectContext | undefined>(() => {
    const match = pathname.match(/^\/projects\/([^/]+)$/);
    if (!match) return undefined;
    const project = PROJECTS.find((item) => item.slug === match[1]);
    if (!project) return undefined;
    return {
      title: project.title,
      milestone: project.milestones[0]?.title ?? null,
      skills: project.skills.map((skill) => skillName(skill)),
    };
  }, [pathname]);

  const analysis = data?.analysis;
  const next = analysis?.nextSkill;
  const remote = data?.source === "account";

  if (pathname.startsWith("/onboarding")) return null;

  const quickPrompts = projectContext
    ? ["Help me with this mission", "What should I build first here?", "Explain the hardest part"]
    : ["Show me why this is my next move", "Give me a 30 minute task", "Help with my project"];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-cursor="link"
        className="fixed bottom-5 right-5 z-[80] inline-flex items-center gap-2 border border-electric bg-ink px-4 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-electric shadow-[6px_6px_0_#d6ff3c] transition hover:-translate-y-0.5"
      >
        Path AI <span aria-hidden>✦</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.aside
            role="dialog"
            aria-label="Path AI"
            initial={{ x: 28, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 28, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 right-0 z-[85] flex h-[min(760px,100dvh)] w-full flex-col border-l border-t border-fg/15 bg-ink-2 sm:bottom-5 sm:right-5 sm:h-[min(720px,calc(100dvh-2.5rem))] sm:w-[430px] sm:border"
          >
            <header className="flex items-start justify-between gap-4 border-b border-fg/10 px-5 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-electric">Career intelligence layer</p>
                <h2 className="mt-1 font-display text-3xl uppercase leading-none text-fg">Path AI</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="grid h-9 w-9 place-items-center border border-fg/15 text-fg hover:border-electric hover:text-electric">
                <X className="h-4 w-4" />
              </button>
            </header>

            {analysis && (
              <div className="grid grid-cols-2 gap-px border-b border-fg/10 bg-fg/10 text-[11px]">
                {[
                  ["Role", analysis.role.name],
                  ["Biggest gap", next ? next.skill.name : "None open"],
                  [projectContext ? "This mission" : "Project", projectContext?.title ?? analysis.projects[0]?.project.title ?? "Not matched yet"],
                  ["Readiness", `${analysis.readiness}%`],
                ].map(([label, value]) => (
                  <div key={label} className="bg-ink px-4 py-3">
                    <p className="font-mono uppercase tracking-[0.16em] text-dim">{label}</p>
                    <p className="mt-1 truncate text-fg">{value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 overflow-x-auto border-b border-fg/10 px-4 py-3 no-scrollbar">
              {quickPrompts.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPrompt(`${item}\u0000${Date.now()}`)}
                  className="shrink-0 border border-fg/15 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:border-electric hover:text-electric"
                >
                  {item}
                </button>
              ))}
            </div>

            <ChatPanel
              context={context}
              anonymous={!context}
              remote={remote}
              projectContext={projectContext}
              pendingPrompt={prompt}
              initialMessages={data?.source === "guest" ? guestStore.getChat() : undefined}
              onMessagesChange={data?.source === "guest" ? (messages) => guestStore.setChat(messages) : undefined}
              showHeader={false}
              heightClass="min-h-0 flex-1 rounded-none border-0"
              className="bg-transparent"
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
