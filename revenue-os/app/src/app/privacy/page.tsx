import { LegalPage } from "@/components/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="2026-10-11">
      <p>
        This explains what Revenue OS collects, why, and who it's shared
        with. In most of this relationship, you (the Workspace owner) are
        the controller of your leads' personal data, and we act as your
        processor — we handle it on your instructions, not our own.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Your account:</strong> name, email, and a hashed password
          (we never store your password itself).
        </li>
        <li>
          <strong>Your Workspace:</strong> its name and anything you enter
          about it.
        </li>
        <li>
          <strong>Leads you add:</strong> name, company, contact info, and
          free-text notes you enter about your prospects.
        </li>
        <li>
          <strong>Agent runs:</strong> when you run an AI agent on a lead, we
          store the input sent to Claude and the output it returns, so you
          and later steps in the pipeline can see exactly what was produced.
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

      <h2>Who we share it with (subprocessors)</h2>
      <ul>
        <li>
          <strong>Vercel</strong> — hosts the application.
        </li>
        <li>
          <strong>Our database provider</strong> — stores all application
          data (accounts, workspaces, leads, agent runs, billing records).
        </li>
        <li>
          <strong>Anthropic</strong> — processes lead data you submit when
          you click "Run agent," to generate the requested output.
        </li>
        <li>
          <strong>Stripe</strong> — processes subscription payments and
          holds your payment details; we never see your full card number.
        </li>
      </ul>
      <p>We don't sell your data or your leads' data to anyone, ever.</p>

      <h2>How long we keep it</h2>
      <p>
        We keep account and lead data for as long as your Workspace is
        active. If you ask us to delete your Workspace, we delete the
        underlying records (leads, agent runs, tasks, stage history) rather
        than just hiding them.
      </p>

      <h2>Your choices</h2>
      <p>
        You can review or correct the data in your Workspace directly in the
        product. To request a full export or deletion of your account and
        its data, email{" "}
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
