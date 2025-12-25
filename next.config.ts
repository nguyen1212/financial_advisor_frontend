import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  images: {
    // Disable image optimization to respect backend CSP
    unoptimized: true,
  },
};

export default nextConfig;
