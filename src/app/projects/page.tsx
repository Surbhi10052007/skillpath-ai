import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ProjectsIndex } from "@/components/projects/ProjectsIndex";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="min-h-dvh">
        <RequireAuth returnTo="/projects">
          <ProjectsIndex />
        </RequireAuth>
      </main>
      <Footer />
    </>
  );
}
