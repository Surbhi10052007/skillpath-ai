import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { profiles, users } from "@/db/schema";
import { TOKEN_COOKIE, TOKEN_TTL_SECONDS, verifyToken } from "./jwt";
import type { AuthUser } from "@/types";

/** Reads the JWT from the httpOnly cookie or an Authorization: Bearer header. */
export async function getTokenFromRequest(request?: Request) {
  const header = request?.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  const store = await cookies();
  return store.get(TOKEN_COOKIE)?.value ?? null;
}

export async function getCurrentUser(request?: Request): Promise<AuthUser | null> {
  const token = await getTokenFromRequest(request);
  if (!token) return null;
  // Every authenticated route funnels through here, so this is the one place
  // that guarantees the schema exists before we touch it.
  await ensureSchema();
  const payload = await verifyToken(token);
  if (!payload) return null;
  const id = Number(payload.sub);
  if (!Number.isFinite(id)) return null;

  const [row] = await db
    .select({ id: users.id, name: users.name, email: users.email, profileUserId: profiles.userId })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, id))
    .limit(1);
  if (!row) return null;
  return { id: row.id, name: row.name, email: row.email, onboarded: row.profileUserId !== null };
}

export function attachAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
  return response;
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({ name: TOKEN_COOKIE, value: "", path: "/", maxAge: 0 });
  return response;
}

export function unauthorized(message = "Sign in to continue.") {
  return NextResponse.json({ error: message }, { status: 401 });
}
