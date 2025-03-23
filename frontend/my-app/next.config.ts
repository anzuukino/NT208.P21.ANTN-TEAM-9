import type { NextConfig } from "next";

const nextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
