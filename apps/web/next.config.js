/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@hrplatform/database'],
  // SECURITY: Never expose server secrets via env: {} block.
  // DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY are available server-side
  // via process.env automatically from .env.local — no need to expose them here.
  // Only NEXT_PUBLIC_* variables should be client-accessible.

  // Optimize bundle splitting
  experimental: {
    optimizePackageImports: ['lucide-react', '@hrplatform/shared', 'recharts', 'date-fns'],
  },
  // Enable compression
  compress: true,
  // Optimize production builds
  poweredByHeader: false,
  // Proxy API requests to backend (enables preview/testing when browser can't reach API port directly)
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: 'http://localhost:4000/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
