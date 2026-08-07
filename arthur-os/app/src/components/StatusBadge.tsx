const COLORS: Record<string, string> = {
  NEW: "bg-slate-200 text-slate-800",
  QUALIFIED: "bg-blue-100 text-blue-800",
  DISQUALIFIED: "bg-slate-100 text-slate-500",
  OFFER_APPROVED: "bg-amber-100 text-amber-800",
  WON: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
  DRAFT: "bg-slate-200 text-slate-800",
  PENDING_OWNER_APPROVAL: "bg-amber-100 text-amber-800",
  APPROVED: "bg-blue-100 text-blue-800",
  CHECKOUT_CREATED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  DECLINED: "bg-red-100 text-red-800",
  RESEARCH: "bg-slate-200 text-slate-800",
  PRODUCTION: "bg-blue-100 text-blue-800",
  QA_PENDING: "bg-amber-100 text-amber-800",
  QA_FAILED: "bg-red-100 text-red-800",
  QA_PASSED: "bg-green-100 text-green-800",
  RED_TEAM_PENDING: "bg-amber-100 text-amber-800",
  RED_TEAM_FAILED: "bg-red-100 text-red-800",
  RED_TEAM_PASSED: "bg-green-100 text-green-800",
  READY_FOR_DELIVERY: "bg-green-100 text-green-800",
  DELIVERED: "bg-slate-900 text-white",
  PASS: "bg-green-100 text-green-800",
  FAIL: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${COLORS[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
