import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = {
  title: "Build my path",
  description: "Five steps to a personalized learning roadmap.",
};

export default function OnboardingPage() {
  return (
    <main id="main">
      <OnboardingFlow />
    </main>
  );
}
