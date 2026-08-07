import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { ApproveOfferButton } from "@/components/ApproveOfferButton";
import { OFFER_CATALOG } from "@/lib/offers";

export const dynamic = "force-dynamic";

export default async function OfferDetailPage({ params }: { params: { id: string } }) {
  const offer = await prisma.offer.findUnique({
    where: { id: params.id },
    include: { lead: true, order: { include: { project: true } } },
  });
  if (!offer) notFound();

  const catalogEntry = OFFER_CATALOG[offer.package];
  const canApprove = offer.status === "DRAFT" || offer.status === "PENDING_OWNER_APPROVAL";

  return (
    <div className="mx-auto max-w-xl">
      <Link href={`/admin/leads/${offer.leadId}`} className="text-sm text-slate-500 hover:underline">
        ← back to {offer.lead.name}
      </Link>
      <h1 className="mt-2 text-xl font-bold">{catalogEntry.name}</h1>
      <div className="mt-1 flex items-center gap-2">
        <StatusBadge status={offer.status} />
        <span className="text-sm text-slate-600">${(offer.priceCents / 100).toFixed(2)}</span>
      </div>

      <p className="mt-4 text-sm text-slate-600">{catalogEntry.description}</p>

      <div className="mt-6 rounded border border-slate-200 bg-white p-4">
        {canApprove && <ApproveOfferButton offerId={offer.id} />}

        {offer.stripeCheckoutUrl && (
          <div className="mt-3 text-sm">
            <p className="font-semibold">Test-mode checkout link:</p>
            <p className="break-all">
              <a className="underline" href={offer.stripeCheckoutUrl} target="_blank" rel="noreferrer">
                {offer.stripeCheckoutUrl}
              </a>
            </p>
          </div>
        )}

        {offer.order?.project && (
          <div className="mt-4">
            <Link href={`/admin/projects/${offer.order.project.id}`} className="text-sm underline">
              View project →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
