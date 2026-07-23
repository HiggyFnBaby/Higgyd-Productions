import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { TRIAL_DAYS } from "@/lib/access";

const PRICE_LABEL = process.env.NEXT_PUBLIC_PRICE_LABEL ?? "$49/month";

const CHAIN_STEPS = [
  {
    stage: "Signal",
    agent: "Market Signal Researcher",
    description: "Finds evidence a problem is real and already being paid to solve elsewhere.",
  },
  {
    stage: "Offer",
    agent: "Offer Architect",
    description: "Turns that evidence into one specific, priced, sellable offer.",
  },
  {
    stage: "Angle",
    agent: "Content Angle Strategist",
    description: "Turns the offer into hooks the exact buyer stops scrolling for.",
  },
  {
    stage: "Conversation",
    agent: "Conversation System Builder",
    description: "Designs the DM/CRM flow that actually closes — the only step implemented as automation.",
  },
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-16 px-6 py-16">
      <section className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold">Revenue OS</h1>
        <p className="max-w-xl text-lg text-slate-600">
          Money is not a tool. Money is in systems. Revenue OS is the CRM
          where every lead moves through the exact chain that turns a proven
          problem into a paying customer — Signal &rarr; Offer &rarr; Angle
          &rarr; Conversation &rarr; Won.
        </p>
        <div className="flex gap-4">
          <Link href="/signup" className="rounded bg-slate-900 px-5 py-3 text-white">
            Start your {TRIAL_DAYS}-day free trial
          </Link>
          <Link href="/login" className="rounded border border-slate-900 px-5 py-3">
            Log in
          </Link>
        </div>
        <p className="text-sm text-slate-500">No credit card required to start.</p>
      </section>

      <section>
        <h2 className="mb-6 text-center text-xl font-bold">How it works</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {CHAIN_STEPS.map((step, i) => (
            <div key={step.stage} className="rounded border border-slate-200 bg-white p-4">
              <div className="mb-1 text-xs font-semibold text-slate-400">STEP {i + 1}</div>
              <div className="mb-1 font-semibold">{step.stage}</div>
              <div className="mb-2 text-xs text-slate-500">{step.agent}</div>
              <p className="text-sm text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          The CRM is only the last step, made buildable — everything upstream
          proves the pain and prices the fix before a single automation gets
          built.
        </p>
      </section>

      <section className="flex flex-col items-center gap-4 rounded border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-xl font-bold">Pricing</h2>
        <p className="text-3xl font-bold">{PRICE_LABEL}</p>
        <ul className="text-sm text-slate-600">
          <li>Unlimited leads through the full pipeline</li>
          <li>AI agent runs powered by Claude on every stage</li>
          <li>Automatic next-action tasks on every stage change</li>
        </ul>
        <Link href="/signup" className="rounded bg-slate-900 px-5 py-3 text-white">
          Start your {TRIAL_DAYS}-day free trial
        </Link>
      </section>
    </main>
  );
}
