import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/ensure-schema";
import { errorResponse } from "@/lib/server/errors";
import { hashPassword, validateNewPassword } from "@/lib/auth/password";
import { consumeResetToken, type ResetTokenState } from "@/lib/auth/reset-tokens";
import { clientKey, pruneRateBuckets, rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/** User-facing copy per token state. Deliberately says nothing about accounts. */
const STATE_ERRORS: Record<Exclude<ResetTokenState, "valid">, string> = {
  invalid: "This reset link is not valid. Request a new one to continue.",
  expired: "This reset link has expired. Request a new one to continue.",
  used: "This reset link has already been used. Request a new one to continue.",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      token?: unknown;
      password?: unknown;
    };

    if (typeof body.token !== "string" || !body.token.trim()) {
      return NextResponse.json(
        { error: "This reset link is missing its token. Request a new link.", code: "MISSING_TOKEN" },
        { status: 400 },
      );
    }

    const passwordError = validateNewPassword(body.password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    pruneRateBuckets();
    const limit = rateLimit(clientKey(request, "reset:ip"), 10, 15 * 60);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a few minutes and try again." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }

    await ensureSchema();

    const passwordHash = await hashPassword(String(body.password));
    const state = await consumeResetToken(body.token.trim(), passwordHash);

    if (state !== "valid") {
      const status = state === "invalid" ? 400 : state === "expired" ? 410 : 409;
      return NextResponse.json({ error: STATE_ERRORS[state], code: state.toUpperCase() }, { status });
    }

    // No session is created here: the user must sign in with the new password.
    return NextResponse.json({
      message: "Password reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    console.error("reset-password failed", error instanceof Error ? error.message : "unknown error");
    return errorResponse(error, "We couldn't reset your password right now.");
  }
}
