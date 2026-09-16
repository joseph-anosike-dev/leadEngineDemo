-- ============================================================================
-- Base table grants — REQUIRED on every new Supabase project.
--
-- Why this file exists: as of 2026, Supabase no longer automatically grants
-- table-level access to ANY role (anon, authenticated, or service_role) on
-- new projects — this changed from the old default where every role got
-- full access automatically. RLS policies (0001_init.sql) control *which
-- rows* a role can see; this file controls whether a role can query the
-- table AT ALL, which is a separate, more basic gate that sits underneath
-- RLS. Skipping this file produces "permission denied" errors that look
-- like RLS problems but aren't — RLS never even gets evaluated if the base
-- grant is missing.
--
-- Run this immediately after 0001_init.sql and 0002_fix_viewing_insert_policy.sql,
-- on every new Supabase project this codebase is deployed against.
-- ============================================================================

-- Public-facing roles: only what the app's public pages actually need.
-- (No SELECT on leads/viewings for anon/authenticated — the app never reads
-- a row back after inserting it, by design, so the public should never be
-- able to read other people's leads or viewing requests.)
grant usage on schema public to anon, authenticated;
grant select on public.properties to anon, authenticated;
grant insert on public.leads to anon, authenticated;
grant insert on public.viewings to anon, authenticated;

-- service_role: used ONLY by the agent-facing /admin dashboard
-- (lib/supabase/admin.ts), never exposed to the browser. This role bypasses
-- RLS by design, but still needs the base table grant — that's the part
-- that's easy to forget, since "service_role bypasses RLS" doesn't mean
-- "service_role can query anything with no setup at all."
grant usage on schema public to service_role;
grant select, insert, update, delete on public.properties to service_role;
grant select, insert, update, delete on public.leads to service_role;
grant select, insert, update, delete on public.viewings to service_role;
