// ============================================================================
// Hand-maintained types mirroring supabase/migrations/0001_init.sql
//
// In a real project, once the schema is deployed you'd run:
//   npx supabase gen types typescript --project-id <id> > types/supabase.ts
// and import the generated `Database` type instead. This file exists so the
// rest of the codebase has correct types to build against before that first
// deploy happens, and documents the shape by hand for readability.
// ============================================================================

export type PropertyStatus = "available" | "under_offer" | "sold";

export type TitleDocumentType =
  | "c_of_o"
  | "governors_consent"
  | "gazette"
  | "deed_of_assignment"
  | "excision"
  | "family_land"
  | "other";

export type LeadPurpose = "personal" | "investment" | "shortlet";

export type LeadTimeline = "immediate" | "1_3_months" | "exploring";

export type LeadBudgetRange = "under_30m" | "30m_50m" | "50m_100m" | "100m_plus";

export type LeadPaymentStructure = "outright" | "installment" | "mortgage";

export type WhatsAppStatus = "pending" | "sent" | "failed";

export type PipelineStatus =
  | "new"
  | "qualified"
  | "viewing_scheduled"
  | "completed"
  | "offer_made"
  | "closed";

export type ViewingStatus =
  | "requested"
  | "confirmed"
  | "rescheduled"
  | "completed"
  | "no_show"
  | "cancelled";

export type ViewingMode = "physical" | "virtual";

export type PropertyMediaItem = {
  url: string;
  alt: string;
  order: number;
}

export type Property = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price_naira: number;
  state: string;
  city: string;
  neighborhood: string | null;
  micro_location_note: string | null;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number | null;
  parking_spaces: number;
  title_document: TitleDocumentType;
  status: PropertyStatus;
  media: PropertyMediaItem[];
  agent_name: string;
  agent_whatsapp: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export type Lead = {
  id: string;
  property_id: string;
  purpose: LeadPurpose;
  timeline: LeadTimeline;
  budget_range: LeadBudgetRange;
  payment_structure: LeadPaymentStructure;
  full_name: string;
  phone: string;
  email: string | null;
  whatsapp_status: WhatsAppStatus;
  whatsapp_message: string | null;
  pipeline_status: PipelineStatus;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  updated_at: string;
}

export type Viewing = {
  id: string;
  lead_id: string;
  property_id: string;
  mode: ViewingMode;
  preferred_date: string; // ISO date (YYYY-MM-DD)
  preferred_time: string; // HH:MM
  status: ViewingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Minimal Supabase `Database` shape — enough for the typed client in
// lib/supabase/*.ts. Extend this (or swap for generated types) as the schema
// grows. `Views` and `Functions` are declared empty (rather than omitted)
// because @supabase/postgrest-js's generic constraints require both keys to
// be present on the schema object, even when unused.
export type Database = {
  // Recent @supabase/supabase-js versions infer ClientOptions (e.g. the
  // Postgrest wire-protocol version) from this marker. Without it, schema
  // resolution silently collapses to `never` instead of falling back
  // gracefully, which breaks .insert()/.update() typing on every table.
  // `supabase gen types` includes this automatically — added by hand here
  // since this file is hand-maintained.
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Tables: {
      properties: {
        Row: Property;
        Insert: Omit<Property, "id" | "created_at" | "updated_at"> &
          Partial<Pick<Property, "id" | "created_at" | "updated_at">>;
        Update: Partial<Property>;
        Relationships: [];
      };
      leads: {
        Row: Lead;
        Insert: Omit<
          Lead,
          | "id"
          | "created_at"
          | "updated_at"
          | "whatsapp_status"
          | "whatsapp_message"
          | "pipeline_status"
        > &
          Partial<
            Pick<
              Lead,
              | "id"
              | "created_at"
              | "updated_at"
              | "whatsapp_status"
              | "whatsapp_message"
              | "pipeline_status"
            >
          >;
        Update: Partial<Lead>;
        Relationships: [];
      };
      viewings: {
        Row: Viewing;
        Insert: Omit<Viewing, "id" | "created_at" | "updated_at" | "status"> &
          Partial<Pick<Viewing, "id" | "created_at" | "updated_at" | "status">>;
        Update: Partial<Viewing>;
        Relationships: [];
      };
    };
  };
}
