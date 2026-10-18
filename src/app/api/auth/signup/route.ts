import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { users } from "@/db/schema";
import { errorResponse } from "@/lib/server/errors";
import { hashPassword, validateCredentials } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { attachAuthCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, email, password } = body as Record<string, unknown>;
    const errors = validateCredentials(email, password, name);
    if (errors.length) return NextResponse.json({ error: errors[0] }, { status: 400 });

    await ensureSchema();
    const normalizedEmail = String(email).toLowerCase().trim();
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existing) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

    const [created] = await db
      .insert(users)
      .values({ name: String(name).trim(), email: normalizedEmail, passwordHash: await hashPassword(String(password)) })
      .returning({ id: users.id, name: users.name, email: users.email });

    const token = await signToken({ sub: String(created.id), email: created.email, name: created.name });
    const response = NextResponse.json({ user: { ...created, onboarded: false }, token }, { status: 201 });
    return attachAuthCookie(response, token);
  } catch (error) {
    console.error("signup failed", error);
    // A duplicate that slipped past the pre-check (race between two requests).
    if (typeof error === "object" && error !== null && (error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }
    return errorResponse(error, "Could not create your account right now.");
  }
}
