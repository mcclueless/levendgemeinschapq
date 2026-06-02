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
    // node-ical's runtime dep; externalize it too so it is copied into the
    // SSR Lambda bundle (its exports map otherwise trips Next's file tracer,
    // causing "Cannot find module 'temporal-polyfill'" at runtime).
    "temporal-polyfill",
    "@aws-sdk/client-s3",
    "@aws-sdk/client-cloudfront",
  ],
};

export default nextConfig;
