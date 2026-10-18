import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth/session";
import { getStudentProfile, saveStudentProfile, validateProfileInput } from "@/lib/server/students";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return unauthorized();
  const profile = await getStudentProfile(user.id);
  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthorized();
    const parsed = validateProfileInput(await request.json().catch(() => null));
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    await saveStudentProfile(user.id, parsed.data);
    const profile = await getStudentProfile(user.id);
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("profile save failed", error);
    return NextResponse.json({ error: "Could not save your profile." }, { status: 500 });
  }
}
