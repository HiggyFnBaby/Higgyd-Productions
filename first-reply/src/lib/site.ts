// Single source of truth for site-wide facts used by metadata, sitemap, robots
// and structured data. Set NEXT_PUBLIC_SITE_URL in Vercel when a custom domain
// is connected; until then it falls back to the Vercel production address.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://first-reply-steel.vercel.app")
).replace(/\/$/, "");

export const SITE_NAME = "FirstReply";
export const SITE_TAGLINE = "Instant lead follow-up for real estate agents";
export const SITE_DESCRIPTION =
  "FirstReply sends every new real estate lead an instant, automatic email reply and follow-ups at 3 and 10 days, so slow response never costs you a lead. $129/month per agent.";
export const PRICE_USD = "129";

export const FAQ: { q: string; a: string }[] = [
  {
    q: "What is FirstReply?",
    a: "FirstReply is lead follow-up software for real estate agents. Each agent gets a personal lead-capture link. When someone submits the form, FirstReply immediately emails the lead a reply and emails the agent the details, then sends follow-up emails if the lead goes quiet.",
  },
  {
    q: "How fast does a new lead get a reply?",
    a: "Right away. The moment a lead submits the agent's form, the instant reply email is sent automatically, without the agent having to be at a computer or phone.",
  },
  {
    q: "What follow-ups does FirstReply send?",
    a: "After the instant reply, FirstReply sends two automatic follow-up emails, one at 3 days and one at 10 days, so a lead does not go cold while the agent is busy.",
  },
  {
    q: "Who is FirstReply for?",
    a: "Real estate agents who generate leads from a website, a bio link or ads and want every inquiry answered quickly and consistently.",
  },
  {
    q: "How much does FirstReply cost?",
    a: "FirstReply is $129 per month per agent.",
  },
  {
    q: "How does an agent track leads?",
    a: "The agent dashboard lists every lead and lets the agent mark each one as Contacted, Won or Lost.",
  },
  {
    q: "What happens to the information leads submit?",
    a: "It is used to send the replies and follow-ups and to show the lead to the agent who owns the link. See the Privacy Policy for details.",
  },
];
