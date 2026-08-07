import type { Lead, Offer, Order } from "@prisma/client";
import { OFFER_CATALOG } from "@/lib/offers";

export function buyerThankYouEmail(lead: Lead, offer: Offer, downloadUrl: string, expiresAt: Date) {
  const catalogEntry = OFFER_CATALOG[offer.package];
  const subject = `Your ${catalogEntry.name} is ready`;
  const html = `
    <p>Hi ${escapeHtml(lead.name)},</p>
    <p>Thank you for your order. Your <strong>${escapeHtml(catalogEntry.name)}</strong> package has
    passed independent quality review and is ready to download:</p>
    <p><a href="${downloadUrl}">${downloadUrl}</a></p>
    <p>This link expires ${expiresAt.toUTCString()}. If it expires before you've downloaded
    everything, just reply to this email and we'll issue a new one.</p>
    <p>Questions? Reply directly to this email.</p>
  `.trim();
  return { subject, html };
}

export function ownerSaleNotificationEmail(lead: Lead, offer: Offer, order: Order) {
  const catalogEntry = OFFER_CATALOG[offer.package];
  const amount = (order.amountCents / 100).toFixed(2);
  const subject = `New sale: ${catalogEntry.name} — $${amount} (${lead.name})`;
  const html = `
    <p>New order delivered.</p>
    <ul>
      <li><strong>Customer:</strong> ${escapeHtml(lead.name)} (${escapeHtml(lead.email)})${
        lead.company ? ` — ${escapeHtml(lead.company)}` : ""
      }</li>
      <li><strong>Product:</strong> ${escapeHtml(catalogEntry.name)}</li>
      <li><strong>Amount:</strong> $${amount} ${order.currency.toUpperCase()}</li>
      <li><strong>Order ID:</strong> ${order.id}</li>
      <li><strong>Stripe session:</strong> ${order.stripeSessionId}</li>
      <li><strong>Paid at:</strong> ${order.paidAt?.toUTCString() ?? "unknown"}</li>
    </ul>
    <p>See the full audit trail in the Command Center.</p>
  `.trim();
  return { subject, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
