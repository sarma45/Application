export default function FAQPage() {
  const faqs = [
    { q: "What is AIVerse?", a: "AIVerse is a marketplace for AI agents. Creators build and publish agents, users discover and run them, and everyone benefits from a unified platform with multiple AI models." },
    { q: "How does pricing work?", a: "We use a credit system. 100 credits = $1 USD. Free users get 10 runs/day. Pro users ($19/mo) get 500 credits/month. Creator ($39/mo) and Business ($99/mo) plans offer more credits and additional features." },
    { q: "How do creators earn money?", a: "Creators earn 80% of every credit spent on their agents. You can request a payout once you've earned at least $10. First-time creators have a 30-day payout hold." },
    { q: "What AI models are supported?", a: "We support OpenAI, Anthropic (Claude), Google Gemini, Groq, DeepSeek, Cohere, and OpenRouter. Each agent category routes to the optimal model automatically." },
    { q: "How do I publish an agent?", a: "Use our 4-step wizard: fill in basics, write a system prompt, set pricing, and submit for review. Once approved by our moderation team, your agent goes live on the marketplace." },
    { q: "Is my data secure?", a: "All system prompts are encrypted with AES-256-GCM. We use rate limiting, CSRF protection, prompt injection detection, and a trust scoring system. We are GDPR compliant." },
    { q: "Can I use AIVerse for free?", a: "Yes! Free tier includes 10 agent runs per day. No credit card required. Upgrade to a paid plan for more runs and additional features." },
    { q: "How do I get help?", a: "Contact us at support@aiverse.com or visit our support page. We typically respond within 24 hours." },
  ];

  return (
    <div className="container-main py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">FAQ</h1>
        <p className="text-zinc-400 mb-10">Frequently asked questions about AIVerse</p>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer text-zinc-200 font-medium hover:bg-zinc-800/30 transition-colors">
                {faq.q}
                <svg className="w-5 h-5 text-zinc-500 group-open:rotate-180 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}