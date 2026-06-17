import { cacheGet, cacheSet } from "@/lib/redis";
import { logger } from "@/lib/logger";

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  rules?: {
    percentage?: number;
    userRoles?: string[];
    userIds?: string[];
    planTypes?: string[];
  };
}

const BUILT_IN_FLAGS: Record<string, FeatureFlag> = {
  "new-chat-ui": {
    key: "new-chat-ui",
    enabled: false,
    description: "Enable the redesigned chat interface",
    rules: { percentage: 0 },
  },
  "ai-provider-failover": {
    key: "ai-provider-failover",
    enabled: true,
    description: "Enable automatic AI provider failover with circuit breaker",
  },
  "webhook-event-relay": {
    key: "webhook-event-relay",
    enabled: false,
    description: "Enable event-driven webhook relay system",
    rules: { planTypes: ["BUSINESS", "ENTERPRISE"] },
  },
  "semantic-search": {
    key: "semantic-search",
    enabled: true,
    description: "Enable pgvector-based semantic search for agents",
  },
  "analytics-dashboard": {
    key: "analytics-dashboard",
    enabled: false,
    description: "Enable the new analytics dashboard",
    rules: { userRoles: ["ADMIN", "ENTERPRISE"] },
  },
  "organization-sso": {
    key: "organization-sso",
    enabled: false,
    description: "Enable SSO/SAML for organizations",
    rules: { planTypes: ["ENTERPRISE"] },
  },
};

const FLAG_CACHE_TTL = 60;

function flagCacheKey(key: string): string {
  return `flag:${key}`;
}

async function getOverrides(): Promise<Record<string, boolean>> {
  const stored = await cacheGet<Record<string, boolean>>("feature-flags:overrides");
  return stored || {};
}

export async function isFeatureEnabled(
  key: string,
  context?: { userId?: string; role?: string; plan?: string }
): Promise<boolean> {
  const flag = BUILT_IN_FLAGS[key];
  if (!flag) return false;

  const cached = await cacheGet<boolean>(flagCacheKey(key));
  if (cached !== null) return cached;

  const overrides = await getOverrides();
  if (key in overrides) return overrides[key];

  if (!flag.enabled) return false;

  if (flag.rules) {
    if (flag.rules.percentage !== undefined && flag.rules.percentage < 100) {
      if (context?.userId) {
        const hash = simpleHash(context.userId + key) % 100;
        if (hash >= flag.rules.percentage) return false;
      }
    }

    if (flag.rules.userRoles?.length && context?.role) {
      if (!flag.rules.userRoles.includes(context.role)) return false;
    }

    if (flag.rules.planTypes?.length && context?.plan) {
      if (!flag.rules.planTypes.includes(context.plan)) return false;
    }

    if (flag.rules.userIds?.length && context?.userId) {
      if (!flag.rules.userIds.includes(context.userId)) return false;
    }
  }

  return true;
}

export async function setFeatureOverride(key: string, enabled: boolean): Promise<void> {
  const overrides = await getOverrides();
  overrides[key] = enabled;
  await cacheSet("feature-flags:overrides", overrides, 86400);
  await cacheSet(flagCacheKey(key), enabled, FLAG_CACHE_TTL);
  logger.info("Feature flag override set", { key, enabled });
}

export async function clearFeatureOverride(key: string): Promise<void> {
  const overrides = await getOverrides();
  delete overrides[key];
  await cacheSet("feature-flags:overrides", overrides, 86400);
  await cacheSet(flagCacheKey(key), BUILT_IN_FLAGS[key]?.enabled ?? false, FLAG_CACHE_TTL);
  logger.info("Feature flag override cleared", { key });
}

export function listFeatureFlags(): FeatureFlag[] {
  return Object.values(BUILT_IN_FLAGS);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
