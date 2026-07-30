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

## Before you can run it, you need two things

1. **A Postgres database.** Same options as `revenue-os/app`: Supabase or
   Neon are the easiest free choices. Use the *connection pooler* string,
   not the direct one.
2. **A Resend account** (for sending email — this is what makes the whole
   product work). Sign up free at [resend.com](https://resend.com), grab an
   API key from **API Keys** in the dashboard. No domain verification is
   required to start — it'll send from a shared Resend test address until
   you verify your own domain.

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
  and a dashboard to track lead status.
- **v1 shortcuts:**
  - Email only for now, not text/SMS — the offer brief's research shows
    agents expect texts, but SMS requires a business-verification process
    with the texting provider that takes days; email proves the same loop
    today. Swapping in SMS later is a contained change (one file:
    `src/lib/email.ts`'s equivalent for SMS), not a rebuild.
  - No billing yet — this app doesn't charge agents itself. If/when this is
    sold as a real product, billing would be added the same way it was for
    `revenue-os/app` (a `BillingProvider` interface + Stripe).
  - One agent = one login, no team accounts (matches the offer brief's
    buyer: solo agents, not brokerages).

## Where things live

- `prisma/schema.prisma` — the data model (Agent, Lead).
- `src/lib/email.ts` — every email the product sends (instant reply, agent
  notification, both follow-ups) — this file *is* the product's core value.
- `src/app/api/leads/route.ts` — the public endpoint a lead's submission
  hits; triggers the instant reply.
- `src/app/api/cron/follow-ups/route.ts` — the scheduled job (see
  `vercel.json`) that sends the 3-day/10-day follow-ups.
- `src/app/l/[agentId]/` — the public lead-capture page agents share.
- `src/app/dashboard/` — the agent-facing UI.
