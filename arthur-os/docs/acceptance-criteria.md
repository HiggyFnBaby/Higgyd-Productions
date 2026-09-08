# Acceptance Criteria — Vertical Slice v1

Testable, checkable criteria for "the first slice works." Each is meant to
be verifiable by actually clicking through the app with test-mode services,
not just by reading code.

## Lead magnet + qualification
- [ ] `/audit` renders without a session (public page).
- [ ] Submitting the form with required fields creates a `Lead` row with
      `rawAnswers` populated and a computed `qualificationScore`.
- [ ] Submitting with a missing required field returns a 400 and no row is
      created.
- [ ] The lead's initial `status` follows the documented scoring thresholds
      in `src/lib/qualification.ts`, and an `AuditEvent` records the
      automatic classification with actor `"Lead Hunter (auto)"`.

## Offer + approval
- [ ] Only an authenticated Owner can view `/admin/leads/[id]` or create an
      Offer — an unauthenticated request to the underlying API 401s.
- [ ] Creating an Offer defaults to the flagship package's price but lets
      the owner override the amount before approval.
- [ ] Approving an Offer requires an explicit action distinct from creating
      it, writes an `AuditEvent`, and returns a real Stripe test-mode
      Checkout URL.
- [ ] The Checkout URL, opened in Stripe test mode with a Stripe test card,
      completes a real (test) payment.

## Payment verification
- [ ] `POST /api/stripe/webhook` rejects a request with an invalid/missing
      `stripe-signature` header (400, no state change).
- [ ] A valid `checkout.session.completed` event creates exactly one
      `Order` (status `PAID`) and exactly one `Project` (status
      `RESEARCH` → auto-advanced to `PRODUCTION`).
- [ ] Replaying the same webhook event a second time does not create a
      second `Order` or `Project` (idempotent on `stripeSessionId`).
- [ ] An `AuditEvent` records the payment verification with actor
      `"Stripe webhook"`.

## Production + QA + red-team
- [ ] `src/lib/production.ts` produces a non-empty `Artifact` referencing
      the lead's actual audit answers (not a static/generic placeholder
      unrelated to the input).
- [ ] "Mark production complete" and "Record QA review" are separate
      actions in the UI and separate API calls — a single click cannot do
      both.
- [ ] A `QAReview` with `result = FAIL` keeps the Project's delivery action
      disabled and routes its status back toward `PRODUCTION`.
- [ ] The deliver action is disabled in the UI (and the API rejects it,
      not just hides the button) unless both a passing `QAReview` and a
      passing `RedTeamReview` exist for that Project.

## Delivery
- [ ] Delivering generates a `Delivery` row with a signed `downloadToken`
      and a future `expiresAt`.
- [ ] `GET /api/delivery/[token]` succeeds for a valid, unexpired token and
      returns the artifact content.
- [ ] The same endpoint rejects a tampered token (signature mismatch) and a
      token past its `expiresAt`, both with a non-200 response and no
      artifact content in the body.

## Email
- [ ] Delivering a project creates exactly two `EmailEvent` rows: one
      `BUYER_THANK_YOU`, one `OWNER_SALE_NOTIFICATION`.
- [ ] With no `EMAIL_PROVIDER` set (default), both rows have
      `status = SENT_TEST` and no external HTTP call is made.
- [ ] With `EMAIL_PROVIDER=resend` and a valid `RESEND_API_KEY`, both emails
      are actually sent and rows show `status = SENT` (or `FAILED` with a
      captured error if the send fails — never silently dropped).

## Command Center
- [ ] `/admin` shows the current Operating Mode at all times, matches what's
      in the `Settings` row, and changing it writes an `AuditEvent`.
- [ ] `/admin` shows a reverse-chronological feed of `AuditEvent` rows
      covering everything above, timestamped.

## Build/deploy hygiene
- [ ] `npm run typecheck` passes with zero errors.
- [ ] `npm run build` completes successfully with only placeholder/test env
      values present (no real secrets required to build).
- [ ] `.env.example` contains no real secret values.
