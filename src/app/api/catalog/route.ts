import { NextResponse } from "next/server";
import { loadCatalog } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = await loadCatalog();
  return NextResponse.json(catalog, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
