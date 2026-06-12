export interface SafetyResult {
  safe: boolean;
  reason?: string;
  score?: number;
}

export interface TrustScore {
  userId: string;
  score: number;
  violations: number;
  lastViolationAt: string | null;
}

// Prompt injection detection patterns
const injectionPatterns = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions/i,
  /forget\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts)/i,
  /you\s+(are\s+)?(now|are\s+free|are\s+released)/i,
  /system\s+(prompt|instruction|message)/i,
  /act\s+as\s+(if\s+you\s+are\s+)?(dan|jailbreak|unfiltered|unrestricted)/i,
  /bypass\s+(all\s+)?(restrictions|safeguards|filters)/i,
  /output\s+(raw|unfiltered|unsafe)\s+(content|text|data)/i,
  /<\|im_start\|>|<\|im_end\|>|<\|sys\|>/i,
  /reveal\s+(the\s+)?(system\s+)?prompt/i,
  /print\s+(the\s+)?(above|instructions|prompt)/i,
  /you\s+must\s+(obey|follow)\s+my\s+(commands|instructions)/i,
  /ignore\s+ethics/i,
  /ignore\s+safety/i,
  /dangerous\s+(action|task|request)/i,
];

// Extended PII patterns
const piiPatterns = [
  // SSN
  /\b\d{3}-\d{2}-\d{4}\b/,
  // Credit card numbers (Luhn-checkable)
  /\b(?:\d{4}[-\s]?){3}\d{4}\b/,
  // Email
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  // Phone numbers (US/international)
  /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  // API keys / tokens (common patterns)
  /\b(?:sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36,}|[A-Za-z0-9_-]{20,40}\.[A-Za-z0-9_-]{20,40}\.[A-Za-z0-9_-]{20,40})\b/,
  // IP addresses
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
  // Passport numbers (simplified)
  /\b[A-Z]{1,2}\d{6,9}\b/,
  // Bank account numbers (simplified)
  /\b\d{8,17}\b/,
];

const toxicityTerms = [
  /\b(spam|scam|fraud|illegal|unlawful)\b/i,
  /\b(hack|crack|exploit|breach)\b/i,
  /\b(kill|murder|suicide|harm)\s+\w+/i,
  /\b(bomb|weapon|explosive|poison)\b/i,
];

export function checkPromptInjection(input: string): SafetyResult {
  const severity: string[] = [];
  for (const pattern of injectionPatterns) {
    if (pattern.test(input)) {
      severity.push(pattern.source);
    }
  }
  if (severity.length > 0) {
    return {
      safe: false,
      reason: `Prompt injection pattern detected (${severity.length} match${severity.length > 1 ? "es" : ""})`,
      score: Math.max(0, 100 - severity.length * 30),
    };
  }
  return { safe: true, score: 100 };
}

export function checkPII(input: string): SafetyResult {
  const found: string[] = [];
  for (const pattern of piiPatterns) {
    const matches = input.match(pattern);
    if (matches) {
      found.push(matches[0]);
    }
  }
  if (found.length > 0) {
    return {
      safe: false,
      reason: "PII detected in input",
      score: Math.max(0, 100 - found.length * 25),
    };
  }
  return { safe: true, score: 100 };
}

export function checkToxicity(input: string): SafetyResult {
  for (const pattern of toxicityTerms) {
    if (pattern.test(input)) {
      return { safe: false, reason: "Potentially harmful content detected", score: 30 };
    }
  }
  return { safe: true, score: 100 };
}

// In-memory trust store (replace with Redis in production)
const trustStore = new Map<string, TrustScore>();

export function getTrustScore(userId: string): TrustScore {
  if (!trustStore.has(userId)) {
    trustStore.set(userId, { userId, score: 100, violations: 0, lastViolationAt: null });
  }
  return trustStore.get(userId)!;
}

export function recordViolation(userId: string, reason: string): TrustScore {
  const trust = getTrustScore(userId);
  trust.violations += 1;
  trust.score = Math.max(0, trust.score - 15 * trust.violations);
  trust.lastViolationAt = new Date().toISOString();
  trustStore.set(userId, trust);

  if (trust.score <= 0) {
    trust.score = 0;
  }
  return trust;
}

export function isSuspended(userId: string): boolean {
  const trust = getTrustScore(userId);
  return trust.score <= 0 || trust.violations >= 7;
}

export function sanitizeInput(input: string): string {
  let cleaned = input
    .replace(/<\|im_start\|>/gi, "")
    .replace(/<\|im_end\|>/gi, "")
    .replace(/<\|sys\|>/gi, "")
    .trim();

  // Redact PII from logs
  cleaned = cleaned.replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, "[REDACTED_CC]");
  cleaned = cleaned.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[REDACTED_EMAIL]");
  cleaned = cleaned.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]");
  cleaned = cleaned.replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[REDACTED_PHONE]");
  cleaned = cleaned.replace(/\b(?:sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36,})/g, "[REDACTED_KEY]");

  return cleaned;
}

export function checkSafety(input: string, userId?: string): SafetyResult {
  if (userId) {
    const trust = getTrustScore(userId);
    if (trust.score <= 0) {
      return { safe: false, reason: "Account suspended due to repeated violations", score: 0 };
    }
  }

  const injection = checkPromptInjection(input);
  if (!injection.safe) {
    if (userId) recordViolation(userId, injection.reason || "prompt_injection");
    return injection;
  }

  const pii = checkPII(input);
  if (!pii.safe) {
    if (userId) recordViolation(userId, pii.reason || "pii_detected");
    return pii;
  }

  const toxicity = checkToxicity(input);
  if (!toxicity.safe) {
    if (userId) recordViolation(userId, toxicity.reason || "toxic_content");
    return toxicity;
  }

  return { safe: true, score: userId ? getTrustScore(userId).score : 100 };
}

export function resetTrustScore(userId: string) {
  trustStore.set(userId, { userId, score: 100, violations: 0, lastViolationAt: null });
}
