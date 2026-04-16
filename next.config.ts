import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Next.js NOT to webpack-bundle these packages.
  // @sparticuz/chromium uses import.meta.url to locate its binary .br files —
  // that path breaks when bundled. puppeteer-core must follow.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],

  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
