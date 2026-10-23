import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when a real estate agent uses FirstReply.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="2026-10-11">
      <p>
        FirstReply gives you a unique link to share with prospective clients.
        When someone submits that form, we automatically send them an
        instant reply and a scheduled follow-up sequence by email, so a slow
        response never costs you the lead. These terms cover your use of
        that product as a paying agent.
      </p>

      <h2>The account</h2>
      <p>
        You sign up with your name, email, and a password, and you get a
        public lead-capture link tied to your account. You're responsible
        for keeping your password confidential and for everything that
        happens under your account.
      </p>

      <h2>You control what goes to your leads</h2>
      <p>
        You are responsible for having the right to contact people who
        submit your lead form — for example, that submitting the form is
        itself their consent to hear back from you, and that you comply with
        applicable marketing and communications law in your area. FirstReply
        sends the automated messages on your behalf; you're the one
        representing yourself to those leads, not us.
      </p>

      <h2>No guarantees</h2>
      <p>
        We don't guarantee that any lead responds, converts, or stays
        interested. FirstReply speeds up your response time; it doesn't
        promise an outcome.
      </p>

      <h2>Billing</h2>
      <p>
        FirstReply is billed on a recurring monthly basis through Stripe once
        billing is turned on for your account. Charges happen automatically
        each period until canceled. There is currently no self-serve cancel
        button — email{" "}
        <a className="underline" href="mailto:1higgd@gmail.com">
          1higgd@gmail.com
        </a>{" "}
        to cancel, and we'll confirm once it's done and no further charges
        will occur.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Don't use your lead-capture link to collect information from people
        you don't have a legitimate reason to contact, to send content that
        violates applicable law, or to attempt to disrupt or
        reverse-engineer the service.
      </p>

      <h2>Changes and termination</h2>
      <p>
        We may update these terms as the product changes; continued use
        after an update means you accept the new terms. We may suspend an
        account that violates these terms or stops paying for a subscribed
        plan.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms:{" "}
        <a className="underline" href="mailto:1higgd@gmail.com">
          1higgd@gmail.com
        </a>
        .
      </p>
    </LegalPage>
  );
}
