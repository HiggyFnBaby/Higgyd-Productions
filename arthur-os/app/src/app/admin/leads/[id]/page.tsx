import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { CreateOfferForm } from "@/components/CreateOfferForm";
import { OFFER_CATALOG } from "@/lib/offers";
import { OfferPackage } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { offers: { orderBy: { createdAt: "desc" } } },
  });
  if (!lead) notFound();

  const catalogEntry = OFFER_CATALOG[OfferPackage.GROWTH_IN_A_BOX];

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="lg:w-1/2">
        <h1 className="text-xl font-bold">{lead.name}</h1>
        {lead.company && <p className="text-slate-600">{lead.company}</p>}
        <p className="text-sm text-slate-500">{lead.email}</p>
        <div className="mt-2 flex items-center gap-2">
          <StatusBadge status={lead.status} />
          <span className="text-xs text-slate-500">qualification score {lead.qualificationScore}/100</span>
        </div>

        <dl className="mt-6 flex flex-col gap-3 text-sm">
          <div>
            <dt className="font-semibold">Business type</dt>
            <dd>{lead.businessType ?? "Not specified"}</dd>
          </div>
          <div>
            <dt className="font-semibold">Pain point</dt>
            <dd className="whitespace-pre-wrap">{lead.painPoint}</dd>
          </div>
          <div>
            <dt className="font-semibold">Monthly revenue</dt>
            <dd>{lead.monthlyRevenueRange ?? "Not specified"}</dd>
          </div>
          <div>
            <dt className="font-semibold">Urgency</dt>
            <dd>{lead.urgency ?? "Not specified"}</dd>
          </div>
        </dl>
      </div>

      <div className="lg:w-1/2">
        <h2 className="mb-2 text-lg font-semibold">Offers</h2>
        {lead.offers.length === 0 && (
          <p className="mb-4 text-sm text-slate-500">No offers yet for this lead.</p>
        )}
        <ul className="mb-4 flex flex-col gap-2">
          {lead.offers.map((offer) => (
            <li key={offer.id}>
              <Link
                href={`/admin/offers/${offer.id}`}
                className="flex items-center justify-between rounded border border-slate-200 bg-white p-3 hover:bg-slate-50"
              >
                <span>${(offer.priceCents / 100).toFixed(2)} — {catalogEntry.name}</span>
                <StatusBadge status={offer.status} />
              </Link>
            </li>
          ))}
        </ul>

        <div className="rounded border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold">Create a new offer</h3>
          <p className="mb-3 text-xs text-slate-500">
            Sales Closer contract — a draft only. Nothing is sent or charged until you separately approve it.
          </p>
          <CreateOfferForm leadId={lead.id} defaultPriceCents={catalogEntry.defaultPriceCents} />
        </div>
      </div>
    </div>
  );
}
