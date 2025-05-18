import type { NextConfig } from "next";

const nextConfig = {
  reactStrictMode: true,
  env: {
    BASE_URL: process.env.BASE_URL,
  }
};

export default nextConfig;
