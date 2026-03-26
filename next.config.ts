import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export" removed for @cloudflare/next-on-pages compatibility with API routes
  images: { unoptimized: true },
};

export default nextConfig;
