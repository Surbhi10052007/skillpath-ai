"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { ProfileProvider } from "./ProfileProvider";
import { SessionNotice } from "@/components/auth/SessionNotice";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <ProfileProvider>
          <SessionNotice />
          {children}
        </ProfileProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
