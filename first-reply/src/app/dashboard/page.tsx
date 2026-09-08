import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeadList } from "@/components/LeadList";
import { CaptureLinkBox } from "@/components/CaptureLinkBox";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const agentId = session!.user.id;

  const leads = await prisma.lead.findMany({
    where: { agentId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
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
