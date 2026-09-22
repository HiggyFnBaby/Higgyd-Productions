# FirstReply (v1)

This is the actual running application for the FirstReply offer described in
`../revenue-os/offer-briefs/real-estate-agents.md` (the promise, price, and
buyer), `../revenue-os/content-angles/real-estate-agents.md` (how to reach
people), and `../revenue-os/conversation-blueprints/real-estate-agents.md`
(how to close them). Read those first if you haven't — this file is just
"how to run it."

## What this is, in plain terms

A real estate agent signs up, gets a unique link, and shares it anywhere
(their website, a bio link, an ad). Anyone who fills out that link's form
becomes a "lead" — and the moment they submit, two emails go out
automatically: one to the lead ("thanks, I'll be in touch"), one to the
agent ("you have a new lead, here's what they said"). If the lead never
replies, the app automatically sends two more follow-up emails (at 3 days
and 10 days) so nothing quietly goes cold. The agent's dashboard shows every
lead and lets them mark it Contacted / Won / Lost as they work it.

That's the entire product: **never lose a lead to slow response.**

## Before you can run it, you need two things (three to charge money)

1. **A Postgres database.** Same options as `revenue-os/app`: Supabase or
   Neon are the easiest free choices. Use the *connection pooler* string,
   not the direct one.
