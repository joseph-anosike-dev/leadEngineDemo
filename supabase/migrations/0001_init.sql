-- ============================================================================
-- Real Estate Lead Engine — Initial Schema
-- Tables: properties, leads, viewings
-- Includes enums, indexes, and Row Level Security policies.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------

create type property_status as enum ('available', 'under_offer', 'sold');

create type title_document_type as enum (
  'c_of_o',              -- Certificate of Occupancy
  'governors_consent',
  'gazette',
  'deed_of_assignment',
  'excision',
  'family_land',
  'other'
);

create type lead_purpose as enum ('personal', 'investment', 'shortlet');

create type lead_timeline as enum ('immediate', '1_3_months', 'exploring');

create type lead_budget_range as enum (
  'under_30m',
  '30m_50m',
  '50m_100m',
  '100m_plus'
);

create type lead_payment_structure as enum ('outright', 'installment', 'mortgage');

create type whatsapp_status as enum ('pending', 'sent', 'failed');

create type pipeline_status as enum (
  'new',
  'qualified',
  'viewing_scheduled',
  'completed',
  'offer_made',
  'closed'
);

-- ----------------------------------------------------------------------------
-- properties
-- ----------------------------------------------------------------------------

create table properties (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  title               text not null,
  description         text,

  -- Pricing (stored as integer kobo-free naira to avoid float rounding issues)
  price_naira         bigint not null check (price_naira >= 0),

  -- Location
  state               text not null,
  city                text not null,
  neighborhood        text,
  micro_location_note text, -- e.g. "5 min from Lekki Toll Gate"

  -- Specs
  bedrooms            int not null default 0,
  bathrooms           int not null default 0,
  size_sqm            numeric,
  parking_spaces      int not null default 0,
  title_document      title_document_type not null default 'other',

  -- Status
  status              property_status not null default 'available',

  -- Media: array of objects like { "url": "...", "alt": "...", "order": 0 }
  media               jsonb not null default '[]'::jsonb,

  -- Agent contact (denormalized here so each listing can route to a
  -- different agent's WhatsApp number without a join)
  agent_name          text not null,
  agent_whatsapp      text not null, -- E.164 format, e.g. +2348012345678

  -- SEO
  meta_title          text,
  meta_description    text,
  og_image_url        text,

  published           boolean not null default true,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_properties_status on properties (status) where published = true;
create index idx_properties_state_city on properties (state, city);
create index idx_properties_slug on properties (slug);

-- ----------------------------------------------------------------------------
-- leads
-- ----------------------------------------------------------------------------

create table leads (
  id                  uuid primary key default gen_random_uuid(),
  property_id         uuid not null references properties (id) on delete cascade,

  -- Qualification answers
  purpose             lead_purpose not null,
  timeline            lead_timeline not null,
  budget_range        lead_budget_range not null,
  payment_structure   lead_payment_structure not null,

  -- Contact
  full_name           text not null,
  phone               text not null,
  email               text,

  -- WhatsApp handoff tracking
  whatsapp_status     whatsapp_status not null default 'pending',
  whatsapp_message    text, -- the exact rendered payload sent, for audit/debug

  -- Pipeline
  pipeline_status     pipeline_status not null default 'new',

  -- Attribution
  source              text,       -- e.g. "organic", "meta_ads", "google_ads"
  utm_source          text,
  utm_medium          text,
  utm_campaign        text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_leads_property_id on leads (property_id);
create index idx_leads_pipeline_status on leads (pipeline_status);
create index idx_leads_created_at on leads (created_at desc);

-- ----------------------------------------------------------------------------
-- viewings
-- ----------------------------------------------------------------------------

create type viewing_status as enum (
  'requested',
  'confirmed',
  'rescheduled',
  'completed',
  'no_show',
  'cancelled'
);

create type viewing_mode as enum ('physical', 'virtual');

create table viewings (
  id                  uuid primary key default gen_random_uuid(),
  lead_id             uuid not null references leads (id) on delete cascade,
  property_id         uuid not null references properties (id) on delete cascade,

  mode                viewing_mode not null default 'physical',
  preferred_date      date not null,
  preferred_time      time not null,

  status              viewing_status not null default 'requested',
  notes               text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_viewings_lead_id on viewings (lead_id);
create index idx_viewings_property_id on viewings (property_id);
create index idx_viewings_status on viewings (status);

-- ----------------------------------------------------------------------------
-- updated_at trigger (shared across all three tables)
-- ----------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_properties_updated_at
  before update on properties
  for each row execute function set_updated_at();

create trigger trg_leads_updated_at
  before update on leads
  for each row execute function set_updated_at();

create trigger trg_viewings_updated_at
  before update on viewings
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------

alter table properties enable row level security;
alter table leads enable row level security;
alter table viewings enable row level security;

-- properties: anyone (anon) can read published, non-sold-out-of-view listings.
-- Writes are NOT allowed from the client — property management happens via
-- the service role (e.g. an internal admin tool or direct DB access), so no
-- insert/update/delete policy is defined for the anon/authenticated roles.
create policy "Public can view published properties"
  on properties
  for select
  to anon, authenticated
  using (published = true);

-- leads: public (anon) can INSERT a lead (the qualification form is
-- unauthenticated), but can NEVER read, update, or delete leads — that data
-- belongs to the agency. All lead reads happen via the service role.
create policy "Public can submit a lead"
  on leads
  for insert
  to anon, authenticated
  with check (true);

-- Explicitly no select/update/delete policies for anon/authenticated on
-- leads — RLS defaults to deny, so this is enforced by omission. Documented
-- here for clarity rather than relying on silence.

-- viewings: same pattern as leads — public can request a viewing, but can't
-- read back the viewing table (would leak other prospects' scheduling data).
create policy "Public can request a viewing"
  on viewings
  for insert
  to anon, authenticated
  with check (
    -- Guard against inserting a viewing against a lead/property pair that
    -- doesn't exist or doesn't match — cheap integrity check at the DB layer.
    exists (
      select 1 from leads
      where leads.id = viewings.lead_id
      and leads.property_id = viewings.property_id
    )
  );

-- ----------------------------------------------------------------------------
-- Notes for the service role (admin) side:
-- The service role key bypasses RLS entirely, so all agent-facing reads
-- (lead lists, pipeline dashboards, viewing calendars) and all property
-- management (create/update/sold-status changes) should go through a
-- server-only Supabase client instantiated with SUPABASE_SERVICE_ROLE_KEY,
-- never exposed to the browser.
-- ----------------------------------------------------------------------------
