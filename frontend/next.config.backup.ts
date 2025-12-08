import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export", // Cloudflare Pages는 static export 불필요 (자동 처리)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
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
};

export default nextConfig;
