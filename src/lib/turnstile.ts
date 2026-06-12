const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || "";

interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) {
    return true;
  }

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: TURNSTILE_SECRET, response: token }),
    });

    const data: TurnstileResponse = await res.json();
    return data.success;
  } catch {
    return false;
  }
}
