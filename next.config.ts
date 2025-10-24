import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
    serverComponentsExternalPackages: ['bls-eth-wasm', '@lighthouse-web3/sdk'],
  },
  transpilePackages: ['@react-three/fiber', '@react-three/drei'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'bls-eth-wasm': 'commonjs bls-eth-wasm',
      });
    }

    // Handle native modules for serverless compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    return config;
  },
};

export default nextConfig;
