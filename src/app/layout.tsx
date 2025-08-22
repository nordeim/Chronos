// chronos/src/app/layout.tsx
import { type Metadata, type Viewport } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import { headers } from 'next/headers'
import { type ReactNode } from 'react'

import { Toaster } from '@/components/ui/toast'
import { TailwindIndicator } from '@/components/shared/tailwind-indicator'
import { Providers } from '@/app/providers'
import { cn } from '@/lib/utils'
import { siteConfig } from '@/config/site'

import '@/app/globals.css'

// ===================================================================
// Font Configuration
// ===================================================================

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
})

const calSans = localFont({
  src: '../../public/fonts/cal-sans.woff2',
  display: 'swap',
  variable: '--font-cal-sans',
  preload: true,
  weight: '600',
})

const monoFont = localFont({
  src: '../../public/fonts/jetbrains-mono.woff2',
  display: 'swap',
  variable: '--font-mono',
  preload: true,
  weight: '400',
})

// ===================================================================
// Metadata Configuration
// ===================================================================

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - Where Time Meets Intelligence`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'calendar',
    'task management',
    'productivity',
    'time management',
    'scheduling',
    'AI assistant',
    'focus timer',
    'pomodoro',
    'team collaboration',
    'project management',
  ],
  authors: [
    {
      name: 'Chronos Team',
      url: siteConfig.url,
    },
  ],
  creator: 'Chronos',
  publisher: 'Chronos',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: `${siteConfig.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
        type: 'image/png',
      },
      {
        url: `${siteConfig.url}/og-image-dark.png`,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
        type: 'image/png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@chronosapp',
    creator: '@chronosapp',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [`${siteConfig.url}/twitter-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#3b82f6',
      },
    ],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: siteConfig.url,
    languages: {
      'en-US': `${siteConfig.url}/en-US`,
      'es-ES': `${siteConfig.url}/es-ES`,
      'fr-FR': `${siteConfig.url}/fr-FR`,
      'de-DE': `${siteConfig.url}/de-DE`,
      'ja-JP': `${siteConfig.url}/ja-JP`,
      'zh-CN': `${siteConfig.url}/zh-CN`,
    },
  },
  category: 'productivity',
  classification: 'productivity',
  referrer: 'origin-when-cross-origin',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteConfig.name,
  },
  applicationName: siteConfig.name,
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': siteConfig.name,
    'application-name': siteConfig.name,
    'msapplication-TileColor': '#3b82f6',
    'msapplication-TileImage': '/mstile-144x144.png',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#ffffff',
    'format-detection': 'telephone=no',
    'twitter:image:alt': `${siteConfig.name} - Where Time Meets Intelligence`,
    'og:image:alt': `${siteConfig.name} - Where Time Meets Intelligence`,
    'og:site_name': siteConfig.name,
    'og:locale:alternate': ['es_ES', 'fr_FR', 'de_DE', 'ja_JP', 'zh_CN'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

// ===================================================================
// Root Layout Component
// ===================================================================

interface RootLayoutProps {
  children: ReactNode
  auth: ReactNode
  dashboard: ReactNode
}

export default function RootLayout({ 
  children,
  auth,
  dashboard,
}: RootLayoutProps) {
  // Get request headers for security context
  const headersList = headers()
  const nonce = headersList.get('x-nonce') || ''

  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={cn(
        'min-h-screen antialiased',
        inter.variable,
        calSans.variable,
        monoFont.variable,
      )}
    >
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://vercel.live" />
        
        {/* DNS Prefetch for performance */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://api.chronos.app" />
        <link rel="dns-prefetch" href="https://cdn.chronos.app" />
        
        {/* Security Headers */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta httpEquiv="Content-Security-Policy" content={`
          default-src 'self';
          script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-scripts.com;
          style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
          font-src 'self' data: https://fonts.gstatic.com;
          img-src 'self' data: blob: https: http:;
          media-src 'self' blob:;
          connect-src 'self' https://*.chronos.app https://*.vercel.app https://*.pusher.com wss://*.pusher.com https://*.supabase.co https://*.sentry.io https://vercel.live;
          frame-src 'self' https:;
          object-src 'none';
          base-uri 'self';
          form-action 'self';
          frame-ancestors 'none';
          upgrade-insecure-requests;
        `.replace(/\n/g, ' ').trim()} />
        
        {/* PWA Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={siteConfig.name} />
        <meta name="application-name" content={siteConfig.name} />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: siteConfig.name,
              description: siteConfig.description,
              url: siteConfig.url,
              applicationCategory: 'ProductivityApplication',
              operatingSystem: 'All',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              author: {
                '@type': 'Organization',
                name: 'Chronos',
                url: siteConfig.url,
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '1234',
              },
            }),
          }}
        />
      </head>
      <body 
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          'selection:bg-primary/20 selection:text-primary-foreground',
        )}
        suppressHydrationWarning
      >
        <Providers>
          {/* Skip to main content for accessibility */}
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Skip to main content
          </a>
          
          {/* Main Application */}
          <div className="relative flex min-h-screen flex-col">
            <main id="main-content" className="flex-1">
              {children}
            </main>
          </div>
          
          {/* Global Components */}
          <Toaster />
          <TailwindIndicator />
        </Providers>
        
        {/* Analytics Scripts (loaded after page) */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Vercel Analytics */}
            <script
              async
              src="https://va.vercel-scripts.com/v1/script.js"
              data-website-id={process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID}
            />
            
            {/* PostHog Analytics */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
                  posthog.init('${process.env.NEXT_PUBLIC_POSTHOG_KEY}',{api_host:'${process.env.NEXT_PUBLIC_POSTHOG_HOST}'})
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  )
}
