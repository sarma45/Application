export const DEFAULT_LOCALE = "en" as const;

type TranslationMap = Record<string, Record<string, string>>;

const translations: TranslationMap = {
  en: {
    "nav.home": "Home",
    "nav.agents": "Agents",
    "nav.pricing": "Pricing",
    "nav.dashboard": "Dashboard",
    "nav.login": "Sign In",
    "nav.register": "Sign Up",
    "nav.logout": "Sign Out",
    "nav.profile": "Profile",
    "nav.settings": "Settings",
    "hero.title": "The Enterprise AI Agent Marketplace",
    "hero.subtitle": "Discover, deploy, and integrate AI agents for your business — from chatbots to data analyzers.",
    "hero.cta": "Explore Agents",
    "hero.cta.create": "Create Agent",
    "agent.featured": "Featured Agents",
    "agent.trending": "Trending",
    "agent.popular": "Popular",
    "agent.newest": "Newest",
    "agent.search": "Search agents...",
    "agent.free": "Free",
    "agent.paid": "Paid",
    "agent.runs": "runs",
    "agent.rating": "Rating",
    "pricing.title": "Simple, Transparent Pricing",
    "pricing.free": "Free",
    "pricing.pro": "Pro",
    "pricing.business": "Business",
    "pricing.enterprise": "Enterprise",
    "auth.welcome": "Welcome back",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.forgot": "Forgot password?",
    "dashboard.title": "Dashboard",
    "dashboard.credits": "Credits",
    "dashboard.usage": "Usage",
    "dashboard.myAgents": "My Agents",
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.confirm": "Confirm",
    "common.search": "Search",
    "common.noResults": "No results found",
    "errors.unauthorized": "Please sign in to continue",
    "errors.notFound": "Page not found",
    "errors.serverError": "Internal server error",
  },
};

export function t(key: string, locale?: string): string {
  const lang = locale || DEFAULT_LOCALE;
  return translations[lang]?.[key] || translations[DEFAULT_LOCALE]?.[key] || key;
}

export const translate = t;
