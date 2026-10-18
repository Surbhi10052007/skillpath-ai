import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { users } from "@/db/schema";
import { errorResponse } from "@/lib/server/errors";
import { isEmailConfigured, resolveAppUrl, sendPasswordResetEmail } from "@/lib/server/email";
import { generateResetToken, issueResetToken, RESET_TOKEN_TTL_MINUTES } from "@/lib/auth/reset-tokens";
import { clientKey, pruneRateBuckets, rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/** Identical for every address — never reveals whether an account exists. */
const GENERIC_MESSAGE = "If an account exists for this email, a password reset link has been sent.";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawEmail = (body as { email?: unknown }).email;
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    // A global configuration problem, not an account-specific one.
    if (!isEmailConfigured()) {
      console.error("forgot-password: RESEND_API_KEY / EMAIL_FROM are not configured");
      return NextResponse.json(
        { error: "Password reset email is temporarily unavailable. Please try again later." },
        { status: 503 },
      );
    }

    pruneRateBuckets();
    const perIp = rateLimit(clientKey(request, "forgot:ip"), 10, 15 * 60);
    const perEmail = rateLimit(`forgot:email:${email}`, 3, 15 * 60);
    if (!perIp.allowed || !perEmail.allowed) {
      return NextResponse.json(
        { error: "Too many reset requests. Please wait a few minutes and try again." },
        { status: 429, headers: { "Retry-After": String(Math.max(perIp.retryAfterSeconds, perEmail.retryAfterSeconds)) } },
      );
    }

    await ensureSchema();

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // Spend comparable CPU on unknown addresses so response timing does not
      // hint at whether the account exists.
      generateResetToken();
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const { raw } = await issueResetToken(user.id);
    const resetUrl = `${resolveAppUrl(new URL(request.url).origin)}/reset-password?token=${encodeURIComponent(raw)}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
        expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
      });
    } catch (sendError) {
      // The token stays valid in the database; the user can request a new link.
      // Never echo the URL or token into logs.
      console.error("forgot-password: delivery failed", sendError instanceof Error ? sendError.message : "unknown error");
      return NextResponse.json(
        { error: "We couldn't send the reset email right now. Please try again shortly." },
        { status: 502 },
      );
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("forgot-password failed", error instanceof Error ? error.message : "unknown error");
    return errorResponse(error, "We couldn't process that request right now.");
  }
}
