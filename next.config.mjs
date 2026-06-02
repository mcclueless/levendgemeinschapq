/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Media is served from the S3/CloudFront media bucket (see design D8).
    // Remote patterns are added once the bucket/CDN domain is provisioned.
    remotePatterns: [],
  },
  // Keep heavy CJS/native packages out of the webpack bundle; require them at
  // runtime instead (avoids bundling-time errors and keeps server chunks small).
  serverExternalPackages: [
    "node-ical",
    "@aws-sdk/client-s3",
    "@aws-sdk/client-cloudfront",
  ],
};

export default nextConfig;
