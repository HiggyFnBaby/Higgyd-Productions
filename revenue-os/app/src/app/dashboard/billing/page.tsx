import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpgradeButton } from "@/components/UpgradeButton";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const workspaceId = session!.user.workspaceId;

  const subscription = await prisma.subscription.findUnique({ where: { workspaceId } });

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-xl font-bold">Billing</h1>
      <p className="mb-1 text-sm text-slate-600">
        Status: <span className="font-semibold">{subscription?.status ?? "NONE"}</span>
      </p>
      {subscription?.currentPeriodEnd && (
        <p className="mb-4 text-sm text-slate-600">
          Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
        </p>
      )}
      {subscription?.status !== "ACTIVE" && subscription?.status !== "TRIALING" && <UpgradeButton />}
    </div>
  );
}
