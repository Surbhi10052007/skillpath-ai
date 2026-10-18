import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ProjectPageView } from "@/components/projects/ProjectPageView";
import { loadCatalog } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await loadCatalog();
  const project = catalog.projects.find((item) => item.slug === slug);
  return { title: project ? project.title : "Project not found", description: project?.tagline };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const catalog = await loadCatalog();
  const project = catalog.projects.find((item) => item.slug === slug);
  if (!project) notFound();

  const related = catalog.projects
    .filter((item) => item.slug !== project.slug && item.roles.some((role) => project.roles.includes(role)))
    .slice(0, 3);

  return (
    <>
      <Navbar />
      <main id="main" className="relative z-10 min-h-dvh">
        <RequireAuth returnTo={`/projects/${slug}`}>
          <ProjectPageView project={project} related={related} />
        </RequireAuth>
      </main>
      <Footer />
    </>
  );
}
