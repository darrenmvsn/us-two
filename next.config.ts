import type { NextConfig } from "next";

const development = process.env.NODE_ENV === "development";

/**
 * Every page and API answer. The pages load nothing from another origin
 * (bundled fonts, same-origin `/api`, PostHog only from the server), so
 * `'self'` covers them; Next's inline flight scripts need `'unsafe-inline'`
 * without nonces, and nonces would make every static page dynamic (Next's
 * CSP guide). canvas-confetti draws in a worker it starts from a `blob:` URL,
 * and a share card is shown from a `blob:` before it is saved. Framing is
 * refused outright: "End the game" and "Sign out other phones" are two taps.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(development ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // The Oracle kit runs `.next/standalone/server.js` inside the image built by
  // `deploy/oracle/Dockerfile`, the same shape as DesignLoop's kit. Vercel
  // (which sets VERCEL at build) packages functions itself.
  output: process.env.VERCEL ? undefined : "standalone",
  outputFileTracingRoot: process.cwd(),
  // Share cards read their fonts from disk at request time.
  outputFileTracingIncludes: { "/api/us/**/card": ["./assets/fonts/*.woff"], "/api/together/**": ["./assets/fonts/*.woff"] },
  poweredByHeader: false,
  // No page uses next/image; turned off, `/_next/image` no longer fetches and resizes on request.
  images: { unoptimized: true },
  async headers() {
    return [
      { source: "/(.*)", headers: SECURITY_HEADERS },
      {
        // The service worker that shows nudges: always checked for a new version, and may load nothing from elsewhere.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
