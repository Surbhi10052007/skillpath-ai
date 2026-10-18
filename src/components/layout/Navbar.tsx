"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/roadmap", label: "Roadmap" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const first = user?.name.split(" ")[0];

  useEffect(() => {
    setOpen(false);
    setAccountOpen(false);
  }, [pathname, user?.id]);

  const signOut = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-fg/10 bg-ink/85 backdrop-blur-md">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <ul className="hidden items-center gap-6 md:flex">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link href={link.href} data-cursor="link" className={cn("font-mono text-[11px] uppercase tracking-[0.18em] transition", active ? "text-electric" : "text-muted hover:text-fg")}>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="hidden items-center gap-3 md:flex">
          {loading ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">Checking signal</span>
          ) : user ? (
            <div className="relative">
              <button type="button" onClick={() => setAccountOpen((value) => !value)} aria-expanded={accountOpen} aria-haspopup="menu" className="flex items-center gap-3 border border-fg/15 px-3 py-1.5 hover:border-electric">
                <span className="grid h-7 w-7 place-items-center bg-electric font-mono text-[11px] text-ink">{first?.slice(0, 1)}</span>
                <span className="text-left">
                  <span className="block font-mono text-[11px] uppercase tracking-[0.12em] text-fg">Hi, {first}</span>
                  <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-mint"><span className="h-1.5 w-1.5 rounded-full bg-electric" /> Online</span>
                </span>
              </button>
              <AnimatePresence>
                {accountOpen && (
                  <motion.div role="menu" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="absolute right-0 top-12 w-52 border border-fg/15 bg-ink-2 p-2">
                    <Link href="/dashboard" className="block px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-fg hover:bg-fg/5">Dashboard</Link>
                    <Link href="/profile" className="block px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-fg hover:bg-fg/5">Profile</Link>
                    <button type="button" onClick={() => void signOut()} className="flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.14em] text-neon hover:bg-fg/5">
                      <LogOut className="h-3.5 w-3.5" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link href="/login" className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg hover:text-electric">Sign in</Link>
              <Link href="/signup" className="bg-electric px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink hover:bg-electric-2">Sign up</Link>
            </>
          )}
        </div>
        <button type="button" className="md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-fg/10 bg-ink md:hidden">
            <div className="flex flex-col px-5 py-4">
              {user && <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-electric">Hi, {first} · online</p>}
              {LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="border-b border-fg/10 py-3 font-display text-4xl uppercase text-fg">{link.label}</Link>
              ))}
              {user ? (
                <button type="button" onClick={() => void signOut()} className="mt-4 border border-neon/40 py-3 font-mono text-xs uppercase tracking-[0.16em] text-neon">Logout</button>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link href="/login" className="border border-fg/20 py-3 text-center font-mono text-xs uppercase tracking-[0.16em]">Sign in</Link>
                  <Link href="/signup" className="bg-electric py-3 text-center font-mono text-xs uppercase tracking-[0.16em] text-ink">Sign up</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
