"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfile } from "@/components/providers/ProfileProvider";
import { AuthPending } from "@/components/auth/RequireAuth";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { CommandCenter, CommandSkeleton } from "./CommandCenter";
import { activityService, roadmapService } from "@/lib/api/services";
import { guestStore } from "@/lib/store/guest";
import type { NodeStatus, Project, RoadmapNode } from "@/types";

export function DashboardView() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, loggingOut } = useAuth();
  const { data, status, error, refresh, applyData } = useProfile();
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const [started, setStarted] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);

  // Route decisions happen only after the session check has settled.
  useEffect(() => {
    if (authLoading || status === "loading" || loggingOut) return;
    // `user.onboarded` comes from /api/auth/me (profile row exists) and is the
    // authoritative flag. Only treat the profile as missing when the session
    // ALSO says so — otherwise a brief stale profile status could bounce a
    // freshly-onboarded student back into onboarding.
    if (status === "needs-onboarding" && user?.onboarded === false) {
      router.replace("/onboarding");
      return;
    }
    if (status === "anonymous" && !isAuthenticated) {
      router.replace("/login?next=/dashboard");
    }
  }, [authLoading, status, isAuthenticated, loggingOut, router, user?.onboarded]);

  const setNodeStatus = useCallback(
    async (node: RoadmapNode, next: NodeStatus) => {
      if (!data) return;
      setBusySlug(node.slug);
      setActionError(null);
      try {
        if (data.source === "account") {
          applyData(await roadmapService.setStatus(node.slug, next));
        } else {
          guestStore.setProgress({ ...guestStore.getProgress(), [node.slug]: next });
          guestStore.addActivity({
            type: "roadmap",
            message: next === "completed" ? `Completed “${node.title}” on your roadmap` : `Reopened “${node.title}”`,
          });
          await refresh();
        }
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : "Could not update the roadmap.");
      } finally {
        setBusySlug(null);
      }
    },
    [data, applyData, refresh],
  );

  const startProject = useCallback(
    async (project: Project) => {
      if (!data) return;
      setStarted((current) => new Set(current).add(project.slug));
      const message = `Started project: ${project.title}`;
      try {
        if (data.source === "account") {
          const { activities } = await activityService.log("project", message);
          applyData({ ...data, activities });
        } else {
          applyData({ ...data, activities: guestStore.addActivity({ type: "project", message }) });
        }
      } catch {
        /* activity logging must never block a mission */
      }
    },
    [data, applyData],
  );

  if (authLoading || status === "loading") return <CommandSkeleton />;
  if (status === "needs-onboarding") return <AuthPending label="Opening onboarding" />;
  if (status === "anonymous") return <AuthPending label="Taking you to sign in" />;

  if (status === "error" || !data) {
    return (
      <div className="mx-auto max-w-xl px-6 py-40 text-center">
        <h1 className="font-display text-6xl uppercase">Signal lost.</h1>
        <p className="mt-4 text-muted">{error ?? "We couldn't load your route."}</p>
        <div className="mt-8 flex justify-center gap-3">
          <MagneticButton onClick={() => void refresh()}>Try again</MagneticButton>
          <MagneticButton href="/profile" variant="secondary">Open profile</MagneticButton>
        </div>
      </div>
    );
  }

  const recommendation = openProject
    ? data.analysis.projects.find((item) => item.project.slug === openProject.slug)
    : undefined;

  return (
    <>
      {actionError && (
        <p role="alert" className="mx-auto max-w-[1500px] px-5 pt-24 text-sm text-neon">{actionError}</p>
      )}
      <CommandCenter
        profile={data.profile}
        analysis={data.analysis}
        activities={data.activities}
        source={data.source}
        openProject={openProject}
        started={openProject ? started.has(openProject.slug) : false}
        busySlug={busySlug}
        onOpenProject={setOpenProject}
        onCloseProject={() => setOpenProject(null)}
        onStartProject={(project) => void startProject(project)}
        onComplete={(node) => void setNodeStatus(node, "completed")}
        onReopen={(node) => void setNodeStatus(node, "locked")}
        matchScore={recommendation?.matchScore}
        reason={recommendation?.reason}
      />
    </>
  );
}