2. **A Resend account** (for sending email — this is what makes the whole
   product work). Sign up free at [resend.com](https://resend.com), grab an
   API key from **API Keys** in the dashboard. No domain verification is
   required to start — it'll send from a shared Resend test address until
   you verify your own domain.
3. **A Stripe account** (only needed to charge agents; skip it to just run
   the app). Test mode is fine while building. Create one recurring Price
   for $129/month and put its secret key + price ID + webhook secret into
   the matching `.env` values. Until this is set up, the "Subscribe" button
   on the billing page shows an error instead of a checkout page —
   everything else still works.

## Running it locally

```bash
cp .env.example .env
# fill in DATABASE_URL, NEXTAUTH_SECRET, and RESEND_API_KEY at minimum

npm install
npm run db:push      # creates the tables in your database
npm run dev           # starts the app at http://localhost:3000
```

Then visit `http://localhost:3000`, click "Create account," and you're in.
Your dashboard will show a unique link like `/l/<your-id>` — that's the one
to share.

## What's real vs. what's a v1 shortcut

- **Real:** the whole loop — lead capture, instant auto-reply, agent
  notification, the 3-day/10-day follow-up cadence (via a scheduled job),
  a dashboard to track lead status, and billing (Stripe checkout + webhook,
  $129/month per agent, behind the same provider-agnostic interface as
  `revenue-os/app`).
- **Built for real leads, not just demos:**
  - A lead is saved to the database *before* any email is attempted, and an
    email failure is logged instead of crashing the request — so a Resend
    outage can never make a lead disappear. The agent still gets notified.
  - Every email to a lead sets "reply-to" as the agent's own address, so
    when the lead hits Reply it lands in the agent's inbox, not ours.
  - The lead form has a hidden "honeypot" field: bots fill it in, people
    can't see it, and submissions with it filled are silently dropped.
  - One bad send in the daily follow-up job doesn't stop the rest of the
    batch.
- **v1 shortcuts:**
  - Email only for now, not text/SMS — the offer brief's research shows
    agents expect texts, but SMS requires a business-verification process
    with the texting provider that takes days; email proves the same loop
    today. Swapping in SMS later is a contained change (one file:
    `src/lib/email.ts`'s equivalent for SMS), not a rebuild.
  - Only Stripe is wired up; Paddle/LemonSqueezy would need a new file in
    `src/lib/billing/` implementing the same interface (see that folder's
    `types.ts`).
  - One agent = one login, no team accounts (matches the offer brief's
    buyer: solo agents, not brokerages). No "forgot password" flow yet.
  - The follow-up emails have no unsubscribe link. They're replies to a
    lead's own inquiry (transactional, not marketing), but adding a "reply
    STOP" line is worth doing before high volume.

## What "paid" actually gates

Set `BILLING_REQUIRED="true"` and an agent who hasn't subscribed gets a
deliberately gentle paywall: every lead is still saved, they still get the
"new lead" email (with a note that no auto-reply went out), and their
dashboard shows a banner — but the instant reply and the 3-day/10-day
follow-ups to the *lead* don't go out until they pay. The lead-capture link
never breaks. This keeps the product's promise ("never lose a lead") even
for someone who's lapsed, while making the thing they're paying for (the
automatic replies) actually depend on paying.

With `BILLING_REQUIRED` unset or `"false"` (the default), nothing is gated —
that's the right setting for local dev and for proving the loop with test
accounts.

## Launch checklist (test mode — nothing here charges real money)

Do these in order. Every step is a form on a website, not code.

1. **Deploy to Vercel.** New project from `HiggyFnBaby/Higgyd-Productions`,
   set **Root Directory** to `first-reply`. (Unlike `revenue-os/app`, this
   app reads nothing outside its own folder, so the "include source files
   outside root" toggle is not needed.) Set the Build Command to
   `npx prisma db push && npm run build` so schema changes reach the real
   database on every deploy. Add every variable from `.env.example` in
   Project Settings > Environment Variables — `NEXTAUTH_URL` is your
   Vercel URL. `vercel.json` already schedules the daily follow-up job;
   Vercel sends `CRON_SECRET` automatically once it's set as an env var.
2. **Verify a sending domain in Resend** (Domains > Add domain, then add the
   DNS records it gives you at your domain registrar). Then set
   `FROM_EMAIL` to something like `FirstReply <hello@yourdomain.com>` and
   redeploy. Until this is done, emails come from a shared `resend.dev`
   test address, which real leads will not trust.
3. **Stripe, test mode.** Create the product + $129/month recurring Price;
   copy the Price ID. Add a webhook endpoint pointing at
   `https://<your-vercel-url>/api/billing/webhook` with the three
   `customer.subscription.*` events; copy its signing secret. Put the test
   secret key, Price ID, and webhook secret into Vercel env vars; redeploy.
4. **Prove the whole loop on the live URL.** Create an agent account, open
   the capture link, submit a lead using a second email address you own,
   and confirm (a) the lead's inbox got the instant reply, (b) hitting
   Reply on it addresses the agent, (c) the agent's inbox got the
   notification, (d) the lead shows in the dashboard. Then go to Billing,
   click Subscribe, pay with Stripe's test card `4242 4242 4242 4242`, and
   confirm the billing page flips to **Active**.
5. **Flip the gate.** Set `BILLING_REQUIRED="true"`, redeploy, and with a
   fresh (unpaid) test agent confirm the lead is saved + the agent notified
   but no auto-reply goes to the lead, and the dashboard banner appears.

Going live (a real Stripe key, real charges) is a separate, explicit
decision — nothing in this checklist does it.

## Where things live

- `prisma/schema.prisma` — the data model (Agent, Lead, Subscription).
- `src/lib/billing/` — the provider-agnostic billing interface + Stripe
  implementation, plus the one `isSubscribed` / `canSendLeadEmails` rule
  the rest of the app uses.
- `src/app/api/billing/` — checkout (starts a Stripe session) and webhook
  (Stripe tells us the subscription changed; idempotent per agent).
- `src/app/dashboard/billing/` — the agent's billing page.
- `src/lib/email.ts` — every email the product sends (instant reply, agent
  notification, both follow-ups) — this file *is* the product's core value.
- `src/app/api/leads/route.ts` — the public endpoint a lead's submission
  hits; triggers the instant reply.
- `src/app/api/cron/follow-ups/route.ts` — the scheduled job (see
  `vercel.json`) that sends the 3-day/10-day follow-ups.
- `src/app/l/[agentId]/` — the public lead-capture page agents share.
- `src/app/dashboard/` — the agent-facing UI.
