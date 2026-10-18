import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Instrument_Serif, JetBrains_Mono, Oswald, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import { PathAssistant } from "@/components/assistant/PathAssistant";
import { SignalCursor } from "@/components/fx/SignalCursor";
import { NoiseOverlay } from "@/components/fx/NoiseOverlay";
import { cn } from "@/lib/utils";
import "./globals.css";

/**
 * Font loading uses next/font/google so the app has no dependency on local
 * binary font files (a missing .woff2 previously broke every route with a 500).
 * The four families, CSS variables and fallback stacks are unchanged, so
 * globals.css and every component keep using the same utilities.
 */
const display = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-face",
  display: "swap",
  fallback: ["Impact", "Haettenschweiler", "sans-serif"],
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif-face",
  display: "swap",
  fallback: ["Iowan Old Style", "Palatino", "serif"],
});
const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans-face",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
});

export const metadata: Metadata = {
  title: {
    default: "SkillPath — Draw the route between who you are and where you're going.",
    template: "%s · SkillPath",
  },
  description:
    "SkillPath turns what you know into a route: the gap, the next move, the project, and the role.",
  keywords: ["career roadmap", "skill gap", "students", "AI", "projects", "learning path"],
  openGraph: {
    title: "SkillPath AI",
    description: "An intelligent career and project recommendation platform for students.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#090a08",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn(display.variable, serif.variable, sans.variable, jetbrains.variable)}>
      <body className="min-h-dvh bg-ink font-sans text-fg antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-electric focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <Providers>
          <SignalCursor />
          {children}
          <PathAssistant />
          <NoiseOverlay />
        </Providers>
      </body>
    </html>
  );
}
