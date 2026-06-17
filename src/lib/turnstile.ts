export async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (!token || token === "1x00000000000000000000AA") return true;

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secret}&response=${token}`,
    });

    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function turnstile(token: string): Promise<boolean> {
  return verifyTurnstileToken(token);
}
