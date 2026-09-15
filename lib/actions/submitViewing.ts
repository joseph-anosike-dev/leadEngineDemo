"use server";

import { createClient } from "@/lib/supabase/server";
import { viewingRequestSchema, type ViewingRequestInput } from "@/lib/schemas";
import type { Viewing } from "@/types/database";

export type SubmitViewingResult =
  | { success: true; viewing: Viewing }
  | { success: false; error: string };

/**
 * Server Action: validates and inserts a viewing request. Mirrors
 * submitLead.ts's shape — re-validates server-side, uses the anon client
 * (RLS's "Public can request a viewing" insert policy is what actually
 * authorizes this, including its check that leadId/propertyId already
 * correspond to a real lead row).
 *
 * Deliberately does NOT throw on failure — a viewing request is an
 * additive, optional step tacked onto the end of the qualification form.
 * If it fails, the caller should still be able to continue to the WhatsApp
 * handoff, which is the core value of the flow.
 */
export async function submitViewing(
  input: ViewingRequestInput
): Promise<SubmitViewingResult> {
  const parsed = viewingRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please pick a valid date and time.",
    };
  }

  const supabase = await createClient();

  const { data: viewing, error } = await supabase
    .from("viewings")
    .insert({
      lead_id: parsed.data.leadId,
      property_id: parsed.data.propertyId,
      mode: parsed.data.mode,
      preferred_date: parsed.data.preferredDate,
      preferred_time: parsed.data.preferredTime,
      notes: parsed.data.notes || null,
    })
    .select()
    .single();

  if (error || !viewing) {
    return {
      success: false,
      error: "We couldn't save your viewing request just now.",
    };
  }

  return { success: true, viewing };
}
