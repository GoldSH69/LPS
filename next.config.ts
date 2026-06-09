import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/LPS',
  images: {
    unoptimized: true,
  },
  /* config options here */
};

export default nextConfig;
