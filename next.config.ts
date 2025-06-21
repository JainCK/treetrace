import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co", // For your placeholder images (if you're using them from here)
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co", // IMPORTANT: This is for your Supabase Storage images
        port: "",
        pathname: "/storage/v1/object/public/**", // Adjust pathname if your bucket is private or different structure
      },
    ],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
