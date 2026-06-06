import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Required for @mysten/dapp-kit server component compatibility
  },
  // Allow Walrus aggregator images if any
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aggregator.walrus-testnet.walrus.space",
      },
    ],
  },
};

export default nextConfig;
