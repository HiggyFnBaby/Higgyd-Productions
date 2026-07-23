# Conversation Blueprint: Real Estate Agents (RealEstateOS Enterprise pilot)

**Agent:** conversation-system-builder
**Inputs:** `../offer-briefs/real-estate-agents.md`,
`../content-angles/real-estate-agents.md`

Offer being closed: **"never lose a lead to slow response"** — $129/mo,
month-to-month, no annual contract, 30-day response-time guarantee. Not a
full CRM, not a lead-gen tool.

Two branch structures below, because hot and cold/warm triggers need
different opening moves (per the agent's own rule) — using a hot-triggered
open on someone who hasn't been warmed up reads as pushy; using a cold-style
trust-build on someone already comparing options wastes their time.

---

## Flow A — triggered by a HOT angle (#5 kvCORE, #6 "no bloat")

**Trigger:** Reader replied to or DM'd in response to angle #5 or #6 — they
already know they have the pain and are in comparison mode.

### Opening move (no trust-building needed — they're already warm)

> "Yeah — that's basically the whole gap. [Product] doesn't replace what
> you're already running, it just makes sure nothing sits unanswered. $129/mo,
> no contract. Want the 30-second version of how it works?"

### Branches

- **Interested / "tell me more":**
  Send a 3-line explanation of the mechanism (instant auto-response + a
  follow-up sequence until the lead replies or is marked dead), then ask
  directly: *"Want me to set this up on your next lead so you can see it
  live, no commitment?"* — moves to a live demo/trial ask, not a pitch deck.

- **Price objection ("$129 is a lot" / "already paying enough"):**
  Anchor directly to the offer brief's own math: *"Totally fair to ask. One
  missed lead runs about $427 in lost commission on average — this pays for
  itself if it catches just one of those every few months. And it's
  month-to-month, so there's no year-long bet like [kvCORE-style
  platforms]."* Do not discount the price — reframe against the cost of the
  pain, which is the offer's actual pricing logic.

- **Timing objection ("maybe later" / "slow season right now"):**
  *"Makes sense — mind if I check back in [2–3 weeks]? Slow season is
  actually a good time to set this up before it gets busy again."* Schedule
  a specific follow-up, don't leave it open-ended.

- **"Just looking" / comparing options:**
  *"All good — one thing worth knowing while you compare: this isn't trying
  to be your whole CRM, so it's not an either/or with what you're already
  using. Happy to answer anything as you look around."* Low-pressure, keeps
  the door open without chasing.

- **Ghosting (no reply after opening move):**
  See follow-up cadence below — do not re-pitch, re-approach with new value
  each touch.

### The close

> "Sounds like this solves the exact thing you were describing. Want me to
> get you set up today? It's $129/mo, cancel anytime, and if your response
> time hasn't measurably improved in 30 days I'll refund it — no risk on
> your end."

This is the only message in the whole blueprint that should ever ask
directly for the sale. Every other message moves someone toward this one.

---

## Flow B — triggered by a COLD/WARM angle (#1, #2, #3, #4)

**Trigger:** Reader engaged with a stat-shock, reframe, or self-assessment
hook — they may not have consciously identified this as a solvable, paid
problem yet.

### Opening move (qualify before pitching — trust-building step)

> "Curious — when a lead comes in while you're mid-showing, what actually
> happens? Does it wait for you, or does someone else usually get there
> first?"

This is a genuine qualifying question, not a rhetorical setup — if their
answer shows they don't actually have this pain (e.g. they work
referral-only with no inbound leads), this is the honest exit point; don't
push the offer onto someone the signal report's evidence doesn't apply to.

### Branches

- **Confirms the pain ("yeah, they usually just move on to someone else"):**
  *"That's the exact gap I've been looking at — it's costing agents real
  commission, not because they're bad at follow-up, just because you can't
  be five places at once. There's a simple fix for that specific gap, want
  me to walk you through it?"* — now transitions into Flow A's opening move.

- **Doesn't recognize the pain / unclear:**
  *"Fair enough — if that ever becomes a pain point, happy to share what's
  worked for other agents."* Exit gracefully; log as low-priority nurture,
  not active follow-up (see cadence).

- **Price objection (comes up after transitioning into Flow A):** Use
  Flow A's price objection response.

- **Skeptical ("sounds like every other tool"):**
  *"Fair to be skeptical — most of these are trying to replace your whole
  CRM. This one only does the one thing: answer instantly and follow up
  until someone replies. That's it."* Reinforces the offer's explicit scope
  boundary as the differentiator.

- **Ghosting after the qualifying question:**
  See follow-up cadence below.

### The close

Same close message as Flow A, used once the conversation has moved from
qualifying into the pitch.

---

## Follow-up cadence

- **Touch 1:** Immediate reply to their engagement (same day).
- **Touch 2:** If no reply, follow up once after **3 days** with new value,
  not a repeat ask — e.g. share the $427-per-missed-lead stat if it wasn't
  used yet, or ask the qualifying question a different way.
- **Touch 3:** If still no reply, follow up once after **7 more days**
  (10 days total) with a low-pressure, no-pitch check-in: *"No worries if
  the timing's not right — I'll leave this here in case it's useful later."*
- **After touch 3 with no response:** Move to long-term nurture (occasional
  value content, not active follow-up) rather than continuing to chase —
  matches the offer brief's own buyer profile: these are busy solo agents,
  and repeated unanswered pitches burn the relationship for later.

## Handoff to the CRM/automation tool

This maps directly onto `revenue-os/app/`'s pipeline:

- **Automated already, today:** moving a lead into the `CONVERSATION` stage
  auto-creates a task ("implement the blueprint in your outreach") — that's
  the trigger reminder to start Flow A or B manually.
- **Manual (human-required):** every actual DM/reply in both flows above.
  v1 of the app has no social/DM platform integration, so a person sends
  these messages on whatever platform the conversation is happening on
  (Instagram, Facebook groups, forums) and logs the outcome as a lead note
  or stage change in the CRM — the CRM tracks *state*, it doesn't send the
  messages itself yet.
- **Candidate for future automation** (not built yet, flagging for later):
  touch 2 and touch 3 of the follow-up cadence are formulaic enough
  (fixed wait times, near-fixed message content) that they could become a
  scheduled reminder or auto-send in a later version — touch 1 and all
  objection-branch responses should stay human, since they require reading
  the actual reply.
- **Stage-change discipline:** move the lead to `WON` or `LOST` the moment
  the close message gets a yes/no — not before — so the pipeline reflects
  reality, not optimism.

## Closing the loop

Whatever actually happens when this runs — which objection came up most,
which angle got the most replies, what the real close rate was, any
language a prospect used that wasn't anticipated here — is new signal.
Feed it back into `market-signal-researcher` for the next round, per the
runbook. This blueprint is a starting hypothesis for round one, not a
finished script to run unchanged forever.
