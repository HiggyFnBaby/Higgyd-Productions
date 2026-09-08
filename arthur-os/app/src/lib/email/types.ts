export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  status: "SENT_TEST" | "SENT" | "FAILED";
  error?: string;
}

// Every email provider (test-mode logger, Resend, a future Gmail OAuth
// integration) implements this same shape. Route handlers only ever talk to
// this interface via getEmailProvider() — see ../../../docs/architecture.md
// and ../../../CLAUDE.md's EMAIL RULES for why real sending is opt-in.
export interface EmailProvider {
  name: string;
  send(params: SendEmailParams): Promise<SendEmailResult>;
}
