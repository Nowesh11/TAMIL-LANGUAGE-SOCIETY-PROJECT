import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent ESLint errors from failing production builds; keep dev linting
  eslint: { ignoreDuringBuilds: true },
  
  // Enhanced debugging for development
  ...(process.env.NODE_ENV === 'development' && {
    // Better source maps for debugging
    webpack: (config: any, { dev, isServer }: any) => {
      if (dev) {
        // Enable detailed source maps
        config.devtool = 'eval-source-map';
        
        // Preserve component names in stack traces
        config.optimization = {
          ...config.optimization,
          minimize: false,
        };
        
        // Better error handling
        config.stats = {
          errorDetails: true,
          children: true,
        };
      }
      return config;
    },
    
    // Turbopack specific optimizations for better debugging
    // experimental: {
    //   turbo: {
    //     rules: {
    //       '*.tsx': {
    //         loaders: ['@next/swc-loader'],
    //         as: '*.tsx',
    //       },
    //     },
    //   },
    // },
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
  compress: true,
  
  // CSS optimization
  experimental: {
    optimizeCss: true,
    cssChunking: 'strict',
  },
  
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



