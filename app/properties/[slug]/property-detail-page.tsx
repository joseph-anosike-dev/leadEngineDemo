import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/formatNaira";
import { PropertyMediaGallery } from "@/components/PropertyMediaGallery";
import { PropertyInquiryLauncher } from "@/components/PropertyInquiryLauncher";
import type { Property, TitleDocumentType } from "@/types/database";

// Caches each property page for 60 seconds. Listings don't change
// second-to-second, so repeat visits within that window are served
// instantly instead of round-tripping to Supabase again — cuts real
// latency on every click after the first, on top of picking a Vercel
// function region close to the Supabase database (see README).
export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

const TITLE_DOCUMENT_LABELS: Record<TitleDocumentType, string> = {
  c_of_o: "Certificate of Occupancy",
  governors_consent: "Governor's Consent",
  gazette: "Gazette",
  deed_of_assignment: "Deed of Assignment",
  excision: "Excision",
  family_land: "Family Land",
  other: "Other",
};

const STATUS_LABELS: Record<Property["status"], string> = {
  available: "Available",
  under_offer: "Under Offer",
  sold: "Sold",
};

async function getProperty(slug: string): Promise<Property | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);

  if (!property) {
    return { title: "Property not found" };
  }

  const title =
    property.meta_title ??
    `${property.title} — ${formatNaira(property.price_naira)} | ${property.city}, ${property.state}`;
  const description =
    property.meta_description ??
    property.description?.slice(0, 155) ??
    `${property.bedrooms} bed, ${property.bathrooms} bath property in ${property.neighborhood ?? property.city}, ${property.state}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/properties/${property.slug}`,
    },
    openGraph: {
      title,
      description,
      images: property.og_image_url
        ? [{ url: property.og_image_url }]
        : property.media[0]
          ? [{ url: property.media[0].url }]
          : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function buildJsonLd(property: Property) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateAgent",
        name: property.agent_name,
      },
      {
        "@type": "SingleFamilyResidence",
        name: property.title,
        description: property.description ?? undefined,
        url: `${baseUrl}/properties/${property.slug}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: property.city,
          addressRegion: property.state,
          addressCountry: "NG",
        },
        numberOfBedrooms: property.bedrooms,
        numberOfBathroomsTotal: property.bathrooms,
        floorSize: property.size_sqm
          ? {
              "@type": "QuantitativeValue",
              value: property.size_sqm,
              unitCode: "MTK",
            }
          : undefined,
        image: property.media.map((m) => m.url),
      },
      {
        "@type": "Offer",
        price: property.price_naira,
        priceCurrency: "NGN",
        availability:
          property.status === "available"
            ? "https://schema.org/InStock"
            : "https://schema.org/SoldOut",
        url: `${baseUrl}/properties/${property.slug}`,
      },
    ],
  };
}

export default async function PropertyPage({ params }: PageProps) {
  const { slug } = await params;
  const property = await getProperty(slug);

  if (!property) {
    notFound();
  }

  const jsonLd = buildJsonLd(property);

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24 sm:pb-12">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <PropertyMediaGallery
          media={property.media}
          propertyTitle={property.title}
        />

        <div className="mt-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-[#1A1A1A]">
              {property.title}
            </h1>
            <p className="mt-1 text-sm text-[#1A1A1A]/60">
              {property.neighborhood ? `${property.neighborhood}, ` : ""}
              {property.city}, {property.state}
            </p>
          </div>
          <span
            className={`whitespace-nowrap px-3 py-1 text-xs font-medium ${
              property.status === "available"
                ? "bg-[#7A1F1F]/10 text-[#7A1F1F]"
                : "bg-[#1A1A1A]/10 text-[#1A1A1A]/60"
            }`}
          >
            {STATUS_LABELS[property.status]}
          </span>
        </div>

        <p className="mt-4 font-display text-2xl text-[#7A1F1F]">
          {formatNaira(property.price_naira)}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-[#1A1A1A]/10 py-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-[#1A1A1A]/50">Bedrooms</dt>
            <dd className="text-sm font-medium text-[#1A1A1A]">
              {property.bedrooms}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#1A1A1A]/50">Bathrooms</dt>
            <dd className="text-sm font-medium text-[#1A1A1A]">
              {property.bathrooms}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#1A1A1A]/50">Size</dt>
            <dd className="text-sm font-medium text-[#1A1A1A]">
              {property.size_sqm ? `${property.size_sqm} sqm` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#1A1A1A]/50">Parking</dt>
            <dd className="text-sm font-medium text-[#1A1A1A]">
              {property.parking_spaces}
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-sm text-[#1A1A1A]/70">
          Title document: {TITLE_DOCUMENT_LABELS[property.title_document]}
        </p>

        {property.description && (
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#1A1A1A]/80">
            {property.description}
          </p>
        )}

        {property.micro_location_note && (
          <p className="mt-4 border border-[#1A1A1A]/10 bg-[#1A1A1A]/5 p-4 text-sm text-[#1A1A1A]/70">
            {property.micro_location_note}
          </p>
        )}

        <div className="mt-8 flex items-center gap-3 border-t border-[#1A1A1A]/10 pt-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1A1A1A] font-display text-sm text-[#FAF9F6]">
            {property.agent_name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-[#1A1A1A]">
              {property.agent_name}
            </p>
            <p className="text-xs text-[#1A1A1A]/50">Listing agent</p>
          </div>
        </div>

        <div className="mt-4">
          <PropertyInquiryLauncher
            property={{
              id: property.id,
              title: property.title,
              agent_name: property.agent_name,
              agent_whatsapp: property.agent_whatsapp,
              price_naira: property.price_naira,
            }}
          />
        </div>
      </main>
    </div>
  );
}
