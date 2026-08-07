# Vertical-Slice Implementation Plan

This is the "smallest thing that proves the whole business process works
end to end" slice specified in `CLAUDE.md`'s BUILD METHOD section, and is
the only thing built in `../app` today. Nothing else from CLAUDE.md's 20
core modules is scaffolded yet.

## The slice

```
1. Lead magnet          Public /audit page — Free AI Business Audit form
2. Lead qualification   Auto-scored on submit (Lead Hunter agent contract)
3. Approved offer       Owner reviews lead, creates + approves an Offer
                         for the flagship package (Sales Closer contract)
4. Stripe test checkout Owner-generated Checkout Session, test-mode keys
5. Project creation     Webhook-driven, only after verified payment
6. QA queue             Owner records independent QA + red-team review
7. Secure delivery      Signed, expiring download link
8. Buyer thank-you      Test-mode (or Resend, if configured) email
9. Owner notification   Test-mode (or Resend, if configured) email
```

Every step writes to `AuditEvent`. Every payment- or delivery-adjacent step
requires a manual owner click regardless of Operating Mode (see
`approval-policy-matrix.md`).

## Build order

1. **Data layer** — `prisma/schema.prisma`, matching `data-schema.md`.
2. **Auth** — single seeded Owner, NextAuth credentials (mirrors
   `revenue-os/app/src/lib/auth.ts`, minus the workspace lookup).
3. **Lead intake** — `/audit` public page + `POST /api/leads` +
   `src/lib/qualification.ts` scoring.
4. **Offer + approval** — `/admin/leads/[id]`, `/admin/offers/[id]`,
   `POST /api/offers`, `POST /api/offers/:id/approve` (creates the Stripe
   Checkout Session on approval).
5. **Payment verification** — `POST /api/stripe/webhook`, idempotent on
   `stripeSessionId`, creates `Order` + `Project` only on a verified
   `checkout.session.completed` event.
6. **Production** — `src/lib/production.ts` generates a first-draft
   deliverable `Artifact` from the Lead's audit answers. Calls Claude
   (`src/lib/anthropic.ts`, reading `.claude/agents/production-agent.md` as
   the system prompt, the same pattern `revenue-os/app/src/lib/anthropic.ts`
   uses) when `ANTHROPIC_API_KEY` is configured; otherwise, or if that call
   fails, falls back to a deterministic template so a Claude hiccup never
   blocks project creation after a verified payment.
7. **QA + red-team gates** — `/admin/projects/[id]`,
   `POST /api/projects/:id/qa`, `POST /api/projects/:id/redteam`. Both must
   show a passing review before the deliver action is enabled.
8. **Delivery** — `src/lib/delivery.ts` (HMAC-signed token +
   `Delivery` row), `POST /api/projects/:id/deliver`,
   `GET /api/delivery/[token]`.
9. **Email** — `src/lib/email/*`, test-mode default, buyer thank-you +
   owner sale notification templates, both fired from the deliver route.
10. **Command Center** — `/admin` mode selector + audit log feed +
    stats, tying the whole slice together in one dashboard view.

## Acceptance criteria for "the slice works"

See `acceptance-criteria.md` for the full checklist — summary: a real
person can submit the audit form, the owner can see and qualify the lead,
approve a real (test-mode) Stripe payment, the webhook creates a project,
the owner can run both review gates, delivery produces a working signed
link, and both emails appear in the `EmailEvent` log (or actually arrive, if
Resend is configured) — with a complete `AuditEvent` trail from first
submission to delivery.

## Explicitly not built in this slice

Multi-tenant workspaces, OAuth/Google login, real Gmail OAuth send,
subscriptions/licenses, FAQ/knowledge engine, analytics dashboard, support
tickets, offline draft sync, mobile bottom-nav/PWA chrome, six color themes,
mode-conditional autonomy, rate limiting on the public form, CI security
scanning. Each is tracked either in `owner-decisions-needed.md` (needs a
decision first) or is simply "next slice" (no open decision, just not built
yet).
