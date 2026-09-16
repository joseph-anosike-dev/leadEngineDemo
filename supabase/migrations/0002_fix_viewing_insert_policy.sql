-- ============================================================================
-- Fixes a real bug in the original "Public can request a viewing" policy.
--
-- That policy's with_check used a raw EXISTS subquery against `leads`:
--   exists (select 1 from leads where leads.id = viewings.lead_id ...)
-- RLS applies to every query against a table, including subqueries inside
-- another table's policy. Since `leads` intentionally has no SELECT policy
-- for the public (we don't want anyone reading other people's leads), that
-- EXISTS subquery would always see zero rows and evaluate to false — which
-- means every viewing request would be silently rejected, regardless of
-- whether a matching lead genuinely existed.
--
-- Fix: a SECURITY DEFINER function runs with the function owner's
-- privileges (bypassing RLS internally), so it can safely check whether a
-- lead exists without needing to expose lead data to the public at all.
-- ============================================================================

create or replace function public.lead_matches_property(
  p_lead_id uuid,
  p_property_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from leads
    where leads.id = p_lead_id
    and leads.property_id = p_property_id
  );
$$;

drop policy if exists "Public can request a viewing" on viewings;

create policy "Public can request a viewing"
  on viewings
  for insert
  to anon, authenticated
  with check (
    public.lead_matches_property(lead_id, property_id)
  );
