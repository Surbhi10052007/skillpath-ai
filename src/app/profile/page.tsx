import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ProfileView } from "@/components/profile/ProfileView";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <>
      <Navbar />
      <main id="main" className="min-h-dvh">
        <RequireAuth returnTo="/profile">
          <ProfileView />
        </RequireAuth>
      </main>
      <Footer />
    </>
  );
}
