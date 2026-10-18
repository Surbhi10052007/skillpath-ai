import { NextResponse } from "next/server";

/** Postgres codes that mean "the database isn't usable", not "bad input". */
const INFRA_CODES = new Set([
  "42P01", // undefined_table
  "42703", // undefined_column
  "3D000", // invalid_catalog_name
  "28P01", // invalid_password
  "08006", // connection_failure
  "08003", // connection_does_not_exist
  "ECONNREFUSED",
]);

export function isInfrastructureError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return typeof code === "string" && INFRA_CODES.has(code);
}

/**
 * Turns a thrown error into an honest response. Infrastructure problems get a
 * 503 and a message that says what's actually wrong, instead of a blanket 500
 * that leaves the user staring at "Request failed (500)".
 */
export function errorResponse(error: unknown, fallback: string) {
  if (isInfrastructureError(error)) {
    return NextResponse.json(
      {
        error: "The database isn't ready yet. Please try again in a moment.",
        code: "DB_UNAVAILABLE",
      },
      { status: 503 },
    );
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
}
