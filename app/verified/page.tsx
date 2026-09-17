import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { CredentialsList } from "@/components/CredentialsList";
import type { BusinessProfile } from "@/types/database";

export const metadata = {
  title: "Verified",
  description: "Registration and accreditation details.",
};

async function getBusinessProfile(): Promise<BusinessProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("business_profile")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("BUSINESS PROFILE QUERY FAILED:", error);
    return null;
  }

  return data;
}

export default async function VerifiedPage() {
  const profile = await getBusinessProfile();

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-[#1A1A1A]/50">
        Verification details aren't available right now.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="flex items-center gap-4">
          {profile.photo_url ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-full">
              <Image
                src={profile.photo_url}
                alt={profile.business_name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1A1A1A] font-display text-lg text-[#FAF9F6]">
              {profile.business_name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-display text-xl text-[#1A1A1A]">
              {profile.business_name}
            </h1>
            <span className="text-xs uppercase tracking-wide text-[#1A1A1A]/50">
              {profile.business_type === "agency"
                ? "Agency"
                : "Individual Agent"}
            </span>
          </div>
        </div>

        {profile.office_address && (
          <p className="mt-4 text-sm text-[#1A1A1A]/70">
            {profile.office_address}
          </p>
        )}

        <h2 className="mt-8 mb-3 text-sm font-medium text-[#1A1A1A]">
          Registrations &amp; accreditations
        </h2>
        <CredentialsList creds={profile.creds} />
      </main>
    </div>
  );
}