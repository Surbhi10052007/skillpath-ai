"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useProfile } from "@/components/providers/ProfileProvider";
import { AuthPending } from "@/components/auth/RequireAuth";
import { Roadmap } from "@/components/roadmap/Roadmap";
import { roadmapService } from "@/lib/api/services";
import type { NodeStatus, RoadmapNode } from "@/types";

export function RoadmapPage() {
  const { data, status, error, applyData } = useProfile();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "needs-onboarding") router.replace("/onboarding");
  }, [status, router]);

  if (status === "loading") return <AuthPending label="Loading your route" />;
  if (status === "needs-onboarding") return <AuthPending label="Opening onboarding" />;
  if (!data) {
    return (
      <div className="mx-auto max-w-xl px-5 py-40 text-center">
        <h1 className="font-display text-5xl uppercase">No route yet.</h1>
        <p className="mt-4 text-muted">{error ?? "Build your path and your roadmap appears here."}</p>
      </div>
    );
  }

  const update = async (node: RoadmapNode, next: NodeStatus) => {
    if (data.source !== "account") return;
    setBusy(node.slug);
    setActionError(null);
    try {
      applyData(await roadmapService.setStatus(node.slug, next));
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Could not update this node.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-28">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-electric">{data.analysis.role.name}</p>
      <h1 className="mt-3 font-display text-6xl uppercase leading-[0.84] sm:text-8xl">Your route.</h1>
      <p className="mt-4 max-w-xl text-muted">{data.analysis.summary}</p>
      {actionError && <p role="alert" className="mt-4 text-sm text-neon">{actionError}</p>}
      <div className="mt-12">
        <Roadmap
          nodes={data.analysis.roadmap}
          align="left"
          interactive={data.source === "account"}
          busySlug={busy}
          onComplete={(node) => void update(node, "completed")}
          onReopen={(node) => void update(node, "locked")}
        />
      </div>
    </div>
  );
}
