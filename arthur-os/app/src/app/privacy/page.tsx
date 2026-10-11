import { LegalPage } from "@/components/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="2026-10-11">
      <p>
        This explains what Arthur Digital Works OS collects when you submit
        the free audit form or become a customer, and what happens to it.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Audit submissions:</strong> your name, email, company,
          business type, stated pain point, revenue range, and urgency —
          whatever you choose to answer in the audit form.
        </li>
        <li>
          <strong>Order and delivery records:</strong> if you purchase, your
          order details, payment status (via Stripe), and the deliverables
          produced for you.
        </li>
        <li>
          <strong>Owner login:</strong> this product has a single operator
          account, not public customer accounts — customers don't create a
          login.
        </li>
      </ul>

      <h2>How we use it</h2>
      <p>
        We use your audit answers to score and review the lead, and — only
        after you've paid — to generate your deliverables. When AI drafting
        is used, your submitted answers (and nothing else) are sent to
        Anthropic's Claude API to produce a first draft, which a human then
        reviews before delivery. We never invent details you didn't provide.
      </p>

      <h2>Who we share it with (subprocessors)</h2>
      <ul>
        <li>
          <strong>Vercel</strong> — hosts the application.
        </li>
        <li>
          <strong>Our database provider</strong> — stores all application
          data (leads, offers, orders, deliverables).
        </li>
        <li>
          <strong>Anthropic</strong> — processes your audit answers when an
          AI-assisted draft is generated for your order.
        </li>
        <li>
          <strong>Stripe</strong> — processes payment for purchased
          packages; we never see your full card number.
        </li>
        <li>
          <strong>Our email provider</strong> — sends your receipt and
          delivery emails once you've purchased.
        </li>
      </ul>
      <p>We don't sell your data to anyone, ever.</p>

      <h2>Download links</h2>
      <p>
        Delivered files are accessed through a signed link that expires
        after a limited time. If your link expires before you've downloaded
        everything, reply to your delivery email and we'll issue a new one.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep audit submissions and order records to support your order
        and for our own business records. You can request deletion at any
        time (see Contact below), and we'll remove what we're not legally
        required to keep.
      </p>

      <h2>Your choices</h2>
      <p>
        To request a copy or deletion of your data, email{" "}
        <a className="underline" href="mailto:1higgd@gmail.com">
          1higgd@gmail.com
        </a>
        .
      </p>

      <h2>Security</h2>
      <p>
        Data is encrypted in transit. Download links are cryptographically
        signed and independently checked for expiry on every access. Access
        to the underlying database and hosting infrastructure is limited to
        the operator of this service.
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
