import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your progress, skill gaps, projects and roadmap in one place.",
};

/**
 * Not wrapped in RequireAuth: guest mode is a supported state here, so the
 * view itself decides between account data, a local guest route, or sign-in.
 */
export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="relative z-10 min-h-dvh">
        <DashboardView />
      </main>
      <Footer />
    </>
  );
}
