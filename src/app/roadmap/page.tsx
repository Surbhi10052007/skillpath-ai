import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RoadmapPage } from "@/components/roadmap/RoadmapPage";

export const metadata: Metadata = { title: "Roadmap" };

export default function RoadmapRoute() {
  return (
    <>
      <Navbar />
      <main id="main" className="min-h-dvh">
        <RequireAuth returnTo="/roadmap">
          <RoadmapPage />
        </RequireAuth>
      </main>
      <Footer />
    </>
  );
}
