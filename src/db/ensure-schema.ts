import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Idempotent schema bootstrap.
 *
 * The app previously relied on someone running `npx drizzle-kit push` by hand.
 * On a fresh database that step is easy to miss: `select 1` still succeeds so
 * the healthcheck passes, but every write fails with
 * `42P01 relation "users" does not exist` and surfaces as an opaque 500.
 *
 * This mirrors src/db/schema.ts using CREATE TABLE IF NOT EXISTS so the app can
 * heal itself on any empty database. Drizzle remains the source of truth for
 * types and migrations; this is the safety net.
 */
const DDL = sql`
  CREATE TABLE IF NOT EXISTS skills (
    id serial PRIMARY KEY,
    slug varchar(64) NOT NULL UNIQUE,
    name varchar(120) NOT NULL,
    category varchar(32) NOT NULL,
    description text NOT NULL DEFAULT '',
    related jsonb NOT NULL DEFAULT '[]'::jsonb
  );

  CREATE TABLE IF NOT EXISTS career_roles (
    id serial PRIMARY KEY,
    slug varchar(64) NOT NULL UNIQUE,
    name varchar(120) NOT NULL,
    tagline text NOT NULL DEFAULT '',
    description text NOT NULL DEFAULT '',
    icon varchar(32) NOT NULL DEFAULT 'sparkles',
    accent varchar(16) NOT NULL DEFAULT 'violet',
    demand integer NOT NULL DEFAULT 80,
    avg_salary varchar(32) NOT NULL DEFAULT '',
    requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
    roadmap jsonb NOT NULL DEFAULT '[]'::jsonb
  );

  CREATE TABLE IF NOT EXISTS projects (
    id serial PRIMARY KEY,
    slug varchar(64) NOT NULL UNIQUE,
    title varchar(160) NOT NULL,
    tagline text NOT NULL DEFAULT '',
    description text NOT NULL DEFAULT '',
    difficulty varchar(16) NOT NULL,
    category varchar(48) NOT NULL DEFAULT '',
    skills jsonb NOT NULL DEFAULT '[]'::jsonb,
    skills_gained jsonb NOT NULL DEFAULT '[]'::jsonb,
    estimated_hours integer NOT NULL DEFAULT 10,
    accent varchar(16) NOT NULL DEFAULT 'violet',
    roles jsonb NOT NULL DEFAULT '[]'::jsonb,
    stack jsonb NOT NULL DEFAULT '[]'::jsonb,
    milestones jsonb NOT NULL DEFAULT '[]'::jsonb,
    outcomes jsonb NOT NULL DEFAULT '[]'::jsonb
  );

  CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    name varchar(120) NOT NULL,
    email varchar(255) NOT NULL UNIQUE,
    password_hash text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    headline varchar(120) NOT NULL DEFAULT '',
    experience_level varchar(16) NOT NULL DEFAULT 'beginner',
    interests jsonb NOT NULL DEFAULT '[]'::jsonb,
    target_role varchar(64) NOT NULL,
    weekly_hours integer NOT NULL DEFAULT 6,
    streak integer NOT NULL DEFAULT 1,
    last_active_at timestamp with time zone NOT NULL DEFAULT now(),
    onboarded_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS user_skills (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_slug varchar(64) NOT NULL,
    level integer NOT NULL DEFAULT 0,
    updated_at timestamp with time zone NOT NULL DEFAULT now()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS user_skills_user_skill_idx ON user_skills (user_id, skill_slug);

  CREATE TABLE IF NOT EXISTS roadmap_progress (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    node_slug varchar(64) NOT NULL,
    status varchar(16) NOT NULL,
    completed_at timestamp with time zone
  );
  CREATE UNIQUE INDEX IF NOT EXISTS roadmap_progress_user_node_idx ON roadmap_progress (user_id, node_slug);

  CREATE TABLE IF NOT EXISTS activities (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type varchar(16) NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role varchar(16) NOT NULL,
    content text NOT NULL,
    suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash varchar(64) NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens (user_id);
`;

const globalForSchema = globalThis as typeof globalThis & {
  __skillpathSchemaReady?: Promise<void>;
};

async function bootstrap() {
  await db.execute(DDL);

  // Seed the read-only catalog once so recommendations work on a fresh DB.
  const [{ count }] = (await db.execute<{ count: string }>(
    sql`select count(*)::text as count from skills`,
  )).rows;
  if (Number(count) === 0) {
    const { seedCatalog } = await import("@/lib/server/catalog");
    await seedCatalog();
  }
}

/** Runs the bootstrap at most once per process; retries if it failed. */
export function ensureSchema(): Promise<void> {
  if (!globalForSchema.__skillpathSchemaReady) {
    globalForSchema.__skillpathSchemaReady = bootstrap().catch((error) => {
      // Clear the cache so the next request can retry instead of being stuck.
      globalForSchema.__skillpathSchemaReady = undefined;
      throw error;
    });
  }
  return globalForSchema.__skillpathSchemaReady;
}
