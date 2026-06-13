export default function PrivacyPage() {
  return (
    <div className="container-main py-16">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
        <p className="text-zinc-400">Last updated: January 2025</p>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-zinc-200">1. Information We Collect</h2>
          <p className="text-zinc-400">We collect information you provide when creating an account, including your email address and username. We also collect usage data such as agent executions, interactions, and payment transactions.</p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-zinc-200">2. How We Use Your Information</h2>
          <p className="text-zinc-400">We use your information to provide and improve our services, process payments, send notifications, and comply with legal obligations. We do not sell your personal data to third parties.</p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-zinc-200">3. Data Retention</h2>
          <p className="text-zinc-400">Execution logs are retained for 12 months. Transaction records are retained for 7 years for accounting purposes. You can request data deletion at any time via your account settings.</p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-zinc-200">4. GDPR Rights</h2>
          <p className="text-zinc-400">As a GDPR-compliant platform, you have the right to access, rectify, export, and delete your personal data. Contact us at privacy@aiverse.com for any GDPR-related requests.</p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-zinc-200">5. Contact</h2>
          <p className="text-zinc-400">For privacy inquiries, email privacy@aiverse.com.</p>
        </section>
      </div>
    </div>
  );
}