export default function GDPRPage() {
  return (
    <div className="container-main py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">GDPR Compliance</h1>
        <p className="text-zinc-400 mb-8">AIVerse is committed to protecting your privacy and complying with the General Data Protection Regulation (GDPR).</p>

        <section className="space-y-6">
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
            <h2 className="text-lg font-semibold text-zinc-200 mb-2">Your Rights</h2>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>✓ Right to access your personal data</li>
              <li>✓ Right to rectify inaccurate data</li>
              <li>✓ Right to erasure (&quot;right to be forgotten&quot;)</li>
              <li>✓ Right to restrict processing</li>
              <li>✓ Right to data portability</li>
              <li>✓ Right to object to processing</li>
            </ul>
          </div>

          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
            <h2 className="text-lg font-semibold text-zinc-200 mb-2">Data We Collect</h2>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>• Account information (email, username)</li>
              <li>• AI agent execution history (12-month retention)</li>
              <li>• Transaction records (7-year retention for tax purposes)</li>
              <li>• Usage analytics (aggregated, anonymized)</li>
            </ul>
          </div>

          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
            <h2 className="text-lg font-semibold text-zinc-200 mb-2">Data Export</h2>
            <p className="text-sm text-zinc-400 mb-3">You can export all your data from your account settings at any time.</p>
            <p className="text-sm text-zinc-400">For additional requests, contact privacy@aiverse.com.</p>
          </div>

          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
            <h2 className="text-lg font-semibold text-zinc-200 mb-2">Data Deletion</h2>
            <p className="text-sm text-zinc-400 mb-3">You can delete your account and all associated data from your account settings. This will:</p>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>• Permanently delete your account and profile</li>
              <li>• Anonymize your agents and reviews</li>
              <li>• Delete your wallet and transaction history (except records required for tax purposes)</li>
              <li>• Remove your personal data from our systems</li>
            </ul>
          </div>
        </section>

        <div className="mt-8 p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <h2 className="text-lg font-semibold text-zinc-200 mb-2">Contact Our DPO</h2>
          <p className="text-sm text-zinc-400">For GDPR-related inquiries, contact our Data Protection Officer:</p>
          <p className="text-sm text-zinc-300 mt-2">Email: dpo@aiverse.com</p>
        </div>
      </div>
    </div>
  );
}