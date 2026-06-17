import { logger } from "@/lib/logger";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "noreply@aiverse.ai";

  if (!apiKey) {
    logger.warn("Email not sent: RESEND_API_KEY not configured", { to: params.to, subject: params.subject });
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      logger.error("Failed to send email", { error, to: params.to });
      return false;
    }

    logger.info("Email sent", { to: params.to, subject: params.subject });
    return true;
  } catch (error) {
    logger.error("Email send error", { error: String(error), to: params.to });
    return false;
  }
}
