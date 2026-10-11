import { LegalPage } from "@/components/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="2026-10-11">
      <p>
        Revenue OS is a CRM that walks each of your leads through a fixed
        pipeline (Signal → Offer → Angle → Conversation → Won) and can, at
        your request, run an AI agent against a lead to draft research, an
        offer, content angles, or conversation scripts. These terms cover
        your use of that product.
      </p>

      <h2>The account</h2>
      <p>
        You create a Workspace and log in with an email and password. You are
        responsible for keeping that password confidential and for
        everything that happens under your account. A Workspace currently
        has one owner; shared multi-member access is not yet available.
      </p>

      <h2>Your leads, your responsibility</h2>
      <p>
        Everything you enter about a lead — their name, company, contact
        details, and notes — is your data about your prospects, not ours. You
        are the one responsible for having a lawful basis to hold and act on
        that information (for example, that you're allowed to contact that
        person). We store it and process it on your behalf, and we don't
        sell it or use it for anything except running the product for you.
      </p>

      <h2>AI-generated output</h2>
      <p>
        When you run an agent on a lead, that lead's data is sent to
        Anthropic's Claude API to generate research, an offer, content
        angles, or conversation material. This output is a draft, not
        verified fact — review it before you rely on it or send it to
        anyone. We never fabricate or guarantee results, and you shouldn't
        present AI-drafted material as independently verified unless you've
        checked it yourself.
      </p>

      <h2>Billing</h2>
      <p>
        Paid workspaces are billed on a recurring basis through Stripe.
        Charges happen automatically each billing period until the
        subscription is canceled. There is currently no self-serve cancel
        button in the product — email{" "}
        <a className="underline" href="mailto:1higgd@gmail.com">
          1higgd@gmail.com
        </a>{" "}
        to cancel, and we'll confirm once it's done and no further charges
        will occur.
      </p>

      <h2>No guarantees</h2>
      <p>
        We don't guarantee revenue, leads won, or any business outcome from
        using Revenue OS. It's a tool to organize and accelerate your sales
        process, not a promise of results.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Don't use Revenue OS to store or process data you don't have the
        right to hold, to send unsolicited mass outreach in violation of
        applicable law, or to attempt to disrupt or reverse-engineer the
        service.
      </p>

      <h2>Changes and termination</h2>
      <p>
        We may update these terms as the product changes; continued use
        after an update means you accept the new terms. We may suspend an
        account that violates these terms or stops paying for a subscribed
        plan. You can stop using the product and request deletion of your
        data at any time.
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
