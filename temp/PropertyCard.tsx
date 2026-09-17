import Link from "next/link";
import Image from "next/image";
import { formatNaira } from "@/lib/formatNaira";
import type { Property } from "@/types/database";

interface PropertyCardProps {
  property: Pick<
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
  >;
}

const STATUS_LABELS: Record<Property["status"], string> = {
  available: "Available",
  under_offer: "Under Offer",
  sold: "Sold",
};

export function PropertyCard({ property }: PropertyCardProps) {
  const coverImage = [...property.media].sort((a, b) => a.order - b.order)[0];

  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group block border border-[#1A1A1A]/10 bg-white transition-colors hover:border-[#B8963E]"
    >
      <div className="relative aspect-[4/3] w-full bg-[#1A1A1A]/5">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={coverImage.alt || property.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[#1A1A1A]/40">
            No photo available
          </div>
        )}
        <span
          className={`absolute left-3 top-3 px-2.5 py-1 text-xs font-medium ${
            property.status === "available"
              ? "bg-[#7A1F1F] text-white"
              : "bg-[#1A1A1A]/80 text-white"
          }`}
        >
          {STATUS_LABELS[property.status]}
        </span>
      </div>

      <div className="border-t border-[#1A1A1A]/10 p-4">
        <p className="font-display text-xl text-[#7A1F1F]">
          {formatNaira(property.price_naira)}
        </p>
        <h3 className="mt-1 truncate text-sm font-medium text-[#1A1A1A]">
          {property.title}
        </h3>
        <p className="mt-1 text-xs text-[#1A1A1A]/60">
          {property.neighborhood ? `${property.neighborhood}, ` : ""}
          {property.city}, {property.state}
        </p>
        <p className="mt-2 text-xs text-[#1A1A1A]/70">
          {property.bedrooms} bed · {property.bathrooms} bath
        </p>
      </div>
    </Link>
  );
}
