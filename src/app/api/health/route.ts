import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";

export const dynamic = "force-dynamic";

/**
 * Verifies the database is reachable *and* usable. `select 1` alone passed on
 * an empty database, which let the app boot "healthy" while every signup 500'd.
 */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    await ensureSchema();
    await db.execute(sql`select 1 from users limit 1`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("healthcheck failed", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
