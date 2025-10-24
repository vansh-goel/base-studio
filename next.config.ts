import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  transpilePackages: ['@react-three/fiber', '@react-three/drei'],
};

export default nextConfig;
