"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// The one action in the app that both approves an Offer and generates a
// real (test-mode) Stripe Checkout link — always a manual owner click, in
// every Operating Mode. See ../../../docs/approval-policy-matrix.md.
export function ApproveOfferButton({ offerId }: { offerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/offers/${offerId}/approve`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not approve offer.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleApprove}
        disabled={loading}
        className="w-fit rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {loading ? "Approving..." : "Approve offer & generate test-mode checkout link"}
      </button>
    </div>
  );
}
