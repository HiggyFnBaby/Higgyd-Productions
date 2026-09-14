import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAgentId } from "@/lib/currentAgent";
import { isSubscribed } from "@/lib/billing";
import { UpgradeButton } from "@/components/UpgradeButton";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  NONE: "Not subscribed",
  TRIALING: "Free trial",
  ACTIVE: "Active",
  PAST_DUE: "Payment past due",
  CANCELED: "Canceled",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { checkout?: string };
}) {
  const agentId = await requireAgentId();
  if (!agentId) redirect("/login");

  const subscription = await prisma.subscription.findUnique({ where: { agentId } });
  const status = subscription?.status ?? "NONE";
  const subscribed = isSubscribed(status);

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h1 className="text-xl font-bold">Billing</h1>

      {searchParams.checkout === "success" && (
        <p className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Payment received — thank you. If the status below still says &ldquo;Not subscribed,&rdquo;
          give it a few seconds and refresh; Stripe confirms the subscription to us right after checkout.
        </p>
      )}
      {searchParams.checkout === "cancelled" && (
        <p className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          Checkout cancelled — nothing was charged.
        </p>
      )}

      <div className="rounded border border-slate-200 bg-white p-4 text-sm">
        <p className="text-slate-600">
          Plan: <span className="font-semibold text-slate-900">FirstReply — $129/month per agent</span>
        </p>
        <p className="mt-1 text-slate-600">
          Status:{" "}
          <span className={`font-semibold ${subscribed ? "text-green-700" : "text-slate-900"}`}>
            {STATUS_LABEL[status] ?? status}
          </span>
        </p>
        {subscription?.currentPeriodEnd && (
          <p className="mt-1 text-slate-600">
            {status === "CANCELED" ? "Access ends" : "Renews"}:{" "}
            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        )}
      </div>

      {!subscribed && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-600">
            Month to month, cancel anytime. Your lead-capture link keeps working either way — a
            subscription is what keeps the instant replies and follow-ups going out.
          </p>
          <UpgradeButton />
        </div>
      )}
    </div>
  );
}
