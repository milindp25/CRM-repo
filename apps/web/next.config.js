/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@hrplatform/database'],
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET
  },
  // Optimize bundle splitting
  experimental: {
    optimizePackageImports: ['lucide-react', '@hrplatform/shared'],
  },
  // Enable compression
  compress: true,
  // Optimize production builds
  poweredByHeader: false,
};

module.exports = nextConfig;
