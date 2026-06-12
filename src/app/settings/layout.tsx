import { requireAuth } from "@/lib/auth";
import Link from "next/link";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return (
    <div className="container-main py-8">
      <nav className="flex gap-4 mb-8 border-b border-zinc-800 pb-4">
        <Link href="/settings" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Profile</Link>
        <Link href="/settings/password" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Password</Link>
      </nav>
      {children}
    </div>
  );
}
