import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent ESLint errors from failing production builds; keep dev linting
  eslint: { ignoreDuringBuilds: true },
  
  // Enhanced debugging for development - Simplified for performance
  ...(process.env.NODE_ENV === 'development' && {
    // Remove heavy source maps in favor of default fast ones
    // Keep webpack config minimal for dev speed
  }),
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    localPatterns: [
      {
        pathname: '/api/**',
      },
      {
        pathname: '/uploads/**',
      },
      {
        pathname: '/**',
      },
    ],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
  },
  
  // Compression
  compress: process.env.NODE_ENV === 'production',
  
  // CSS optimization - Production only for better dev performance
  ...(process.env.NODE_ENV === 'production' && {
    experimental: {
      optimizeCss: true,
      cssChunking: 'strict',
    },
  }),
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    webpack: (config: any, { dev, isServer }: any) => {
      // CSS optimization for production
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            styles: {
              name: 'styles',
              test: /\.(css|scss|sass)$/,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };
      return config;
    },
  }),
  
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: "/api/uploads/image?p=uploads/:path*" }];
  },
};

export default nextConfig;



