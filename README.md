# Real Estate Lead Engine

Full technical infrastructure for a Nigerian real estate lead-qualification
site: a browsable property catalogue, a multi-step qualification + viewing
scheduler form, a WhatsApp-based handoff to agents, and an agent-facing
pipeline dashboard.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · React Hook Form + Zod ·
Supabase (Postgres + RLS + Auth + Storage)

## Project structure

```
supabase/migrations/0001_init.sql               -- properties, leads, viewings + RLS
supabase/migrations/0002_fix_viewing_insert_policy.sql -- fixes an RLS bug in the viewing policy
supabase/migrations/0003_grants.sql             -- base table grants (anon + service_role)
supabase/seed_demo_properties.sql               -- 8 demo properties spanning every filter combo

types/database.ts                       -- hand-written types mirroring the SQL schema
lib/schemas.ts                          -- Zod schemas (single source of truth for the forms)
lib/formatNaira.ts                      -- ₦ currency formatting
lib/budgetRanges.ts                     -- budget-bracket → numeric bounds, for search filtering
lib/generateWhatsAppLink.ts             -- pure WhatsApp message + wa.me link builder
lib/analytics.ts                        -- PostHog / GA4 / Meta Pixel event dispatch
lib/actions/submitLead.ts               -- Server Action: validates + inserts a lead
lib/actions/submitViewing.ts            -- Server Action: validates + inserts a viewing request
lib/supabase/client.ts                  -- browser Supabase client (anon key)
lib/supabase/server.ts                  -- Server Component Supabase client (anon key)
lib/supabase/admin.ts                   -- service-role client, server-only, admin use only

app/page.tsx                            -- homepage: hero, search/filter, property grid (CORE 01)
app/sitemap.ts                          -- dynamic XML sitemap (homepage + every published property)
app/properties/[slug]/page.tsx          -- listing page: metadata, JSON-LD, gallery, CTA (revalidates every 60s)
app/admin/login/page.tsx                -- agent login page
app/admin/page.tsx                      -- agent dashboard: leads pipeline + viewing requests
app/admin/actions.ts                    -- Server Actions: update lead status, sign out
middleware.ts                           -- protects /admin/* behind a Supabase Auth session

components/PropertySearchForm.tsx       -- plain GET form filter bar (no client JS)
components/PropertyCard.tsx             -- homepage grid card
components/LeadQualificationForm.tsx    -- 5-step qualification form + optional 6th viewing step
components/PropertyInquiryLauncher.tsx  -- modal trigger + sticky mobile CTA bar
components/PropertyMediaGallery.tsx     -- image carousel/lightbox
components/AdminLoginForm.tsx           -- agent sign-in form
```

## Setup

1. **Create a Supabase project.** Note which region you pick — it matters
   later (see "Performance" below).
2. **Run all three migrations, in order**, in the SQL Editor (or via
   `npx supabase db push` if you have the CLI linked):
   - `0001_init.sql` — tables, enums, RLS policies
   - `0002_fix_viewing_insert_policy.sql` — fixes a real bug: the original
     viewing-request policy checked `leads` via a raw `EXISTS` subquery,
     which RLS on `leads` would silently block, making every viewing
     request fail regardless of whether the lead was real. Replaces it
     with a `SECURITY DEFINER` function that can check safely without
     exposing lead data to the public.
   - `0003_grants.sql` — **required, not optional.** Supabase no longer
     auto-grants table access to any role (including `service_role`) on
     new projects as of 2026. Skipping this produces "permission denied"
     errors that look like RLS problems but aren't — it's a separate, more
     basic gate underneath RLS. This bit us twice in testing: once for
     `anon` on `properties`, once for `service_role` on the admin
     dashboard.
3. **Create the agent's login manually.** There is deliberately no public
   sign-up page — Supabase Dashboard → **Authentication → Users → Add user**,
   set an email + password. That's the only account that can reach `/admin`.
4. **Copy env vars**: `cp .env.example .env.local` and fill in your Supabase
   URL/keys. Mark `SUPABASE_SERVICE_ROLE_KEY` as **Secret**, not "Config",
   wherever your hosting provider distinguishes the two — and if it's ever
   been visible as "Config", rotate it in Supabase before relying on it.
5. **Install and run locally**:
   ```bash
   npm install
   npm run dev
   ```
6. **Add property listings.** Either:
   - Run `supabase/seed_demo_properties.sql` for 8 demo properties with
     placeholder photos (see "Demo photos vs. real photos" below), or
   - Add rows manually via Table Editor — needs a `slug`, `agent_whatsapp`
     in `+234...` format, and `published = true`.

## Adding real property photos

There's no in-app image uploader — photos go through Supabase Storage
directly:

1. Supabase Dashboard → **Storage** → **New bucket** → name it (e.g.
   `property-photos`) → toggle **Public bucket** ON → Create.
2. Upload images into it (organizing by a per-property folder keeps this
   manageable as listings grow).
3. Click a file → copy its public URL — looks like
   `https://yourproject.supabase.co/storage/v1/object/public/property-photos/<path>`.
4. Update that property's `media` field via SQL:
   ```sql
   update properties
   set media = '[
     {"url": "https://yourproject.supabase.co/storage/v1/object/public/property-photos/<slug>/exterior.jpg", "alt": "Exterior view", "order": 0},
     {"url": "https://yourproject.supabase.co/storage/v1/object/public/property-photos/<slug>/living-room.jpg", "alt": "Living room", "order": 1}
   ]'::jsonb
   where slug = '<slug>';
   ```
   Repeat per property.

No `next.config.js` change needed — `*.supabase.co/storage/v1/object/public/**`
is already whitelisted for `next/image`.

