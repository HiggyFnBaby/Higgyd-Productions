import type { EmailProvider } from "@/lib/email/types";
import { testEmailProvider } from "@/lib/email/testProvider";
import { resendEmailProvider } from "@/lib/email/resendProvider";

// Defaults to "test" — real sending is an explicit opt-in via
// EMAIL_PROVIDER=resend, never the default. See ../../../CLAUDE.md's EMAIL
// RULES and ../../../docs/owner-decisions-needed.md #2.
export function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER ?? "test";

  switch (provider) {
    case "test":
      return testEmailProvider;
    case "resend":
      return resendEmailProvider;
    default:
      throw new Error(`Unknown EMAIL_PROVIDER "${provider}" — only "test" and "resend" are implemented.`);
  }
}
