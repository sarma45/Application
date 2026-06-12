import { logger } from "./logger";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn("RESEND_API_KEY not set, skipping email", { to, subject });
    return false;
  }

  const from = process.env.EMAIL_FROM || "noreply@aiverse.ai";

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({ from, to, subject, html });
    return true;
  } catch (err) {
    logger.error("Email send failed", { to, subject, error: err });
    return false;
  }
}
