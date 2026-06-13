import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-theme bg-theme/80 backdrop-blur-xl">
      <div className="container-main py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-theme mb-3 font-[family-name:var(--font-neural)]">Platform</h3>
            <ul className="space-y-2">
              <li><Link href="/agents" className="text-sm text-secondary hover:text-stream-400 transition-colors">Explore Agents</Link></li>
              <li><Link href="/agents/create" className="text-sm text-secondary hover:text-stream-400 transition-colors">Create Agent</Link></li>
              <li><Link href="/wallet" className="text-sm text-secondary hover:text-stream-400 transition-colors">Pricing</Link></li>
              <li><Link href="/open-source" className="text-sm text-secondary hover:text-stream-400 transition-colors">Open Models</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-theme mb-3 font-[family-name:var(--font-neural)]">Community</h3>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="text-sm text-secondary hover:text-stream-400 transition-colors">Dashboard</Link></li>
              <li><span className="text-sm text-muted">Forum (Coming Soon)</span></li>
              <li><span className="text-sm text-muted">Docs (Coming Soon)</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-theme mb-3 font-[family-name:var(--font-neural)]">Resources</h3>
            <ul className="space-y-2">
              <li><Link href="/api-docs" className="text-sm text-secondary hover:text-stream-400 transition-colors">API Docs</Link></li>
              <li><span className="text-sm text-muted">Status</span></li>
              <li><span className="text-sm text-muted">Changelog</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-theme mb-3 font-[family-name:var(--font-neural)]">Legal</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-muted">Terms of Service</span></li>
              <li><span className="text-sm text-muted">Privacy Policy</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-theme flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-purple-600 to-stream-500">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <span className="text-sm text-secondary font-[family-name:var(--font-neural)]">AIVerse 2.0</span>
          </div>
          <p className="text-xs text-muted">&copy; {new Date().getFullYear()} AIVerse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
