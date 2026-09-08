import { OfferPackage } from "@prisma/client";

// v1 sells exactly one flagship package on purpose — see "First launch
// offer" in ../../CLAUDE.md. Default price is a placeholder within the
// $497-$2,500 Business-in-a-Box range from the business brief; the owner can
// override it per-offer at approval time. See
// ../../docs/owner-decisions-needed.md #1.
export const OFFER_CATALOG: Record<
  OfferPackage,
  { name: string; description: string; defaultPriceCents: number; deliverables: string[] }
> = {
  GROWTH_IN_A_BOX: {
    name: "AI Business Growth-in-a-Box",
    description:
      "A branded pain-point audit, landing page, five-email nurture sequence, " +
      "social content starter kit, lead intake form, and analytics dashboard — " +
      "built from a reusable template and customized to your brand and audience.",
    defaultPriceCents: 149_700, // $1,497.00
    deliverables: [
      "Business pain-point audit report",
      "Branded lead magnet",
      "Landing page",
      "Five-email nurture sequence",
      "Social content starter kit",
      "Lead intake form",
      "Analytics dashboard summary",
    ],
  },
};
