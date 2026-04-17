import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't webpack-bundle these packages — @sparticuz/chromium uses
  // import.meta.url to locate its binary .br files, which breaks when bundled.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core", "@prisma/client", "prisma"],

  // Next.js's file tracer only picks up JS imports, so the brotli-compressed
  // chromium binaries under @sparticuz/chromium/bin/ get dropped from the
  // serverless function bundle. Force-include them here.
  outputFileTracingIncludes: {
    "/api/convert": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
