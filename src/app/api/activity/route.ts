import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth/session";
import { getActivities, logActivity } from "@/lib/server/students";
import type { ActivityType } from "@/types";

export const dynamic = "force-dynamic";

const TYPES: ActivityType[] = ["skill", "project", "roadmap", "streak", "chat", "profile"];

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return unauthorized();
  return NextResponse.json({ activities: await getActivities(user.id, 20) });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthorized();
    const body = (await request.json().catch(() => ({}))) as { type?: ActivityType; message?: string };
    if (!body.type || !TYPES.includes(body.type) || !body.message?.trim()) {
      return NextResponse.json({ error: "type and message are required." }, { status: 400 });
    }
    await logActivity(user.id, body.type, body.message.trim().slice(0, 240));
    return NextResponse.json({ activities: await getActivities(user.id) }, { status: 201 });
  } catch (error) {
    console.error("activity failed", error);
    return NextResponse.json({ error: "Could not log activity." }, { status: 500 });
  }
}
