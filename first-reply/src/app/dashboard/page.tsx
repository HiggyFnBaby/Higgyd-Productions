import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAgentId } from "@/lib/currentAgent";
import { canSendLeadEmails } from "@/lib/billing";
import { LeadList } from "@/components/LeadList";
import { CaptureLinkBox } from "@/components/CaptureLinkBox";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const agentId = await requireAgentId();
  if (!agentId) redirect("/login");

  const [leads, subscription] = await Promise.all([
    prisma.lead.findMany({ where: { agentId }, orderBy: { createdAt: "desc" } }),
    prisma.subscription.findUnique({
      where: { agentId },
      select: { status: true, currentPeriodEnd: true },
    }),
  ]);
  // Shown exactly when sending is actually off — same function the send paths
  // use, so an agent inside the period they paid for is never told their
  // auto-replies are paused while they are in fact still going out.
  const showPaywallNotice = !canSendLeadEmails(
    subscription?.status,
    subscription?.currentPeriodEnd,
  );

  return (
    <div className="flex flex-col gap-6">
      {showPaywallNotice && (
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Auto-replies are paused — your subscription isn&apos;t active.</p>
          <p className="mt-1">
            New leads still show up here and you still get notified, but the instant reply and
            follow-ups to the lead won&apos;t go out until you{" "}
            <Link href="/dashboard/billing" className="underline">
              subscribe
            </Link>
            .
          </p>
        </div>
      )}
      <div>
        <h1 className="mb-1 text-xl font-bold">Your leads</h1>
        <p className="text-sm text-slate-600">
          Every new lead gets an instant reply automatically. Update status here as you follow up.
        </p>
      </div>
      <CaptureLinkBox agentId={agentId} />
      <LeadList initialLeads={leads} />
    </div>
  );
}
