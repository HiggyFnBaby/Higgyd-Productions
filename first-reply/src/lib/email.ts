import { Resend } from "resend";

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set — see .env.example.");
  return new Resend(key);
}

// resend.dev requires no domain verification, so this works out of the box
// before an agent has set up their own sending domain. Swap to a verified
// address (FROM_EMAIL env var) once one exists.
const FROM = process.env.FROM_EMAIL ?? "FirstReply <onboarding@resend.dev>";

export async function sendInstantReply(leadEmail: string, leadName: string, agentName: string) {
  await client().emails.send({
    from: FROM,
    to: leadEmail,
    subject: `Thanks for reaching out, ${leadName}!`,
    text: `Hi ${leadName},\n\nThanks for reaching out — this is an instant confirmation that ${agentName} received your message and will personally follow up with you shortly.\n\nTalk soon,\n${agentName}`,
  });
}

export async function sendAgentNotification(
  agentEmail: string,
  agentName: string,
  lead: { name: string; email: string; phone: string | null; message: string | null },
) {
  await client().emails.send({
    from: FROM,
    to: agentEmail,
    subject: `New lead: ${lead.name}`,
    text: [
      `Hi ${agentName},`,
      "",
      "A new lead just came in and got an instant auto-reply. Here's what they sent:",
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

export async function sendFollowUpTouch2(leadEmail: string, leadName: string, agentName: string) {
  await client().emails.send({
    from: FROM,
    to: leadEmail,
    subject: `Still here to help, ${leadName}`,
    text: `Hi ${leadName},\n\nJust following up in case my last message got buried — ${agentName} is still happy to help whenever you're ready. No pressure, just wanted to make sure this didn't slip through the cracks.\n\n${agentName}`,
  });
}

export async function sendFollowUpTouch3(leadEmail: string, leadName: string, agentName: string) {
  await client().emails.send({
    from: FROM,
    to: leadEmail,
    subject: `Last check-in from ${agentName}`,
    text: `Hi ${leadName},\n\nNo worries if the timing isn't right — I'll leave this here in case it's useful later. Feel free to reach back out anytime.\n\n${agentName}`,
  });
}
