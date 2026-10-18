import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HomeExperience } from "@/components/landing/HomeExperience";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main" className="overflow-x-clip">
        <HomeExperience />
      </main>
      <Footer />
    </>
  );
}
