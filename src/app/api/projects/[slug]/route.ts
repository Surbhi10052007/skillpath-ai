import { NextResponse } from "next/server";
import { loadCatalog } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await loadCatalog();
  const project = catalog.projects.find((p) => p.slug === slug);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  return NextResponse.json({ project });
}
