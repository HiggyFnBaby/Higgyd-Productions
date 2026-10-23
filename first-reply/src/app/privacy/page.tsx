import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What FirstReply collects from agents and from leads, and why.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="2026-10-11">
      <p>
        This explains what FirstReply collects and why. There are two kinds
        of people this applies to differently: agents who sign up for an
        account, and the leads who submit an agent's public lead-capture
        form. If you're a lead who filled out that form, see "If you
        submitted a lead form" below.
      </p>

      <h2>What we collect from agents</h2>
      <ul>
        <li>
          <strong>Your account:</strong> name, email, and a hashed password
          (we never store your password itself).
        </li>
        <li>
          <strong>Billing records:</strong> your Stripe customer and
          subscription IDs and subscription status. We do not see or store
          your card number — Stripe handles that directly.
        </li>
        <li>
          <strong>Session cookie:</strong> one cookie that keeps you logged
          in. It's strictly necessary for the app to work; we don't use
          tracking or advertising cookies.
        </li>
      </ul>

      <h2>If you submitted a lead form</h2>
      <p>
        If you filled out an agent's public lead-capture link, we collected
        the name, email, phone number, and message you entered, on that
        agent's behalf. We use it only to send you the instant reply and
        follow-up messages from that agent, and to let the agent see and
        respond to your inquiry. The agent is the one who decided to collect
        it, and you should direct any question about why you're being
        contacted to them.
      </p>

      <h2>Who we share it with (subprocessors)</h2>
      <ul>
        <li>
          <strong>Vercel</strong> — hosts the application.
        </li>
        <li>
          <strong>Our database provider</strong> — stores all application
          data (accounts, leads, billing records).
        </li>
        <li>
          <strong>Resend</strong> — delivers the instant-reply and
          follow-up emails on an agent's behalf.
        </li>
        <li>
          <strong>Stripe</strong> — processes subscription payments and
          holds payment details; we never see a full card number.
        </li>
      </ul>
      <p>We don't sell your data to anyone, ever.</p>

      <h2>How long we keep it</h2>
      <p>
        We keep lead and account data for as long as the agent's account is
        active, so they can keep referring back to past inquiries. If an
        agent's account is deleted, their leads' data is deleted with it.
      </p>

      <h2>Your choices</h2>
      <p>
        Agents can review the leads in their account directly in the
        product. Anyone — agent or lead — can request a copy or deletion of
        their data by emailing{" "}
        <a className="underline" href="mailto:1higgd@gmail.com">
          1higgd@gmail.com
        </a>
        .
      </p>

      <h2>Security</h2>
      <p>
        Passwords are hashed, not stored in plain text. Data is encrypted in
        transit. Access to the underlying database and hosting infrastructure
        is limited to the operator of this service.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions or requests:{" "}
        <a className="underline" href="mailto:1higgd@gmail.com">
          1higgd@gmail.com
        </a>
        .
      </p>
    </LegalPage>
  );
}
