import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-zinc-950/80 backdrop-blur-xl">
      <div className="container-main py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-3 font-[family-name:var(--font-neural)]">Platform</h3>
            <ul className="space-y-2">
              <li><Link href="/agents" className="text-sm text-zinc-500 hover:text-stream-400 transition-colors">Explore Agents</Link></li>
              <li><Link href="/agents/create" className="text-sm text-zinc-500 hover:text-stream-400 transition-colors">Create Agent</Link></li>
              <li><Link href="/wallet" className="text-sm text-zinc-500 hover:text-stream-400 transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-3 font-[family-name:var(--font-neural)]">Community</h3>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="text-sm text-zinc-500 hover:text-stream-400 transition-colors">Dashboard</Link></li>
              <li><span className="text-sm text-zinc-600">Forum (Coming Soon)</span></li>
              <li><span className="text-sm text-zinc-600">Docs (Coming Soon)</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-3 font-[family-name:var(--font-neural)]">Resources</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-zinc-600">API Docs</span></li>
              <li><span className="text-sm text-zinc-600">Status</span></li>
              <li><span className="text-sm text-zinc-600">Changelog</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-3 font-[family-name:var(--font-neural)]">Legal</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-zinc-600">Terms of Service</span></li>
              <li><span className="text-sm text-zinc-600">Privacy Policy</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-purple-600 to-stream-500">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <span className="text-sm text-zinc-500 font-[family-name:var(--font-neural)]">AIVerse 2.0</span>
          </div>
          <p className="text-xs text-zinc-600">&copy; {new Date().getFullYear()} AIVerse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
