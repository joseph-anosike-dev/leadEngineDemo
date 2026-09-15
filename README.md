# Real Estate Lead Engine

Core technical infrastructure for a Nigerian real estate lead-qualification
site: property listings, a multi-step qualification form, and a
WhatsApp-based handoff to agents with full lead context attached.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · React Hook Form + Zod ·
Supabase (Postgres + RLS)

## Project structure

```
supabase/migrations/0001_init.sql   -- properties, leads, viewings + RLS
types/database.ts                   -- hand-written types mirroring the SQL schema
lib/schemas.ts                      -- Zod schemas (single source of truth for the form)
lib/formatNaira.ts                  -- ₦ currency formatting
lib/generateWhatsAppLink.ts         -- pure WhatsApp message + wa.me link builder
lib/analytics.ts                    -- PostHog / GA4 / Meta Pixel event dispatch
lib/actions/submitLead.ts           -- Server Action: validates + inserts a lead
lib/supabase/client.ts              -- browser Supabase client (anon key)
lib/supabase/server.ts              -- Server Component Supabase client (anon key)
lib/supabase/admin.ts               -- service-role client, server-only, admin use only
components/LeadQualificationForm.tsx    -- the 5-step qualification form
components/PropertyInquiryLauncher.tsx  -- modal trigger + sticky mobile CTA bar
components/PropertyMediaGallery.tsx     -- image carousel/lightbox
app/properties/[slug]/page.tsx      -- listing page: metadata, JSON-LD, gallery, CTA
app/layout.tsx, app/globals.css     -- App Router root layout + Tailwind entrypoint
```

## Setup

1. **Create a Supabase project**, then run the migration:
   ```bash
   npx supabase db push
   # or paste supabase/migrations/0001_init.sql into the SQL editor
   ```
2. **Copy env vars**: `cp .env.example .env.local` and fill in your Supabase
   URL/keys. `SUPABASE_SERVICE_ROLE_KEY` is only needed once you build the
   admin/agent dashboard — the public site works without it.
3. **Install and run locally** (optional — you said you're deploying via
   Vercel directly, but useful for a sanity check first):
   ```bash
   npm install
   npm run dev
   ```
4. **Add at least one property row** in Supabase (via the table editor or a
   seed script) with a `slug`, `agent_whatsapp` in `+234...` or `0...`
   format, and `published = true` so it's visible under RLS.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel — it auto-detects Next.js, no build config needed.
3. Add the same env vars from `.env.local` into **Project Settings →
   Environment Variables** in Vercel (both Production and Preview).
4. Deploy. `app/properties/[your-slug]/page.tsx` route is generated
   automatically from the dynamic `[slug]` segment.

## What's intentionally not built yet

This covers CORE 01, 04, 05/06, and the SQL/RLS layer end-to-end. Not yet
implemented (flagging so nothing here is mistaken for "done"):

- **CORE 07 viewing scheduler UI** — the `viewings` table, RLS policy, and
  `viewingRequestSchema` exist in the schema/types layer, but there's no
  date/time-picker component or Server Action wired to it yet.
- **CORE 08 analytics wiring for the property list/search page** — the
  `trackEvent` dispatch layer is built and already fires from the listing
  page (`property_view`) and the form (`qualification_form_started`,
  `qualification_form_completed`, `whatsapp_redirect_clicked`), but the
  homepage/search/filter page itself isn't built yet, so those events don't
  fire from anywhere but a listing page.
- **Agent-facing admin/pipeline dashboard** — reading leads and updating
  `pipeline_status` needs the service-role client (`lib/supabase/admin.ts`)
  wired into some authenticated internal view; that view doesn't exist yet.
- **XML sitemap** — needs the property list, which needs the homepage/search
  page built first.
- **Property search/filter UI and homepage hero** (CORE 01's other half) —
  the listing *detail* page is done; the *browse* experience isn't.

## Notes on the WhatsApp + analytics handoff

`onFinalSubmit` in `LeadQualificationForm.tsx` awaits a short grace window
(`trackEventBeforeRedirect`, 250ms) between firing the
`whatsapp_redirect_clicked` event and calling `window.location.href`. Some
mobile browsers suspend JS execution the instant navigation starts, which can
silently drop analytics network calls that haven't left the page yet — this
is the one piece of the brief worth testing on a real device with network
throttling before trusting the funnel numbers.
