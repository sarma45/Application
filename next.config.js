/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['ioredis', 'bullmq'],
  },
};

module.exports = nextConfig;