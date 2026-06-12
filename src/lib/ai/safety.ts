const injectionPatterns = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions/i,
  /forget\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts)/i,
  /you\s+(are\s+)?(now|are\s+free|are\s+released)/i,
  /system\s+(prompt|instruction|message)/i,
  /act\s+as\s+(if\s+you\s+are\s+)?(dan|jailbreak|unfiltered|unrestricted)/i,
  /bypass\s+(all\s+)?(restrictions|safeguards|filters)/i,
  /output\s+(raw|unfiltered|unsafe)\s+(content|text|data)/i,
  /<\|im_start\|>|<\|im_end\|>|<\|sys\|>/i,
];

const piiPatterns = [
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b(?:\d{4}[-\s]?){3}\d{4}\b/,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
];

export interface SafetyResult {
  safe: boolean;
  reason?: string;
}

export function checkPromptInjection(input: string): SafetyResult {
  for (const pattern of injectionPatterns) {
    if (pattern.test(input)) {
      return { safe: false, reason: "Prompt injection pattern detected" };
    }
  }
  return { safe: true };
}

export function checkPII(input: string): SafetyResult {
  for (const pattern of piiPatterns) {
    if (pattern.test(input)) {
      return { safe: false, reason: "PII detected in input" };
    }
  }
  return { safe: true };
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/<\|im_start\|>/gi, "")
    .replace(/<\|im_end\|>/gi, "")
    .replace(/<\|sys\|>/gi, "")
    .trim();
}

export function checkSafety(input: string): SafetyResult {
  const injection = checkPromptInjection(input);
  if (!injection.safe) return injection;

  const pii = checkPII(input);
  if (!pii.safe) return pii;

  return { safe: true };
}
