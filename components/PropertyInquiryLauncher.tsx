"use client";

import { useEffect, useState } from "react";
import { LeadQualificationForm } from "@/components/LeadQualificationForm";
import { trackEvent } from "@/lib/analytics";
import type { Property } from "@/types/database";

interface PropertyInquiryLauncherProps {
  property: Pick<
    Property,
    "id" | "title" | "agent_name" | "agent_whatsapp" | "price_naira"
  >;
}

/**
 * Client-side island that owns the modal open/close state and fires the
 * `property_view` event on mount. Kept as a small separate component so the
 * parent page (app/properties/[slug]/page.tsx) can stay a Server Component —
 * only this interactive slice needs to run on the client.
 */
export function PropertyInquiryLauncher({
  property,
}: PropertyInquiryLauncherProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    trackEvent("property_view", {
      propertyId: property.id,
      propertyTitle: property.title,
      price: property.price_naira,
    });
    // Only fire once per mount — property.id/title/price are stable for the
    // lifetime of this page view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Sticky mobile CTA bar (CORE 01) */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-[#1A1A1A]/10 bg-[#FAF9F6]/95 p-4 backdrop-blur sm:hidden">
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="flex-1 rounded-lg bg-[#7A1F1F] px-4 py-3 text-sm font-medium text-white"
        >
          Inquire via WhatsApp
        </button>
      </div>

      {/* Desktop inline CTA */}
      <button
        type="button"
        onClick={() => setIsFormOpen(true)}
        className="hidden rounded-lg bg-[#7A1F1F] px-6 py-3 text-sm font-medium text-white sm:inline-block"
      >
        Schedule a viewing / Inquire via WhatsApp
      </button>

      {isFormOpen && (
        <LeadQualificationForm
          property={property}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </>
  );
}
