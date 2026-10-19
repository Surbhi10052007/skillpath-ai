import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth/session";
import { errorResponse } from "@/lib/server/errors";
import { getDashboard } from "@/lib/server/students";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthorized();

    const data = await getDashboard(user.id);
    if (!data) {
      // "Not onboarded" is a normal state of an authenticated user, not a
      // missing resource — so it answers 200 instead of 404. This keeps the
      // client's authoritative profile refresh free of misleading error logs.
      return NextResponse.json(
        { onboarded: false, code: "NOT_ONBOARDED", error: "Finish onboarding to unlock your dashboard." },
        { status: 200 },
      );
    }

    return NextResponse.json({ ...data, onboarded: true });
  } catch (error) {
    console.error("dashboard failed", error instanceof Error ? error.message : "unknown error");
    return errorResponse(error, "Could not load your dashboard.");
  }
}
