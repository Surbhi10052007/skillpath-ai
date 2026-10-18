import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";

/**
 * Password reset tokens.
 *
 * The raw token is a 256-bit cryptographically random string handed to the user
 * exactly once (inside the email link). The database only ever stores its
 * SHA-256 hash, so a database leak cannot be turned into working reset links.
 *
 * A fast hash is intentional here: the token already has full entropy, and a
 * deterministic hash lets us look it up with an indexed query. (Passwords use
 * bcrypt — see ./password.ts — because they are low-entropy and guessable.)
 */
export const RESET_TOKEN_TTL_MINUTES = 30;
const TTL_MS = RESET_TOKEN_TTL_MINUTES * 60 * 1000;

export function hashResetToken(rawToken: string) {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function generateResetToken() {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashResetToken(raw) };
}

export interface IssuedResetToken {
  /** Only ever placed in the emailed URL — never stored or logged. */
  raw: string;
  expiresAt: Date;
}

/**
 * Issues a fresh token for a user and invalidates every other unused token,
 * so only the most recent link works.
 */
export async function issueResetToken(userId: number): Promise<IssuedResetToken> {
  const { raw, hash } = generateResetToken();
  const expiresAt = new Date(Date.now() + TTL_MS);

  await db.transaction(async (tx) => {
    // Supersede previously issued links.
    await tx.delete(passwordResetTokens).where(
      and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)),
    );
    // Housekeeping: drop rows that can never be used again.
    await tx.delete(passwordResetTokens).where(lt(passwordResetTokens.expiresAt, new Date()));
    await tx.insert(passwordResetTokens).values({ userId, tokenHash: hash, expiresAt });
  });

  return { raw, expiresAt };
}

export type ResetTokenState = "valid" | "invalid" | "expired" | "used";

export interface ResetTokenInspection {
  state: ResetTokenState;
  userId?: number;
}

/** Read-only check used by the reset page before showing the form. */
export async function inspectResetToken(rawToken: string): Promise<ResetTokenInspection> {
  if (typeof rawToken !== "string" || rawToken.length < 16 || rawToken.length > 512) {
    return { state: "invalid" };
  }

  const [row] = await db
    .select({
      userId: passwordResetTokens.userId,
      expiresAt: passwordResetTokens.expiresAt,
      usedAt: passwordResetTokens.usedAt,
    })
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, hashResetToken(rawToken)))
    .limit(1);

  if (!row) return { state: "invalid" };
  if (row.usedAt) return { state: "used" };
  if (row.expiresAt.getTime() <= Date.now()) return { state: "expired" };
  return { state: "valid", userId: row.userId };
}

/**
 * Atomically consumes a token and swaps the user's password hash.
 *
 * The token is marked used inside the same transaction as the password update,
 * and the update is conditional on `used_at IS NULL` — so two simultaneous
 * requests with the same link cannot both succeed.
 */
export async function consumeResetToken(
  rawToken: string,
  newPasswordHash: string,
): Promise<ResetTokenState> {
  const inspection = await inspectResetToken(rawToken);
  if (inspection.state !== "valid" || !inspection.userId) return inspection.state;

  return db.transaction(async (tx) => {
    const now = new Date();
    const [claimed] = await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResetTokens.tokenHash, hashResetToken(rawToken)),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, now),
        ),
      )
      .returning({ userId: passwordResetTokens.userId });

    if (!claimed) return "used" as const;

    await tx.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, claimed.userId));

    // Any other outstanding links for this user become invalid too.
    await tx.delete(passwordResetTokens).where(
      and(eq(passwordResetTokens.userId, claimed.userId), isNull(passwordResetTokens.usedAt)),
    );

    return "valid" as const;
  });
}
