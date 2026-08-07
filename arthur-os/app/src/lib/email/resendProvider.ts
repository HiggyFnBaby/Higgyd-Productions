import type { EmailProvider, SendEmailParams, SendEmailResult } from "@/lib/email/types";

// Real email sending via Resend's HTTP API. Only used when
// EMAIL_PROVIDER=resend is explicitly set — see
// ../../../docs/owner-decisions-needed.md #2. This sends REAL email to REAL
// buyers once configured; do not enable without Derrick's explicit sign-off.
export const resendEmailProvider: EmailProvider = {
  name: "resend",
  async send({ to, subject, html }: SendEmailParams): Promise<SendEmailResult> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) {
      return { status: "FAILED", error: "RESEND_API_KEY or EMAIL_FROM is not set." };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, html }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        return { status: "FAILED", error: `Resend API returned ${response.status}: ${body}` };
      }

      return { status: "SENT" };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error sending email.";
      return { status: "FAILED", error: message };
    }
  },
};
