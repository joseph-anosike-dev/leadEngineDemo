import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Client-side Supabase instance — uses the anon key only, safe to ship to
// the browser. RLS policies (see 0001_init.sql) are what actually restrict
// what this client can do: public SELECT on published properties, public
// INSERT on leads/viewings, nothing else.
//
// Required env vars (public — prefixed NEXT_PUBLIC_ so Next.js exposes them
// to the browser bundle):
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
