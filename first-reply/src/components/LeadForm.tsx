"use client";

import { useState } from "react";

export function LeadForm({ agentId }: { agentId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, name, email, phone, message }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong — please try again.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Thanks — check your email, you should already have a reply waiting.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        placeholder="Your name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        type="email"
        placeholder="Email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        type="tel"
        placeholder="Phone (optional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="rounded border border-slate-300 px-3 py-2 text-sm"
      />
      <textarea
        placeholder="What are you looking for?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        className="rounded border border-slate-300 px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {submitting ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
