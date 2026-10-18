"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { activityService } from "@/lib/api/services";
import { guestStore } from "@/lib/store/guest";
import { MissionLaunch } from "./MissionLaunch";
import { ProjectCard } from "./ProjectCard";
import { ProjectModal } from "./ProjectModal";
import type { Project } from "@/types";

export function ProjectPageView({ project, related }: { project: Project; related: Project[] }) {
  const { user } = useAuth();
  const [started, setStarted] = useState(false);
  const [open, setOpen] = useState<Project | null>(null);

  const start = async (p: Project) => {
    setStarted(true);
    const message = `Started project: ${p.title}`;
    if (user) await activityService.log("project", message).catch(() => undefined);
    else if (guestStore.hasProfile()) guestStore.addActivity({ type: "project", message });
  };

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-28 sm:pt-32">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <MissionLaunch project={project} started={started} onStart={start} />

      {related.length > 0 && (
        <section className="mt-20">
          <p className="eyebrow mb-6">Related projects</p>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((p) => (
              <ProjectCard key={p.slug} project={p} onOpen={setOpen} compact />
            ))}
          </div>
        </section>
      )}
      <ProjectModal project={open} onClose={() => setOpen(null)} />
    </div>
  );
}
