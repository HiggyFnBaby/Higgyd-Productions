"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const URGENCY_OPTIONS = ["This week", "This month", "This quarter", "Exploring"];
const REVENUE_OPTIONS = ["Under $5k/mo", "$5k-$20k/mo", "$20k-$100k/mo", "$100k+/mo"];

export function AuditForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    businessType: "",
    painPoint: "",
    monthlyRevenueRange: "",
    urgency: "",
    website: "", // honeypot — see src/app/api/leads/route.ts. Must stay empty.
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong submitting your audit.");
      return;
    }

    router.push("/audit/thank-you");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Honeypot: hidden from real users (CSS + off-screen + not tab-reachable),
          left in the DOM for bots that fill every field they find. A real
          screen-reader user is unaffected — aria-hidden removes it from the
          accessibility tree entirely, so it's not announced or navigable. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Your name"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="rounded border border-slate-300 px-3 py-2"
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          className="rounded border border-slate-300 px-3 py-2"
        />
      </div>
      <input
        type="text"
        placeholder="Company (optional)"
        value={form.company}
        onChange={(e) => update("company", e.target.value)}
        className="rounded border border-slate-300 px-3 py-2"
      />
      <input
        type="text"
        placeholder="What kind of business is it? (optional)"
        value={form.businessType}
        onChange={(e) => update("businessType", e.target.value)}
        className="rounded border border-slate-300 px-3 py-2"
      />
      <textarea
        placeholder="What's the single biggest thing slowing your growth right now?"
        required
        minLength={10}
        rows={4}
        value={form.painPoint}
        onChange={(e) => update("painPoint", e.target.value)}
        className="rounded border border-slate-300 px-3 py-2"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <select
          value={form.monthlyRevenueRange}
          onChange={(e) => update("monthlyRevenueRange", e.target.value)}
          className="rounded border border-slate-300 px-3 py-2"
        >
          <option value="">Monthly revenue (optional)</option>
          {REVENUE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <select
          value={form.urgency}
          onChange={(e) => update("urgency", e.target.value)}
          className="rounded border border-slate-300 px-3 py-2"
        >
          <option value="">How urgent is this? (optional)</option>
          {URGENCY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Get my free audit"}
      </button>
    </form>
  );
}
