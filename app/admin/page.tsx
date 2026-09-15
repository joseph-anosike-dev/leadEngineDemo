import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PURPOSE_LABELS,
  TIMELINE_LABELS,
  BUDGET_LABELS,
  PAYMENT_LABELS,
} from "@/lib/schemas";
import { updateLeadStatus, signOutAction } from "@/app/admin/actions";
import type { Lead, Property, Viewing, PipelineStatus } from "@/types/database";

export const metadata = {
  title: "Agent Dashboard",
};

// Middleware already gates every /admin/* route behind a session, but this
// page also needs the service-role client to actually read leads/viewings
// (RLS deliberately blocks the anon client from ever reading those tables
// — see supabase/migrations/0001_init.sql). The middleware check is what
// makes it safe to use that privileged client here.

const PIPELINE_STATUS_OPTIONS: PipelineStatus[] = [
  "new",
  "qualified",
  "viewing_scheduled",
  "completed",
  "offer_made",
  "closed",
];

const PIPELINE_STATUS_LABELS: Record<PipelineStatus, string> = {
  new: "New",
  qualified: "Qualified",
  viewing_scheduled: "Viewing Scheduled",
  completed: "Completed",
  offer_made: "Offer Made",
  closed: "Closed",
};

async function getDashboardData() {
  const admin = createAdminClient();

  const [{ data: leads, error: leadsError }, { data: properties }, { data: viewings }] =
    await Promise.all([
      admin
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false }),
      admin.from("properties").select("id, title, slug"),
      admin
        .from("viewings")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

  if (leadsError) {
    console.error("ADMIN LEADS QUERY FAILED:", leadsError);
  }

  const propertyMap = new Map(
    (properties ?? []).map((p: Pick<Property, "id" | "title" | "slug">) => [
      p.id,
      p,
    ])
  );
  const leadMap = new Map((leads ?? []).map((l: Lead) => [l.id, l]));

  return {
    leads: (leads ?? []) as Lead[],
    viewings: (viewings ?? []) as Viewing[],
    propertyMap,
    leadMap,
  };
}

export default async function AdminDashboardPage() {
  // Defense-in-depth: middleware already redirects unauthenticated visitors
  // away from /admin/*, but re-check here too rather than relying on a
  // single enforcement point.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // middleware will have already redirected before this renders
  }

  const { leads, viewings, propertyMap, leadMap } = await getDashboardData();

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A]">
              Agent Dashboard
            </h1>
            <p className="text-sm text-[#1A1A1A]/60">
              Signed in as {user.email}
            </p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-[#1A1A1A]/15 px-4 py-2 text-sm font-medium text-[#1A1A1A]"
            >
              Sign out
            </button>
          </form>
        </div>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#1A1A1A]/50">
            Leads ({leads.length})
          </h2>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#1A1A1A]/10 text-xs uppercase text-[#1A1A1A]/50">
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Prospect</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Timeline</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Received</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-[#1A1A1A]/40"
                    >
                      No leads yet.
                    </td>
                  </tr>
                )}
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-[#1A1A1A]/5 last:border-0"
                  >
                    <td className="px-4 py-3">
                      {propertyMap.get(lead.property_id)?.title ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#1A1A1A]">
                        {lead.full_name}
                      </div>
                      <div className="text-xs text-[#1A1A1A]/50">
                        {lead.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">{PURPOSE_LABELS[lead.purpose]}</td>
                    <td className="px-4 py-3">
                      {TIMELINE_LABELS[lead.timeline]}
                    </td>
                    <td className="px-4 py-3">
                      {BUDGET_LABELS[lead.budget_range]}
                    </td>
                    <td className="px-4 py-3">
                      {PAYMENT_LABELS[lead.payment_structure]}
                    </td>
                    <td className="px-4 py-3">
                      <form
                        action={updateLeadStatus.bind(null, lead.id)}
                        className="flex items-center gap-2"
                      >
                        <select
                          name="status"
                          defaultValue={lead.pipeline_status}
                          className="rounded-lg border border-[#1A1A1A]/15 px-2 py-1 text-xs"
                        >
                          {PIPELINE_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {PIPELINE_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg bg-[#7A1F1F] px-2 py-1 text-xs font-medium text-white"
                        >
                          Update
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#1A1A1A]/50">
                      {new Date(lead.created_at).toLocaleDateString("en-NG")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#1A1A1A]/50">
            Viewing Requests ({viewings.length})
          </h2>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#1A1A1A]/10 text-xs uppercase text-[#1A1A1A]/50">
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Prospect</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Requested date/time</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {viewings.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-[#1A1A1A]/40"
                    >
                      No viewing requests yet.
                    </td>
                  </tr>
                )}
                {viewings.map((viewing) => (
                  <tr
                    key={viewing.id}
                    className="border-b border-[#1A1A1A]/5 last:border-0"
                  >
                    <td className="px-4 py-3">
                      {propertyMap.get(viewing.property_id)?.title ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {leadMap.get(viewing.lead_id)?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 capitalize">{viewing.mode}</td>
                    <td className="px-4 py-3">
                      {viewing.preferred_date} at {viewing.preferred_time}
                    </td>
                    <td className="px-4 py-3 capitalize">{viewing.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
