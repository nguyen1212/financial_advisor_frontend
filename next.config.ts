import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  images: {
    // Disable image optimization to respect backend CSP
    unoptimized: true,
  },
  async headers() {
    // Get API base URL from environment variable
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:40000';

    // Extract the origin (domain without path)
    let apiOrigin = apiBaseUrl;
    try {
      const url = new URL(apiBaseUrl);
      apiOrigin = url.origin;
    } catch (e) {
      // If parsing fails, use as-is
      console.warn('Failed to parse API_BASE_URL:', e);
    }

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval and unsafe-inline
              `connect-src 'self' ${apiOrigin}`, // Allow API calls to backend
              "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
              "img-src 'self' https: data: blob:", // Allow images from HTTPS, data URLs, and blobs
              "font-src 'self' data:", // Allow fonts
              "object-src 'none'", // Block plugins
              "base-uri 'self'", // Restrict base tag
              "form-action 'self'", // Restrict form submissions
              "frame-ancestors 'none'", // Prevent clickjacking
              "upgrade-insecure-requests" // Upgrade HTTP to HTTPS
            ].join('; ')
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
