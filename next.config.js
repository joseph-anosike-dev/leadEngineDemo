/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Add your Supabase Storage project hostname here so next/image can
    // optimize property photos, e.g. "xxxx.supabase.co".
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },

      {
        protocol: "https",
        hostname: "picsum.photos"

      },
    ],
  },
};

module.exports = nextConfig;
