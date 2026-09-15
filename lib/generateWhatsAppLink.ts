import type { Property } from "@/types/database";
import type { LeadQualificationInput } from "@/lib/schemas";
import {
  PURPOSE_LABELS,
  TIMELINE_LABELS,
  BUDGET_LABELS,
  PAYMENT_LABELS,
} from "@/lib/schemas";

export interface WhatsAppLinkParams {
  property: Pick<Property, "id" | "title" | "agent_name" | "agent_whatsapp">;
  lead: LeadQualificationInput;
}

/**
 * Strips a phone number down to digits only and ensures it's in the
 * international format wa.me expects (country code, no leading +, no
 * spaces/dashes). Nigerian numbers stored as "080..." get normalized to
 * "234..." on the assumption the local leading 0 maps to +234.
 */
function normalizeWhatsAppNumber(rawNumber: string): string {
  const digitsOnly = rawNumber.replace(/\D/g, "");

  if (digitsOnly.startsWith("234")) {
    return digitsOnly;
  }
  if (digitsOnly.startsWith("0")) {
    return `234${digitsOnly.slice(1)}`;
  }
  return digitsOnly;
}

/**
 * Builds the human-readable WhatsApp message body from the property and the
 * lead's qualification answers. Kept as its own function (not inlined into
 * generateWhatsAppLink) so the message text is independently testable
 * without needing to check URL-encoding at the same time.
 */
export function buildWhatsAppMessage({
  property,
  lead,
}: WhatsAppLinkParams): string {
  const lines = [
    `Hello ${property.agent_name}, I'm interested in *${property.title}* (Ref: ${property.id.slice(0, 8)}).`,
    ``,
    `👤 Name: ${lead.fullName}`,
    `🎯 Purpose: ${PURPOSE_LABELS[lead.purpose]}`,
    `⏱ Timeline: ${TIMELINE_LABELS[lead.timeline]}`,
    `💰 Budget: ${BUDGET_LABELS[lead.budgetRange]}`,
    `💳 Payment: ${PAYMENT_LABELS[lead.paymentStructure]}`,
    `📱 Phone: ${lead.phone}`,
    ``,
    `Please contact me regarding a viewing.`,
  ];

  return lines.join("\n");
}

/**
 * Generates the final https://wa.me/... deep link with the message
 * URI-encoded. Pure function — no side effects, no window/redirect logic —
 * so it can be unit tested and reused server-side (e.g. for an audit log of
 * exactly what was sent) as well as client-side.
 */
export function generateWhatsAppLink(params: WhatsAppLinkParams): {
  url: string;
  message: string;
} {
  const message = buildWhatsAppMessage(params);
  const agentNumber = normalizeWhatsAppNumber(params.property.agent_whatsapp);
  const encodedMessage = encodeURIComponent(message);

  return {
    url: `https://wa.me/${agentNumber}?text=${encodedMessage}`,
    message,
  };
}
