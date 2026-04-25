/** @type {import('next').NextConfig} */
const BUILD_ID = Date.now().toString();

const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_BUILD_ID: BUILD_ID,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
