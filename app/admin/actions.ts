"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PipelineStatus } from "@/types/database";

const VALID_STATUSES: PipelineStatus[] = [
  "new",
  "qualified",
  "viewing_scheduled",
  "completed",
  "offer_made",
  "closed",
];

/**
 * Updates a lead's pipeline status. Bound to a per-row <form action={...}>
 * in the admin dashboard (see app/admin/page.tsx), so this runs as a normal
 * form submission — no client JS required for the dashboard's core action.
 *
 * Re-checks the session here rather than trusting middleware alone: Server
 * Actions are reachable as their own POST endpoints, so an unauthenticated
 * request could in principle hit this directly without ever passing through
 * the page's middleware-protected render.
 */
export async function updateLeadStatus(
  leadId: string,
  formData: FormData
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const status = formData.get("status");

  if (typeof status !== "string" || !VALID_STATUSES.includes(status as PipelineStatus)) {
    return;
  }

  const admin = createAdminClient();
  await admin
    .from("leads")
    .update({ pipeline_status: status as PipelineStatus })
    .eq("id", leadId);

  revalidatePath("/admin");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
