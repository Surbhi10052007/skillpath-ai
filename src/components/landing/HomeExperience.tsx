"use client";

import { ConstellationSection } from "./ConstellationSection";
import { DestinationSection } from "./DestinationSection";
import { GapSection } from "./GapSection";
import { Hero } from "./Hero";
import { IntroSequence } from "./IntroSequence";
import { JourneyRail } from "./JourneyRail";
import { MissionsSection } from "./MissionsSection";
import { useHomeData } from "./useHomeData";

/**
 * One journey, one data source. The whole homepage shares a single auth +
 * dashboard read so personalised copy never fights itself between sections.
 */
export function HomeExperience() {
  const { user, loading, snapshot } = useHomeData();

  return (
    <>
      <IntroSequence />
      <JourneyRail />
      <Hero user={user} loading={loading} snapshot={snapshot} />
      <ConstellationSection snapshot={snapshot} />
      <GapSection snapshot={snapshot} />
      <MissionsSection />
      <DestinationSection user={user} snapshot={snapshot} />
    </>
  );
}
