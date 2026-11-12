import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/**/*": ["./data/**/*"],
  },
  allowedDevOrigins: ['192.168.1.59']
};

export default nextConfig;
