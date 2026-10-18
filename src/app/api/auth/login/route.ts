import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { profiles, users } from "@/db/schema";
import { errorResponse } from "@/lib/server/errors";
import { verifyPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { attachAuthCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body as Record<string, unknown>;
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    await ensureSchema();
    const [row] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
        profileUserId: profiles.userId,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (!row || !(await verifyPassword(password, row.passwordHash))) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    const token = await signToken({ sub: String(row.id), email: row.email, name: row.name });
    const response = NextResponse.json({
      user: { id: row.id, name: row.name, email: row.email, onboarded: row.profileUserId !== null },
      token,
    });
    return attachAuthCookie(response, token);
  } catch (error) {
    console.error("login failed", error);
    return errorResponse(error, "Could not sign you in right now.");
  }
}
