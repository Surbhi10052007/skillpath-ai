"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Logo } from "./Logo";

export function Footer() {
  const { isAuthenticated, isLoading } = useAuth();

  const links = isAuthenticated
    ? [
        { href: "/", label: "Home" },
        { href: "/dashboard", label: "Dashboard" },
        { href: "/projects", label: "Projects" },
        { href: "/roadmap", label: "Roadmap" },
        { href: "/profile", label: "Profile" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/onboarding", label: "Build my path" },
        { href: "/login", label: "Sign in" },
        { href: "/signup", label: "Sign up" },
      ];

  return (
    <footer className="border-t border-fg/10 bg-ink">
      <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-8 px-5 py-10 sm:flex-row sm:items-end">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted">
            A route, not a feed. Tell SkillPath where you are. It will not pretend to know before you do.
          </p>
        </div>
        {!isLoading && (
          <div className="flex flex-wrap gap-6 font-mono text-[11px] uppercase tracking-[0.16em] text-dim">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-electric">
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}
