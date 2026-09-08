PROJECT NAME
Arthur Digital Works OS

OWNER
Derrick W. Higgins
Higgins Media / Revenue OS AI

MISSION
Build a secure, mobile-first operating system for a one-person white-label
digital-product business. The system must research opportunities, acquire and
qualify leads, sell standardized offers, coordinate specialist AI agents,
produce white-label digital products, perform independent quality control,
deliver completed orders, support customers, and improve its product catalog.

Arthur is the principal AI super agent. Arthur acts as an AI chief operating
officer, product director, sales coordinator, and quality supervisor. Arthur
may create temporary specialist agents for bounded tasks, but every agent must
have a defined role, tools, budget, permissions, inputs, outputs, completion
criteria, and expiration condition.

This repository already hosts a related, earlier project, `revenue-os/`
(a four-agent lead-to-conversation system). Arthur Digital Works OS is a
separate, larger project that lives in its own top-level folder, `arthur-os/`,
alongside it. The two are not merged: `revenue-os` finds and closes deals,
`arthur-os` is the full order-to-delivery product studio. They may share
buyers and lessons but should not share a database or codebase.

NON-NEGOTIABLE GOVERNANCE
1. Derrick W. Higgins is the permanent Root Owner.
2. AI agents are advisory or operational assistants, not legal owners,
   officers, fiduciaries, or unrestricted decision-makers.
3. Never guarantee revenue, rankings, grants, legal outcomes, or business
   success.
4. Never fabricate research, testimonials, sales, customers, statistics,
   citations, product performance, or completed actions.
5. Keep payments, contracts, refunds, mass outreach, public publishing,
   deletion, purchases, credential changes, and unusual custom commitments
   behind configurable approval gates.
6. Production agents cannot approve their own work.
7. Store a timestamped audit record of agent decisions, tool calls, approvals,
   failures, revisions, costs, and delivered artifacts.
8. Use least-privilege permissions and never expose secrets in the interface,
   logs, prompts, repositories, or client deliverables.
9. Respect privacy, email consent, platform rules, intellectual property,
   licensing, accessibility, and applicable consumer-protection requirements.
10. Provide a global emergency stop, revoke-agent control, rollback capability,
    spending caps, rate limits, and connector kill switches.

OPERATING MODES
Admin, Semi-Autonomous, and Autonomous.

Admin Mode:
- Draft and recommend only.
- Require owner approval before external or consequential actions.

Semi-Autonomous Mode:
- Execute approved routine workflows.
- Pause for nonstandard pricing, contracts, refunds, spending, publishing,
  final delivery, sensitive-data use, or low-confidence decisions.

Autonomous Mode:
- Execute only preapproved, reversible, low-risk actions inside documented
  policies, budgets, rate limits, and confidence thresholds.
- Escalate anything outside those boundaries.

v1 note: the vertical slice scaffolded in `arthur-os/app` implements the
mode toggle as a real, persisted, audit-logged setting that is always visible
on the dashboard, but does **not** yet let any mode skip a human click on
payment, delivery, or QA/red-team sign-off — every one of those stays a
manual owner action in every mode, per governance rule 5. Mode-conditional
autonomy for those actions is future work, tracked in
`docs/owner-decisions-needed.md`.

CORE MODULES (full platform — not all built in v1)
1. Arthur Command Center
2. Product Opportunity Radar
3. Lead Magnet and Business Audit Generator
4. Lead Inbox and Qualification CRM
5. Offer, Pricing, Proposal, and Contract Engine
6. Product Catalog and White-Label Template Vault
7. Client Brand Intake Portal
8. Agent Hiring and Task Orchestration Center
9. Pre-Production Research Workspace
10. Production Pipeline
11. Independent QA and Red-Team Review
12. Payment and Order Management
13. Secure Delivery Portal
14. Email and Customer Success Automation
15. FAQ and Knowledge Improvement Engine
16. Analytics, Revenue, Cost, and Profit Dashboard
17. Subscription and License Management
18. Support Ticket and Revision Center
19. Owner Approvals and Exception Queue
20. Security, Privacy, Audit, and Recovery Center

ARTHUR'S ORCHESTRATION RULES
For every project, Arthur must:
- Classify the request, industry, buyer, urgency, risk, and expected value.
- Ask only questions needed to produce an accurate scope.
- Detect missing, contradictory, or risky requirements.
- Write a project specification with measurable acceptance criteria.
- Select reusable templates before authorizing custom development.
- Estimate price, costs, timeline, margin, and required approvals.
- Create the smallest qualified agent team.
- Give each agent a bounded task contract.
- Perform pre-production, mid-production, and post-production checks.
- Reject incomplete or unsupported output.
- Route failed work back for correction with specific findings.
- Require independent QA before final delivery.
- Preserve versions and make rollback possible.
- Record lessons, FAQs, objections, and recurring customer needs.
- Suggest new reusable products only when evidence supports demand.

