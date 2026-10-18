import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/ensure-schema";
import { errorResponse } from "@/lib/server/errors";
import { inspectResetToken, type ResetTokenState } from "@/lib/auth/reset-tokens";

export const dynamic = "force-dynamic";

/**
 * Lets /reset-password check a link before rendering the form.
 *
 * Uses POST rather than a query string so the token is not written into server
 * access logs. The response only reports the link's state — never the account.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { token?: unknown };
    if (typeof body.token !== "string" || !body.token.trim()) {
      return NextResponse.json({ state: "invalid" satisfies ResetTokenState });
    }

    await ensureSchema();
    const { state } = await inspectResetToken(body.token.trim());
    return NextResponse.json({ state });
  } catch (error) {
    console.error("validate reset token failed", error instanceof Error ? error.message : "unknown error");
    return errorResponse(error, "We couldn't check that reset link right now.");
  }
}
