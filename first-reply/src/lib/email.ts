import { Resend } from "resend";

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set — see .env.example.");
  return new Resend(key);
}

// resend.dev requires no domain verification, so this works out of the box
// before you've set up a sending domain. Swap to a verified address
// (FROM_EMAIL env var) before real leads see these — the shared test sender
// is fine for proving the loop, but looks untrustworthy to a stranger.
const FROM = process.env.FROM_EMAIL ?? "FirstReply <onboarding@resend.dev>";

// Every lead-facing email sets reply-to as the agent's own address, so when
// a lead hits "Reply" the conversation lands in the agent's inbox — not at
// the FirstReply sender, where nobody would see it.
export async function sendInstantReply(
  leadEmail: string,
  leadName: string,
  agent: { name: string; email: string },
) {
  await client().emails.send({
    from: FROM,
    to: leadEmail,
    replyTo: agent.email,
    subject: `Thanks for reaching out, ${leadName}!`,
    text: `Hi ${leadName},\n\nThanks for reaching out — this is an instant confirmation that ${agent.name} received your message and will personally follow up with you shortly.\n\nTalk soon,\n${agent.name}`,
  });
}

export async function sendAgentNotification(
  agentEmail: string,
  agentName: string,
  lead: { name: string; email: string; phone: string | null; message: string | null },
  options: { autoReplySent: boolean } = { autoReplySent: true },
) {
  await client().emails.send({
    from: FROM,
    to: agentEmail,
    replyTo: lead.email,
    subject: `New lead: ${lead.name}`,
    text: [
      `Hi ${agentName},`,
      "",
      options.autoReplySent
        ? "A new lead just came in and got an instant auto-reply. Here's what they sent:"
        : "A new lead just came in. No auto-reply was sent because your FirstReply subscription isn't active — here's what they sent so you can reply yourself:",
      "",
      `Name: ${lead.name}`,
      `Email: ${lead.email}`,
      lead.phone ? `Phone: ${lead.phone}` : null,
      lead.message ? `Message: ${lead.message}` : null,
      "",
      "Follow up with them personally as soon as you can — the auto-reply buys you time, it doesn't replace you.",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function sendFollowUpTouch2(
  leadEmail: string,
  leadName: string,
  agent: { name: string; email: string },
) {
  await client().emails.send({
    from: FROM,
    to: leadEmail,
    replyTo: agent.email,
    subject: `Still here to help, ${leadName}`,
    text: `Hi ${leadName},\n\nJust following up in case my last message got buried — ${agent.name} is still happy to help whenever you're ready. No pressure, just wanted to make sure this didn't slip through the cracks.\n\n${agent.name}`,
  });
}

export async function sendFollowUpTouch3(
  leadEmail: string,
  leadName: string,
  agent: { name: string; email: string },
) {
  await client().emails.send({
    from: FROM,
    to: leadEmail,
    replyTo: agent.email,
    subject: `Last check-in from ${agent.name}`,
    text: `Hi ${leadName},\n\nNo worries if the timing isn't right — I'll leave this here in case it's useful later. Feel free to reach back out anytime.\n\n${agent.name}`,
  });
}