AGENT TASK CONTRACT
Every delegated task must contain: task ID and parent project, agent role,
objective, approved inputs, allowed tools and data, prohibited actions,
budget and time limit, required output format, source and citation
requirements, acceptance criteria, confidence score, escalation triggers,
QA reviewer, expiration condition. See `.claude/agents/*.md` for each
specialist's standing definition of this contract.

QUALITY GATES
Pre-production: buyer requirements confirmed, brand assets/licenses verified,
research sources recorded, scope/price/timeline/acceptance criteria approved,
privacy and compliance risks classified.

Mid-production: product matches specification, branding is consistent, claims
have evidence, no copied/unlicensed material, mobile/tablet/desktop behavior
checked, accessibility and usability checked, files open correctly, progress
and cost remain within limits.

Post-production: independent functional testing, content and factual review,
link and download testing, security and privacy review, red-team edge-case
test, final file inventory, license and usage instructions, customer
onboarding instructions, delivery confirmation, audit trail completed.

SALES ENGINE
Lead magnet -> qualification -> discovery -> recommended offer -> proposal ->
approval -> checkout -> production -> delivery -> testimonial -> upsell ->
subscription or licensing opportunity.

Arthur may answer questions and recommend suitable approved packages. Arthur
must not pressure buyers, misrepresent scarcity, invent results, or change
approved prices without authorization.

PAYMENT RULES
Support Stripe first, with architecture for additional approved payment
methods. Use verified server-side webhooks, idempotency keys, signed event
validation, order reconciliation, refund controls, tax-ready transaction
exports, and subscription status syncing. Test/sandbox keys only until
Derrick explicitly authorizes production deployment.

EMAIL RULES
After verified payment: notify Derrick (customer, product, amount, fees, net
estimate, order ID, delivery target, risk flags, dashboard link), send the
buyer a receipt/thank-you with next steps, and only create the production
project after payment verification. Never treat an unverified webhook or
email as proof of payment. Use OAuth-based email access when going live; do
not store passwords. Gmail connected to another AI product (e.g. ChatGPT)
does **not** connect it to Claude Code — Arthur needs its own authorized
Gmail API/OAuth configuration or a transactional email provider. Until that
is explicitly configured and approved, all outbound email defaults to a
test-mode provider that logs instead of sending.

MOBILE-FIRST INTERFACE
Bottom navigation, large touch targets, back arrows on nested pages, one-tap
approve/reject/pause/request-changes actions, swipe-friendly project cards,
voice notes and camera/file uploads, copy/paste fields, downloads and secure
share links, offline draft capture with queued sync, persistent sessions,
clear online/offline/sync status, no essential action hidden behind hover.

DATA MODEL
Full-platform target schema (typed models + migrations): users,
organizations, roles, permissions, approval_policies, connectors, leads,
lead_sources, consent_records, customers, products, product_templates,
brand_kits, projects, specifications, tasks, agents, agent_contracts,
research_sources, artifacts, versions, qa_reviews, red_team_reviews, orders,
payments, subscriptions, licenses, deliveries, email_events, notifications,
support_tickets, faqs, knowledge_entries, expenses, analytics_events,
audit_events, incidents, backups, feature_flags. See
`docs/data-schema.md` for how the v1 vertical slice's Prisma schema maps
onto this target model.

SECURITY
Encrypt in transit and at rest, keep secrets in env/secret managers, apply
row-level tenant isolation, use signed expiring download links, scan and
validate uploads, add rate limiting/abuse protection/backups/retention,
redact secrets from logs, add dependency/secret/vulnerability scanning in CI,
require step-up auth for high-risk owner actions.

BUILD METHOD
Modular, API-first architecture. Start with a written implementation plan,
repository structure, threat model, data schema, state diagrams, and
acceptance tests (see `docs/`). Implement one vertical workflow first:

Lead magnet -> qualified lead -> approved offer -> Stripe test payment ->
project creation -> agent task plan -> QA -> secure delivery -> buyer
thank-you email -> owner sale notification.

Use test credentials and sandbox services until Derrick explicitly authorizes
production deployment. Build functioning workflows, tests, validation, error
states, loading states, empty states, audit trails, and setup documentation —
not placeholder screens.

FIRST LAUNCH OFFER
Do not launch promising "every digital product for every business." Launch
with one standardized flagship: **AI Business Growth-in-a-Box** — pain-point
audit, branded lead magnet, landing page, five-email nurture sequence, social
content starter kit, lead intake form, AI FAQ assistant, basic CRM workflow,
analytics dashboard, white-label branding, optional monthly maintenance.
Industry editions come later, once the production framework is proven.

FINAL DELIVERABLES (full platform, not v1)
Working mobile-first application, Arthur orchestration engine, product and
agent template library, secure authentication and permissions, Stripe
sandbox checkout, email template and notification system, QA and approval
workflows, automated tests, environment variable example file without
secrets, deployment and recovery documentation, owner operations handbook,
security checklist, launch checklist.
