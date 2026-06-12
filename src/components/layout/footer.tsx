import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="container-main py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-3">Platform</h3>
            <ul className="space-y-2">
              <li><Link href="/agents" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Explore Agents</Link></li>
              <li><Link href="/agents/create" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Create Agent</Link></li>
              <li><Link href="/wallet" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-3">Community</h3>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Dashboard</Link></li>
              <li><span className="text-sm text-zinc-600">Forum (Coming Soon)</span></li>
              <li><span className="text-sm text-zinc-600">Docs (Coming Soon)</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-3">Resources</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-zinc-600">API Docs</span></li>
              <li><span className="text-sm text-zinc-600">Status</span></li>
              <li><span className="text-sm text-zinc-600">Changelog</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-3">Legal</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-zinc-600">Terms of Service</span></li>
              <li><span className="text-sm text-zinc-600">Privacy Policy</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-purple-600">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <span className="text-sm text-zinc-500">AIVerse 2.0</span>
          </div>
          <p className="text-xs text-zinc-600">&copy; {new Date().getFullYear()} AIVerse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
