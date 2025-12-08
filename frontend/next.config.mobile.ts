import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  trailingSlash: true,
  // Exclude admin routes for mobile build
  experimental: {
    // @ts-ignore
    outputFileTracingExcludes: {
      '*': ['./app/admin/**/*'],
    },
  },
};

export default nextConfig;
