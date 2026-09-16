"use server";

import { createClient } from "@/lib/supabase/server";
import { leadQualificationSchema, type LeadQualificationInput } from "@/lib/schemas";
import { randomUUID } from "crypto";

export interface SubmitLeadParams {
  propertyId: string;
  data: LeadQualificationInput;
  attribution?: {
    source?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
}

export type SubmitLeadResult =
  | { success: true; leadId: string }
  | { success: false; error: string };

/**
 * Server Action: validates the qualification answers again server-side
 * (never trust client-side Zod validation alone) and inserts the lead via
 * the anon client — RLS's "Public can submit a lead" insert policy is what
 * actually authorizes this write, not any elevated privilege here.
 */
export async function submitLead({


  propertyId,
  data,
  attribution,
}: SubmitLeadParams): Promise<SubmitLeadResult> {
  const parsed = leadQualificationSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: "Some of the details you entered aren't valid. Please check the form and try again.",
    };
  }

  const supabase = await createClient();
  const leadId = randomUUID();

  const { error } = await supabase
    .from("leads")
    .insert({
      id: leadId,
      property_id: propertyId,
      purpose: parsed.data.purpose,
      timeline: parsed.data.timeline,
      budget_range: parsed.data.budgetRange,
      payment_structure: parsed.data.paymentStructure,
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      source: attribution?.source ?? null,
      utm_source: attribution?.utmSource ?? null,
      utm_medium: attribution?.utmMedium ?? null,
      utm_campaign: attribution?.utmCampaign ?? null,
    })

  if (error) {
    console.error("LEAD SUBMIT FAILED:", error);
    return {
      success: false,
      error:
        "We couldn't save your details just now. Please try again, or reach out directly.",
    };
  }

  return { success: true, leadId };
}
