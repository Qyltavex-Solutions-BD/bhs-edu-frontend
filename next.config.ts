import type { NextConfig } from 'next';
import path from 'path';

const rootDir = path.resolve(process.cwd());

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      '@': rootDir,
    },
  },
  webpack: (config) => {
    config.resolve.alias['@'] = rootDir;
    return config;
  },
};

export default nextConfig;