**Resize before uploading** — aim for ~1600px wide max, under ~400KB per
photo. Full-resolution phone photos will noticeably slow the site down,
which undercuts the brief's core "fast on mobile networks" requirement.

### Demo photos vs. real photos

`seed_demo_properties.sql` uses [Lorem Picsum](https://picsum.photos)
placeholder images — a real, stable service, but **not real estate photos**;
Picsum's seed values just pick a *consistent* random image, not a *relevant*
one, so don't be surprised if a "seed" meant to look like a duplex returns a
photo of something unrelated. Fine for proving the gallery/filter UI works;
replace with real photos (above) before showing an actual client. This
needed `picsum.photos` added to `next.config.js`'s `remotePatterns` — real
Supabase Storage photos don't need any config change since that domain was
already whitelisted.

## Deploying to Vercel

1. Push this repo to GitHub (make sure `package.json` sits at the repo
   root, not nested in a subfolder — Vercel's Next.js auto-detection needs
   that).
2. Import it in Vercel — Framework Preset should auto-detect **Next.js**.
3. Add the same four env vars from `.env.local` into **Project Settings →
   Environment Variables** (all three environments: Production, Preview,
   Development).
4. **Set the Function Region to match your Supabase project's region** —
   Project Settings → Functions → Function Region. This matters more than
   it sounds like it should (see "Performance" below).
5. Deploy, then trigger it again any time an env var or region setting
   changes — editing either alone does not redeploy.

## Performance: match your Vercel region to your Supabase region

Vercel defaults new projects to `iad1` (Washington, D.C.). If your Supabase
database is elsewhere — commonly Europe (London/`lhr1`, Frankfurt/`fra1`),
since Supabase has no African region yet — every dynamic page load pays for
**two long-haul hops**: user → Vercel edge → function (wherever it's
configured) → Supabase database → back → back. Colocating the function
region with the database region removes the worse of those two hops. This
was the single biggest performance fix made during development — confirmed
to make property pages noticeably faster, not just theoretically.

`app/properties/[slug]/page.tsx` also sets `export const revalidate = 60;`
as a smaller, complementary optimization — repeat visits within 60 seconds
skip the Supabase round-trip entirely.

## Demo walkthrough (for showing prospective clients)

The real pitch isn't the property page — it's what happens *after* someone
inquires. A generic Nigerian property portal hands an agent a bare phone
number with zero context; this hands them a pre-qualified WhatsApp message
plus a dashboard, automatically, every time.

1. **Homepage** (`/`) — browse the catalogue, filter by state / bedrooms /
   budget. Filtering reloads the page with query params (`?state=Lagos`), no
   client JS required, fast on mobile networks.
2. **Property page** (`/properties/[slug]`) — click any card. Full listing
   with gallery, specs, Schema.org JSON-LD for SEO (worth mentioning even
   without a live demo of search rankings — the structured data and sitemap
   are real and already built).
3. **Inquire via WhatsApp** — walk through the 5-step qualification form.
   The contact step saves the lead to Supabase. The 6th step offers an
   optional viewing request (date/time/mode) before redirecting to
   WhatsApp with a pre-filled message containing every answer — purpose,
   timeline, budget, payment structure, contact info, all attached
   automatically.
4. **Agent dashboard** (`/admin`) — log in with the agent account from
   Setup step 3. This is the actual differentiator to lead with: every
   lead, with its full qualification answers, an editable pipeline status,
   and every viewing request underneath — including ones that never made
   it to WhatsApp, which are still captured here rather than lost.

## What's intentionally not built

- **In-app photo upload UI** — see "Adding real property photos" above;
  it's a real, working manual workflow through Supabase Storage, just not
  a built-in uploader in the app itself.
- **Multi-agent support** — the admin dashboard shows *all* leads to *any*
  logged-in agent; there's no per-agent filtering or role separation.
- **Editable viewing status** — the dashboard's viewings table is read-only;
  updating a viewing's status (confirmed/rescheduled/etc.) isn't wired up.
- **Pagination** on the homepage grid — fine for a demo catalogue, would
  need addressing before hundreds of live listings.

## Notes worth knowing

- **RLS vs. table grants**: two separate gates. RLS policies control
  *which rows* a role can see once it's already allowed to query a table;
  Postgres separately requires a base `GRANT` before that's even possible.
  `0003_grants.sql` is not optional — see Setup step 2.
- **Never chain `.select().single()` after an insert under RLS** unless
  there's an explicit SELECT policy allowing it. Reading a row back after
  inserting it is an implicit SELECT; if the public shouldn't be able to
  read that table (leads, viewings — by design, so no one reads other
  people's submissions), that read-back gets blocked by RLS and rolls back
  the *entire insert*, even though the insert policy itself was fine. Both
  `submitLead.ts` and `submitViewing.ts` instead generate the row's `id`
  themselves (`crypto.randomUUID()`) and never read anything back.
- **Env vars only apply after a restart/redeploy** — Next.js reads
  `.env.local` at server startup, and Vercel only applies env var changes
  on the *next* deploy, not retroactively.
- **Service-role key**: only ever used server-side (`lib/supabase/admin.ts`,
  imported only into `app/admin/*`), never shipped to the browser. Mark it
  as **Secret** (not "Config") in Vercel. If it's ever been stored as
  "Config" (readable), treat it as potentially exposed and rotate it in
  Supabase's dashboard, then update it everywhere it's used
  (`.env.local` and Vercel both).
- **The WhatsApp + analytics handoff** (`proceedToWhatsApp` in
  `LeadQualificationForm.tsx`) awaits a short grace window
  (`trackEventBeforeRedirect`, 250ms) before redirecting — some mobile
  browsers suspend JS execution the instant navigation starts, which can
  silently drop analytics calls that haven't left the page yet. Worth
  testing on a real device with network throttling before trusting the
  funnel numbers.
