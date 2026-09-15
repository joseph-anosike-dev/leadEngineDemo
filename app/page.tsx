import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PropertySearchForm } from "@/components/PropertySearchForm";
import { PropertyCard } from "@/components/PropertyCard";
import { BUDGET_RANGE_BOUNDS } from "@/lib/budgetRanges";
import type { LeadBudgetRange, Property } from "@/types/database";

export const metadata: Metadata = {
  title: "Find Your Next Property",
  description:
    "Browse verified properties across Nigeria and connect directly with agents on WhatsApp.",
};

interface HomePageProps {
  searchParams: Promise<{
    state?: string;
    minBedrooms?: string;
    budget?: string;
  }>;
}

async function getFilteredProperties(filters: {
  state?: string;
  minBedrooms?: string;
  budget?: string;
}): Promise<Pick<
  Property,
  | "slug"
  | "title"
  | "price_naira"
  | "city"
  | "state"
  | "neighborhood"
  | "bedrooms"
  | "bathrooms"
  | "status"
  | "media"
>[]> {
  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select(
      "slug, title, price_naira, city, state, neighborhood, bedrooms, bathrooms, status, media"
    )
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (filters.state) {
    query = query.ilike("state", `%${filters.state}%`);
  }

  if (filters.minBedrooms) {
    const minBedrooms = Number.parseInt(filters.minBedrooms, 10);
    if (!Number.isNaN(minBedrooms)) {
      query = query.gte("bedrooms", minBedrooms);
    }
  }

  if (filters.budget && filters.budget in BUDGET_RANGE_BOUNDS) {
    const { min, max } = BUDGET_RANGE_BOUNDS[filters.budget as LeadBudgetRange];
    query = query.gte("price_naira", min);
    if (max !== null) {
      query = query.lt("price_naira", max);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("PROPERTY LIST QUERY FAILED:", error);
    return [];
  }

  return data ?? [];
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const filters = await searchParams;
  const properties = await getFilteredProperties(filters);

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <header className="border-b border-[#1A1A1A]/10 bg-[#1A1A1A] px-4 py-10 text-center sm:py-14">
        <h1 className="text-2xl font-semibold text-[#FAF9F6] sm:text-3xl">
          Find your next property in Nigeria
        </h1>
        <p className="mt-2 text-sm text-[#FAF9F6]/70">
          Verified listings. Direct WhatsApp contact with agents.
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="-mt-16 mb-8 sm:-mt-20">
          <PropertySearchForm
            defaultValues={{
              state: filters.state,
              minBedrooms: filters.minBedrooms,
              budget: filters.budget,
            }}
          />
        </div>

        {properties.length === 0 ? (
          <p className="rounded-xl bg-white p-8 text-center text-sm text-[#1A1A1A]/60">
            No properties match your search right now. Try adjusting your
            filters.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.slug} property={property} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
