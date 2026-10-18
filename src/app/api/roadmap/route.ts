import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth/session";
import { loadCatalog } from "@/lib/server/catalog";
import { bumpSkill, getDashboard, logActivity, setNodeStatus } from "@/lib/server/students";
import type { NodeStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthorized();
    const body = (await request.json().catch(() => ({}))) as { nodeSlug?: string; status?: NodeStatus };
    if (!body.nodeSlug || !body.status || !["completed", "current", "locked"].includes(body.status)) {
      return NextResponse.json({ error: "nodeSlug and a valid status are required." }, { status: 400 });
    }

    const before = await getDashboard(user.id);
    if (!before) return NextResponse.json({ error: "Finish onboarding first." }, { status: 404 });
    const node = before.analysis.roadmap.find((n) => n.slug === body.nodeSlug);
    if (!node) return NextResponse.json({ error: "Unknown roadmap node." }, { status: 404 });

    await setNodeStatus(user.id, body.nodeSlug, body.status);

    if (body.status === "completed" && node.skill) {
      const catalog = await loadCatalog();
      const req = before.analysis.role.requirements.find((r) => r.skill === node.skill);
      const level = await bumpSkill(user.id, node.skill, Math.round((req?.requiredLevel ?? 70) * 0.85));
      const skillName = catalog.skills.find((s) => s.slug === node.skill)?.name ?? node.title;
      await logActivity(user.id, "roadmap", `Completed “${node.title}” — ${skillName} confidence now ${level}%`);
    } else if (body.status === "locked") {
      await logActivity(user.id, "roadmap", `Reopened “${node.title}” on your roadmap`);
    }

    const data = await getDashboard(user.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("roadmap update failed", error);
    return NextResponse.json({ error: "Could not update your roadmap." }, { status: 500 });
  }
}
