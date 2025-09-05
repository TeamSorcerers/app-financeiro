import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [ "pino" ],
  devIndicators: false,
};

export default nextConfig;
