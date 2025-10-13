import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent ESLint errors from failing production builds; keep dev linting
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: "/api/uploads/image?p=uploads/:path*" }];
  },
};

export default nextConfig;



