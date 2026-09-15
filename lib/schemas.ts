import { z } from "zod";

// ============================================================================
// Single source of truth for the lead qualification form.
// React Hook Form, the Supabase insert payload, and the WhatsApp message
// builder all derive their types from these schemas — change a field here
// and every consumer picks it up via TypeScript, instead of drifting apart.
// ============================================================================

export const leadPurposeEnum = z.enum(["personal", "investment", "shortlet"]);

export const leadTimelineEnum = z.enum(["immediate", "1_3_months", "exploring"]);

export const leadBudgetRangeEnum = z.enum([
  "under_30m",
  "30m_50m",
  "50m_100m",
  "100m_plus",
]);

export const leadPaymentStructureEnum = z.enum([
  "outright",
  "installment",
  "mortgage",
]);

// A conservative Nigerian phone check: accepts +234XXXXXXXXXX or 0XXXXXXXXXX
// (11 digits local format). Deliberately not overly strict — the WhatsApp
// step is what actually matters, and rejecting valid numbers costs a lead.
const nigerianPhoneRegex = /^(\+234[789][01]\d{8}|0[789][01]\d{8})$/;

// --- Step 1: Intent / Purpose --------------------------------------------
export const stepPurposeSchema = z.object({
  purpose: leadPurposeEnum,
});

// --- Step 2: Timeline ------------------------------------------------------
export const stepTimelineSchema = z.object({
  timeline: leadTimelineEnum,
});

// --- Step 3: Budget ----------------------------------------------------
export const stepBudgetSchema = z.object({
  budgetRange: leadBudgetRangeEnum,
});

// --- Step 4: Payment structure ----------------------------------------------
export const stepPaymentSchema = z.object({
  paymentStructure: leadPaymentStructureEnum,
});

// --- Step 5: Contact info ---------------------------------------------------
export const stepContactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(100, "That name looks too long"),
  phone: z
    .string()
    .trim()
    .regex(
      nigerianPhoneRegex,
      "Enter a valid Nigerian number, e.g. 0803 123 4567"
    ),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
});

// --- Full form (all steps merged) -------------------------------------------
export const leadQualificationSchema = stepPurposeSchema
  .merge(stepTimelineSchema)
  .merge(stepBudgetSchema)
  .merge(stepPaymentSchema)
  .merge(stepContactSchema);

export type LeadQualificationInput = z.infer<typeof leadQualificationSchema>;

// --- Viewing request schema (CORE 07) ---------------------------------------
export const viewingRequestSchema = z.object({
  leadId: z.string().uuid(),
  propertyId: z.string().uuid(),
  mode: z.enum(["physical", "virtual"]),
  preferredDate: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), "Pick a valid date"),
  preferredTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a valid time"),
  notes: z.string().max(500).optional(),
});

export type ViewingRequestInput = z.infer<typeof viewingRequestSchema>;

// --- Human-readable labels ---------------------------------------------
// Used by both the form UI (option labels) and the WhatsApp message builder,
// so the wording a prospect sees on-screen matches what lands in the agent's
// WhatsApp — no separate copy to keep in sync.

export const PURPOSE_LABELS: Record<
  z.infer<typeof leadPurposeEnum>,
  string
> = {
  personal: "Buying for myself",
  investment: "Investment / Buy-to-let",
  shortlet: "Shortlet",
};

export const TIMELINE_LABELS: Record<
  z.infer<typeof leadTimelineEnum>,
  string
> = {
  immediate: "Immediate (less than 30 days)",
  "1_3_months": "1–3 months",
  exploring: "Just exploring",
};

export const BUDGET_LABELS: Record<
  z.infer<typeof leadBudgetRangeEnum>,
  string
> = {
  under_30m: "Under ₦30m",
  "30m_50m": "₦30m – ₦50m",
  "50m_100m": "₦50m – ₦100m",
  "100m_plus": "₦100m+",
};

export const PAYMENT_LABELS: Record<
  z.infer<typeof leadPaymentStructureEnum>,
  string
> = {
  outright: "Outright cash",
  installment: "Payment plan / installments",
  mortgage: "Mortgage",
};
