// chronos/next.config.mjs
import { createRequire } from 'module'
import bundleAnalyzer from '@next/bundle-analyzer'

const require = createRequire(import.meta.url)

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React configuration
  reactStrictMode: true,
  
  // Experimental features for Next.js 15
  experimental: {
    reactCompiler: true,
    ppr: true, // Partial Pre-Rendering
    taint: true,
    typedRoutes: true,
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB', 'INP'],
    optimizePackageImports: [
      '@radix-ui/react-*',
      'lucide-react',
      'date-fns',
      'framer-motion',
      '@tanstack/react-query',
      'recharts',
    ],
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3000', 'chronos.app', '*.chronos.app'],
    },
  },

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn', 'info'] }
      : false,
  },

  // Styling
  sassOptions: {
    includePaths: ['./src/styles'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development'
              ? "default-src 'self' 'unsafe-eval' 'unsafe-inline' * data: blob:;"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.pusher.com wss://*.pusher.com https://*.vercel.app https://vercel.live https://*.supabase.co https://*.sentry.io; frame-src 'self' https:;",
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, immutable, max-age=31536000',
          },
        ],
      },
    ]
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/app',
        destination: '/calendar',
        permanent: false,
      },
      {
        source: '/signin',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/signup',
        permanent: true,
      },
    ]
  },

  // Rewrites for API proxying
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    }
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'chronos-assets.s3.amazonaws.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Internationalization (future feature)
  i18n: {
    locales: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
    defaultLocale: 'en',
    localeDetection: true,
  },

  // Output configuration
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  
  // Build configuration
  productionBrowserSourceMaps: false,
  swcMinify: true,
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
    '@radix-ui': {
      transform: '@radix-ui/react-{{member}}',
    },
  },

  // TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Optimization for production
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-sync-external-store)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module) {
              return module.size() > 160000 &&
                /node_modules[/\```/.test(module.identifier())
            },
            name(module) {
              const hash = require('crypto')
                .createHash('sha1')
                .update(module.identifier())
                .digest('hex')
              return `lib-${hash.substring(0, 8)}`
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name(module, chunks) {
              const hash = require('crypto')
                .createHash('sha1')
                .update(chunks.map(c => c.name).join('_'))
                .digest('hex')
              return `shared-${hash.substring(0, 8)}`
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
        maxAsyncRequests: 30,
        maxInitialRequests: 25,
        enforceSizeThreshold: 50000,
      }
    }

    // SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    // Aliases (backup for TypeScript paths)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
    }

    return config
  },

  // Environment variables to expose to the browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    NEXT_PUBLIC_ENVIRONMENT: process.env.NODE_ENV,
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  // Telemetry
  telemetry: false,
}

export default withBundleAnalyzer(nextConfig)
