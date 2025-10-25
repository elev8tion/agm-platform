import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Core Settings */
  reactStrictMode: true,

  /* Turbopack (default in Next.js 16) */
  // Turbopack is now the default bundler - no configuration needed

  /* Image Optimization */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/7.x/**',
      },
    ],
  },

  /* Environment Variables */
  env: {
    NEXT_PUBLIC_APP_NAME: 'Agentic Marketing Dashboard',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  /* Headers for Security */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  /* Redirects */
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  /* Output Configuration for Netlify */
  output: 'standalone', // Optimized for serverless deployment

  /* Experimental Features (Next.js 16) */
  experimental: {
    // Enable React Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
