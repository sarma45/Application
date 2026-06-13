export default function SupportPage() {
  return (
    <div className="container-main py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Support</h1>
        <p className="text-zinc-400 mb-10">We&apos;re here to help</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-200 mb-1">Email Support</h3>
            <p className="text-sm text-zinc-500">support@aiverse.com</p>
            <p className="text-xs text-zinc-600 mt-1">We respond within 24 hours</p>
          </div>

          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-200 mb-1">Live Chat</h3>
            <p className="text-sm text-zinc-500">Available Mon-Fri, 9AM-5PM EST</p>
          </div>

          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-200 mb-1">Documentation</h3>
            <p className="text-sm text-zinc-500">Check our API docs and guides</p>
          </div>

          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-200 mb-1">Community</h3>
            <p className="text-sm text-zinc-500">Join our Discord for help and discussions</p>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <h2 className="text-lg font-semibold text-zinc-200 mb-4">Send us a message</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Email</label>
              <input type="email" className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-purple-500" placeholder="your@email.com" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Subject</label>
              <input type="text" className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-purple-500" placeholder="How can we help?" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Message</label>
              <textarea rows={4} className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-purple-500 resize-none" placeholder="Describe your issue..." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}