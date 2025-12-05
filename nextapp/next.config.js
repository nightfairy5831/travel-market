/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable static page generation to avoid memory issues
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

module.exports = nextConfig;