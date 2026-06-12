"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/agents", label: "Explore" },
  { href: "/agents/create", label: "Create" },
  { href: "/wallet", label: "Wallet" },
];

export function Navbar({ session }: { session: any }) {
  const pathname = usePathname();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="container-main flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <span className="text-lg font-semibold text-white">AIVerse</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 text-sm rounded-md transition-colors",
                  pathname === link.href
                    ? "text-white bg-zinc-800"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/wallet">
                <Button variant="secondary" size="sm">
                  <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Credits
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-xs font-medium text-white">
                    {(user.email || "U")[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm">{user.email}</span>
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
