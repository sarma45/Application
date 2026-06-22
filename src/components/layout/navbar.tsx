"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

const navLinks = [
  { href: "/agents", label: "Explore" },
  { href: "/agentswarm", label: "Agent Swarm" },
  { href: "/agents/create", label: "Create" },
  { href: "/pricing", label: "Pricing" },
  { href: "/open-source", label: "Open Models" },
  { href: "/wallet", label: "Wallet" },
];

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-theme bg-white/5 backdrop-blur-sm text-secondary hover:text-theme hover:border-strong transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && menuRef.current) {
        const focusable = menuRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={menuRef}
        className={`fixed top-0 right-0 z-50 h-full w-64 glass-strong border-l border-theme transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex items-center justify-between p-4 border-b border-theme">
          <span className="text-sm font-semibold text-theme font-[family-name:var(--font-neural)]">Menu</span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:text-theme hover:bg-white/5 transition-colors"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 ${
                  isActive
                    ? "text-white bg-purple-500/10 border border-purple-500/20"
                    : "text-secondary hover:text-theme hover:bg-white/5"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

export function Navbar({ session }: { session: any }) {
  const pathname = usePathname();
  const user = session?.user;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-theme">
      <div className="container-main flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-stream-500 neural-glow transition-transform duration-300 group-hover:scale-110">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <span className="text-lg font-semibold text-theme font-[family-name:var(--font-neural)]">
              AIVerse
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-2 text-sm rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    isActive
                      ? "text-theme"
                      : "text-secondary hover:text-theme"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 bg-gradient-to-r from-purple-500 to-stream-400 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/wallet" className="hidden sm:block">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <svg className="h-4 w-4 text-stream-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Credits
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-stream-500 text-xs font-medium text-white">
                    <span className="relative z-10">{(user.email || "U")[0].toUpperCase()}</span>
                    <span className="absolute inset-0 rounded-full neural-pulse" />
                  </div>
                  <span className="hidden sm:inline text-sm text-secondary">{user.email}</span>
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button size="sm" className="neural-glow">Sign up</Button>
              </Link>
            </>
          )}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden flex h-11 w-11 items-center justify-center rounded-lg text-secondary hover:text-theme hover:bg-white/5 transition-colors"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
