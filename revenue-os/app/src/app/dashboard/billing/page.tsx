import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWorkspaceAccess } from "@/lib/access";
import { UpgradeButton } from "@/components/UpgradeButton";

export const dynamic = "force-dynamic";

// This page never redirects away, even when access has expired — it's the
// one place a locked-out workspace can still land to see why and fix it.
export default async function BillingPage({
  searchParams,
}: {
  searchParams: { expired?: string };
}) {
  const session = await getServerSession(authOptions);
  const workspaceId = session!.user.workspaceId;

  const { subscription, active, trialDaysRemaining } = await getWorkspaceAccess(workspaceId);
  const isPaid = subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-xl font-bold">Billing</h1>

      {searchParams.expired && !active && (
        <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Your trial has ended, so the rest of the app is locked until you upgrade.
        </div>
      )}

      {!isPaid && active && (
        <p className="mb-4 text-sm text-slate-600">
          You're on the free trial — <span className="font-semibold">{trialDaysRemaining} day{trialDaysRemaining === 1 ? "" : "s"} left</span>.
          No credit card is needed until you decide to upgrade.
        </p>
      )}

      <p className="mb-1 text-sm text-slate-600">
        Subscription status: <span className="font-semibold">{subscription?.status ?? "NONE"}</span>
      </p>
      {subscription?.currentPeriodEnd && (
        <p className="mb-4 text-sm text-slate-600">
          Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
        </p>
      )}

      {!isPaid && <UpgradeButton />}
    </div>
  );
}
