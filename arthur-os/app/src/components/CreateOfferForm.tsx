"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateOfferForm({ leadId, defaultPriceCents }: { leadId: string; defaultPriceCents: number }) {
  const router = useRouter();
  const [price, setPrice] = useState((defaultPriceCents / 100).toFixed(2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, priceCents: Math.round(parseFloat(price) * 100) }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not create offer.");
      return;
    }

    const offer = await res.json();
    router.push(`/admin/offers/${offer.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div>
        <label className="block text-xs text-slate-500">Price (USD)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-32 rounded border border-slate-300 px-2 py-1"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create draft offer"}
      </button>
      <p className="w-full text-xs text-slate-400">
        Leaving the price at the catalog default may auto-approve immediately (checkout link generated with no
        further click) in Semi-Autonomous/Autonomous mode — see the offer page after creating it. Any other price
        always requires a manual approval, in every mode.
      </p>
    </form>
  );
}
