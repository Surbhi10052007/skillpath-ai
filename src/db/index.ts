import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  // Validation is intentional: fail fast instead of running without a database.
  // The message points at the fix so this never surfaces as an opaque 500.
  throw new Error(
    "DATABASE_URL is required. Copy .env.example to .env (or .env.local) and set your " +
      "PostgreSQL connection string, then restart the server. See .env.example for the " +
      "exact value each provider gives you.",
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
