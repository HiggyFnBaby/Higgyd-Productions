import Link from "next/link";
import { FAQ } from "@/lib/site";

const STEPS = [
  {
    title: "Share your link",
    body: "Sign up and get a personal lead-capture link. Put it on your website, bio link or ads.",
  },
  {
    title: "Every lead gets an instant reply",
    body: "The moment someone submits the form, they get an automatic email reply and you get their details.",
  },
  {
    title: "Follow-ups run themselves",
    body: "If the lead goes quiet, FirstReply emails again at 3 days and 10 days so they never go cold.",
  },
  {
    title: "Track every lead",
    body: "Your dashboard lists each lead. Mark them Contacted, Won or Lost as you work them.",
  },
];

// Crawlable, plain-language sections for the home page: how it works, pricing and FAQ.
// The FAQ text is also published as FAQPage structured data (see page.tsx).
export function HomeContent() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-10 text-left">
      <section aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="text-xl font-semibold text-amber-200">
          How FirstReply works
        </h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-amber-400/30 bg-black/60 p-4 backdrop-blur">
              <p className="text-xs font-semibold text-amber-300">Step {i + 1}</p>
              <h3 className="mt-1 font-semibold text-white">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-300">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="pricing" className="rounded-xl border border-amber-400/30 bg-black/60 p-5 backdrop-blur">
        <h2 id="pricing" className="text-xl font-semibold text-amber-200">
          Simple pricing for real estate agents
        </h2>
        <p className="mt-2 text-slate-200">
          <span className="text-3xl font-bold text-white">$129</span>
          <span className="text-slate-300"> per month, per agent.</span>
        </p>
        <Link href="/signup" className="mt-3 inline-block text-sm font-medium text-amber-300 underline">
          Create your account
        </Link>
      </section>

      <section aria-labelledby="faq">
        <h2 id="faq" className="text-xl font-semibold text-amber-200">
          Frequently asked questions
        </h2>
        <dl className="mt-4 flex flex-col gap-3">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-xl border border-amber-400/20 bg-black/60 p-4 backdrop-blur">
              <dt className="font-semibold text-white">{f.q}</dt>
              <dd className="mt-1 text-sm text-slate-300">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
