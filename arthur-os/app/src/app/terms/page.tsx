import { LegalPage } from "@/components/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="2026-10-11">
      <p>
        Arthur Digital Works OS sells one flagship package — AI Business
        Growth-in-a-Box — built from a free audit you submit, then produced,
        quality-checked, and delivered to you as a set of files. These terms
        cover a purchase of that package.
      </p>

      <h2>The free audit</h2>
      <p>
        Submitting the audit form does not create a contract or charge you
        anything. A real person reviews every submission before anything is
        offered or charged — we don't auto-send checkout links. If it looks
        like a fit, you'll receive a specific, priced offer by email.
      </p>

      <h2>Purchase and delivery</h2>
      <p>
        If you accept an offer, you pay a one-time fee through Stripe
        Checkout. After payment is verified, we produce your deliverables,
        put them through independent quality and red-team review, and send
        you a secure, time-limited download link along with a receipt email.
        Delivery timing depends on the current queue; we'll tell you what to
        expect at the time you order.
      </p>

      <h2>No guarantees</h2>
      <p>
        We never guarantee revenue, rankings, leads, or any specific business
        outcome from using the deliverables. We also never fabricate
        results, testimonials, or statistics in anything we produce for you
        — everything in the audit report and deliverables is built only
        from what you actually told us.
      </p>

      <h2>Refunds</h2>
      <p>
        If something is wrong with what you received, contact us and we'll
        work it out — refund and revision requests are handled case by case,
        not through an automated process.
      </p>

      <h2>What you can do with the deliverables</h2>
      <p>
        The package is built for your own business use. Resale or
        redistribution of the deliverables as your own standalone product
        isn't permitted without talking to us first.
      </p>

      <h2>Changes and termination</h2>
      <p>
        We may update these terms as the product changes; continued use
        after an update means you accept the new terms.
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
