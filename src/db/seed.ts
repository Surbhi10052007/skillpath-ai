import "dotenv/config";
import { seedCatalog } from "@/lib/server/catalog";
import { pool } from "@/db";

async function main() {
  const result = await seedCatalog();
  console.log(`Seeded catalog: ${result.skills} skills, ${result.roles} roles, ${result.projects} projects.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
