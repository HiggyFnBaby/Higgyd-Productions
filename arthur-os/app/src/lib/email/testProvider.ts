import type { EmailProvider } from "@/lib/email/types";

// Default provider. Sends nothing over the network — the caller is
// responsible for writing the EmailEvent row, this just reports what would
// have happened. See ../../../docs/environment-and-accounts.md: this is the
// safe default until Derrick explicitly configures real sending.
export const testEmailProvider: EmailProvider = {
  name: "test",
  async send() {
    return { status: "SENT_TEST" };
  },
};
