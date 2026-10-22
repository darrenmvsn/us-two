import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production runs `.next/standalone/server.js` inside the image built by
  // `deploy/oracle/Dockerfile`, the same shape as DesignLoop's kit.
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
