/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Media is served from the public S3 media bucket (see design D8).
    // Covers both virtual-hosted-style (<bucket>.s3.<region>.amazonaws.com)
    // and path-style (s3.<region>.amazonaws.com/<bucket>) URLs in eu-central-1.
    remotePatterns: [
      { protocol: "https", hostname: "*.s3.eu-central-1.amazonaws.com" },
      { protocol: "https", hostname: "s3.eu-central-1.amazonaws.com" },
    ],
  },
  // Keep heavy CJS/native packages out of the webpack bundle; require them at
  // runtime instead (avoids bundling-time errors and keeps server chunks small).
  serverExternalPackages: [
    "node-ical",
    // node-ical's runtime dep; externalize it too so it is required from
    // node_modules at runtime rather than bundled.
    "temporal-polyfill",
    "@aws-sdk/client-s3",
    "@aws-sdk/client-cloudfront",
  ],
  // Next's file tracer can't resolve temporal-polyfill's files (its exports
  // map has no main/index.js), so it never reaches the SSR Lambda bundle and
  // node-ical's runtime require fails. Force-copy the whole package into the
  // trace for every route as an escape hatch.
  outputFileTracingIncludes: {
    "**": ["./node_modules/temporal-polyfill/**/*"],
  },
  // Dev only: keep the file watcher from recompiling on transient artifact
  // writes (e.g. Playwright MCP snapshots under .playwright-mcp/). Constant
  // recompiles race the Server Action client-reference manifest and make form
  // submissions silently no-op during browser-driven testing.
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/.playwright-mcp/**",
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
