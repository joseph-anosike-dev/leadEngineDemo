import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Service-role client — bypasses RLS entirely. This must NEVER be imported
// into a 'use client' file or any code that ships to the browser; the
// `server-only` import above will throw a build error if that happens by
// mistake, as a guardrail.
//
// Use this for admin-side operations only: agent dashboards reading all
// leads, property management (create/update/status changes), pipeline
// updates. The public lead submission flow does NOT need this — the anon
// client's RLS "insert" policy already allows that write.
//
// Required env var (server-only — do NOT prefix with NEXT_PUBLIC_):
//   SUPABASE_SERVICE_ROLE_KEY
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
