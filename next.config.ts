import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Node-only / worker-based libraries outside the bundler so they load
  // straight from node_modules. pdfjs-dist must be external for pdf-parse to
  // resolve its own .mjs worker (webpack/Turbopack cannot bundle it).
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "mammoth"],
  // Allow the live-preview host (the dev server is proxied in the sandbox).
  // In a normal local setup this is unnecessary and can be removed.
  allowedDevOrigins: [
    "e2b.app",
    "*.e2b.app",
    "3000-*.e2b.app",
  ],
};

export default nextConfig;
