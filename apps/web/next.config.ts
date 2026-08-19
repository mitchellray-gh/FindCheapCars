import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'static.cargurus.com' },
      { protocol: 'https', hostname: '**.cargurus.com' },
      { protocol: 'https', hostname: '**.cars.com' },
      { protocol: 'https', hostname: '**.autotrader.com' },
      { protocol: 'https', hostname: '**.carmax.com' },
      { protocol: 'https', hostname: '**.hips.hearstapps.com' },
      { protocol: 'https', hostname: '**.imgix.net' },
    ],
  },
  serverExternalPackages: ['@libsql/client', 'libsql'],
};

export default nextConfig;
