import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth/session";
import { getDashboard } from "@/lib/server/students";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthorized();
    const data = await getDashboard(user.id);
    if (!data) return NextResponse.json({ error: "Finish onboarding to unlock your dashboard.", code: "NOT_ONBOARDED" }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    console.error("dashboard failed", error);
    return NextResponse.json({ error: "Could not load your dashboard." }, { status: 500 });
  }
}
