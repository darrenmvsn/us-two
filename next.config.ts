import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production runs `.next/standalone/server.js` inside the image built by
  // `deploy/oracle/Dockerfile`, the same shape as DesignLoop's kit.
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  // Share cards read their fonts from disk at request time.
  outputFileTracingIncludes: { "/api/us/**/card": ["./assets/fonts/*.woff"] },
  async headers() {
    return [
      {
        // The service worker that shows nudges: always checked for a new version.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
