"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LEAD_ENDPOINT,
  DEMO_LEAD_TYPE,
  DEMO_UNLOCK_KEY,
  DEMO_VIDEO_SRC,
  DEMO_POSTER_SRC,
} from "@/lib/leadMagnet";

type Status = "locked" | "sending" | "unlocked";

// Name + email form that unlocks the demo video. The lead is saved first; the
// video only appears once the save succeeds, so a failed save never loses a lead.
export function DemoGate() {
  const [status, setStatus] = useState<Status>("locked");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot: real people leave this empty
  const [error, setError] = useState<string | null>(null);

  // Returning visitors who already signed up on this device skip the form.
  useEffect(() => {
    try {
      if (localStorage.getItem(DEMO_UNLOCK_KEY) === "1") setStatus("unlocked");
    } catch {
      /* storage blocked: show the form */
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: DEMO_LEAD_TYPE,
          name,
          email,
          company,
          plan: "FirstReply",
          goals: "Requested the FirstReply demo video",
          origin: "first-reply-demo-page",
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      try {
        localStorage.setItem(DEMO_UNLOCK_KEY, "1");
      } catch {
        /* ignore */
      }
      setStatus("unlocked");
    } catch {
      setStatus("locked");
      setError("We couldn't save that just now. Please check your email address and try again.");
    }
  }

  if (status === "unlocked") {
    return (
      <div className="flex w-full flex-col gap-3">
        <div className="overflow-hidden rounded-2xl border border-amber-400/40 bg-black shadow-[0_0_40px_rgba(212,175,55,0.15)]">
          <video
            controls
            playsInline
            preload="metadata"
            poster={DEMO_POSTER_SRC}
            className="aspect-video w-full"
          >
            <source src={DEMO_VIDEO_SRC} type="video/mp4" />
            Your browser can&apos;t play this video.
          </video>
        </div>
        <p className="text-xs text-slate-300">
          This preview was made with AI. The screens, charts and numbers in it are illustrative, not
          real product screens.
        </p>
        <Link
          href="/signup"
          className="self-start rounded bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 px-5 py-2 text-sm font-semibold text-black shadow-lg shadow-amber-500/20"
        >
          Create your account — $129/month per agent
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 rounded-2xl border border-amber-400/30 bg-white p-6 text-left shadow-2xl">
      <h2 className="text-lg font-bold text-slate-900">Watch the FirstReply preview</h2>
      <p className="text-sm text-slate-600">Enter your name and email and the video plays right here.</p>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-800">
        Name
        <input
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 font-normal"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-800">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 font-normal"
        />
      </label>
      {/* Honeypot field, hidden from people */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input type="text" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
        </label>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {status === "sending" ? "Saving..." : "Watch the video"}
      </button>
      <p className="text-xs text-slate-500">
        We&apos;ll use your email to follow up about FirstReply. See our{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
