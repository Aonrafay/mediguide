import type { NextConfig } from "next";

export default {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The Turbopack build cache writes junction points under .next — Windows
  // (controlled-folder / AV policy) can deny those, failing the whole build.
  // The cache adds nothing here (local builds are one-off, CI/Vercel starts
  // cold), so disable it for builds; dev keeps its cache.
  experimental: {
    turbopackFileSystemCacheForBuild: false,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
} satisfies NextConfig;
