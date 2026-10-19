import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth/session";
import { errorResponse } from "@/lib/server/errors";
import { getStudentProfile, saveStudentProfile, validateProfileInput } from "@/lib/server/students";

export const dynamic = "force-dynamic";

/**
 * The user is always derived from the session cookie / JWT —
 * never from an id supplied by the client.
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthorized();
    const profile = await getStudentProfile(user.id);
    return NextResponse.json({ profile, onboarded: profile !== null });
  } catch (error) {
    console.error("profile read failed", error instanceof Error ? error.message : "unknown error");
    return errorResponse(error, "Could not load your profile.");
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthorized();

    const parsed = validateProfileInput(await request.json().catch(() => null));
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    await saveStudentProfile(user.id, parsed.data);
    const profile = await getStudentProfile(user.id);

    // 201 when this call created the profile (first onboarding), 200 when it
    // updated one. `onboarded` lets the client update state without a second
    // round trip to /api/auth/me.
    return NextResponse.json(
      { profile, onboarded: Boolean(profile) },
      { status: user.onboarded ? 200 : 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    // A genuine user-correctable conflict is not a server fault.
    if (/already connected to another account/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    console.error("profile save failed", message || "unknown error");
    return errorResponse(error, "Could not save your profile.");
  }
}
