create table business_profile (
  id                uuid primary key default gen_random_uuid(),
  business_name     text not null,
  business_type     text not null check (business_type in ('individual', 'agency')),
  photo_url         text,
  office_address    text,
  creds             jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table business_profile enable row level security;

create policy "Public can view business profile"
  on business_profile
  for select
  to anon, authenticated
  using (true);

grant usage on schema public to anon, authenticated;
grant select on public.business_profile to anon, authenticated, service_role;