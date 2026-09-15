import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Plain anon-key client (not the cookie-bound @supabase/ssr one) — sitemap
// generation has no user session to speak of, it's a public data read, so
// the simpler client avoids pulling next/headers' cookies() into a context
// that doesn't need it.
function createSitemapClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
  const supabase = createSitemapClient();

  const { data: properties, error } = await supabase
    .from("properties")
    .select("slug, updated_at")
    .eq("published", true);

  if (error) {
    console.error("SITEMAP QUERY FAILED:", error);
  }

  const propertyEntries: MetadataRoute.Sitemap = (properties ?? []).map(
    (property) => ({
      url: `${baseUrl}/properties/${property.slug}`,
      lastModified: property.updated_at,
      changeFrequency: "daily",
      priority: 0.8,
    })
  );

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...propertyEntries,
  ];
}
