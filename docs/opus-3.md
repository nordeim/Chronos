# **Root Application Files Implementation**

I'll create these two foundational files with exceptional attention to detail, ensuring they provide a stunning first impression and rock-solid application foundation for our Chronos application.

## **1. `src/app/layout.tsx`**

```tsx
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
```

## **2. `src/app/page.tsx`**

```tsx
// chronos/src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight, 
  Calendar,
  CheckCircle,
  Clock,
  Command,
  Layers,
  LineChart,
  MousePointer,
  Sparkles,
  Star,
  Target,
  Users,
  Zap,
  Play,
  ChevronRight,
  Brain,
  Palette,
  Shield,
  Globe,
  Smartphone,
  BarChart3,
  GitBranch,
  Workflow,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ===================================================================
// Animation Variants
// ===================================================================

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
}

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6, ease: 'easeOut' },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.5, ease: 'easeOut' },
}

// ===================================================================
// Landing Page Component
// ===================================================================

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95])

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
      {/* Animated Background Mesh */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        <motion.div 
          className="absolute inset-0 bg-gradient-radial"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      </div>

      {/* Navigation Header */}
      <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <nav className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold font-display">Chronos</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="btn-gradient">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <motion.section 
        className="relative pt-32 pb-20 px-4"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        <div className="container max-w-6xl mx-auto">
          <motion.div 
            className="text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            {/* Announcement Badge */}
            <motion.div variants={fadeIn} className="mb-8">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Introducing AI-Powered Scheduling
                <ChevronRight className="ml-2 h-3.5 w-3.5" />
              </Badge>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold font-display tracking-tight mb-6"
            >
              Where Time Meets
              <span className="block text-gradient mt-2">Intelligence</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              variants={fadeInUp}
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              Transform the way you manage time with AI-powered scheduling, 
              beautiful task management, and insights that help you achieve more.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/signup">
                <Button size="lg" className="btn-gradient text-lg px-8">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8"
                onClick={() => setIsVideoPlaying(true)}
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              variants={fadeIn}
              className="mt-12 flex flex-wrap justify-center items-center gap-8 text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-warning text-warning" />
                <span className="text-sm font-medium">4.8/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">50K+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span className="text-sm font-medium">SOC 2 Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <span className="text-sm font-medium">Available Worldwide</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Image/Demo */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
            className="mt-16 relative"
          >
            <div className="relative mx-auto max-w-5xl">
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent-purple/10" />
                <Image
                  src="/images/hero-dashboard.png"
                  alt="Chronos Dashboard"
                  width={1920}
                  height={1080}
                  className="w-full h-auto"
                  priority
                  quality={95}
                />
                
                {/* Floating Feature Cards */}
                <motion.div 
                  className="absolute -top-4 -left-4 bg-background rounded-lg shadow-xl p-3 border border-border/50"
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">AI Assistant</span>
                  </div>
                </motion.div>

                <motion.div 
                  className="absolute -top-4 -right-4 bg-background rounded-lg shadow-xl p-3 border border-border/50"
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    delay: 1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-success" />
                    <span className="text-sm font-medium">Focus Mode</span>
                  </div>
                </motion.div>

                <motion.div 
                  className="absolute -bottom-4 -left-4 bg-background rounded-lg shadow-xl p-3 border border-border/50"
                  animate={{
                    y: [0, 10, 0],
                  }}
                  transition={{
                    duration: 3,
                    delay: 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-warning" />
                    <span className="text-sm font-medium">Analytics</span>
                  </div>
                </motion.div>

                <motion.div 
                  className="absolute -bottom-4 -right-4 bg-background rounded-lg shadow-xl p-3 border border-border/50"
                  animate={{
                    y: [0, 10, 0],
                  }}
                  transition={{
                    duration: 3,
                    delay: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-accent-purple" />
                    <span className="text-sm font-medium">Workflows</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
              Everything you need to master your time
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Powerful features designed to help you stay organized, focused, and productive.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'group relative rounded-2xl border bg-background/50 backdrop-blur-sm p-8 hover:shadow-xl transition-all duration-300',
                  activeFeature === index && 'border-primary shadow-lg scale-105',
                )}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={cn(
                  'mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg',
                  feature.color,
                )}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
                <div className="mt-4 flex items-center text-primary font-medium">
                  Learn more
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4">
              How It Works
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
              Get started in minutes
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Three simple steps to transform your productivity
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-20 left-1/3 right-1/3 h-0.5 bg-border" />
            
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">{index + 1}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4">
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
              Loved by thousands worldwide
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See what our users have to say about their experience with Chronos
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border bg-background/50 backdrop-blur-sm p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">{testimonial.content}</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent-purple" />
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <motion.div 
            className="relative rounded-3xl bg-gradient-to-br from-primary/90 via-primary to-accent-purple/90 p-12 text-center text-white overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
                Ready to take control of your time?
              </h2>
              <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                Join thousands of professionals who have transformed their productivity with Chronos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/signup">
                  <Button size="lg" variant="secondary" className="text-lg px-8">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                    View Pricing
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-sm text-white/70">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/changelog" className="hover:text-foreground transition-colors">Changelog</Link></li>
                <li><Link href="/roadmap" className="hover:text-foreground transition-colors">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-foreground transition-colors">API</Link></li>
                <li><Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="/status" className="hover:text-foreground transition-colors">Status</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
                <li><Link href="/security" className="hover:text-foreground transition-colors">Security</Link></li>
                <li><Link href="/gdpr" className="hover:text-foreground transition-colors">GDPR</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-bold font-display">Chronos</span>
              <span className="text-sm text-muted-foreground">© 2024</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link href="https://twitter.com/chronosapp" className="hover:text-foreground transition-colors">Twitter</Link>
              <Link href="https://github.com/nordeim/Chronos" className="hover:text-foreground transition-colors">GitHub</Link>
              <Link href="https://discord.gg/chronos" className="hover:text-foreground transition-colors">Discord</Link>
              <Link href="https://linkedin.com/company/chronosapp" className="hover:text-foreground transition-colors">LinkedIn</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setIsVideoPlaying(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-4xl aspect-video bg-background rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ===================================================================
// Data
// ===================================================================

const features = [
  {
    title: 'Natural Language Input',
    description: 'Simply type or speak what you want to schedule. Our AI understands and creates events instantly.',
    icon: Command,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Smart Scheduling',
    description: 'AI analyzes your patterns and suggests optimal times for tasks and meetings.',
    icon: Brain,
    color: 'bg-accent-purple/10 text-accent-purple',
  },
  {
    title: 'Focus Mode',
    description: 'Block distractions and enter deep work with our Pomodoro timer and ambient sounds.',
    icon: Target,
    color: 'bg-success/10 text-success',
  },
  {
    title: 'Task Management',
    description: 'Organize tasks with Kanban boards, priorities, and dependencies.',
    icon: Layers,
    color: 'bg-warning/10 text-warning',
  },
  {
    title: 'Analytics Dashboard',
    description: 'Visualize your productivity patterns and get actionable insights.',
    icon: LineChart,
    color: 'bg-error/10 text-error',
  },
  {
    title: 'Team Collaboration',
    description: 'Share calendars, assign tasks, and stay in sync with your team.',
    icon: Users,
    color: 'bg-accent-pink/10 text-accent-pink',
  },
]

const steps = [
  {
    title: 'Sign Up',
    description: 'Create your free account in seconds with email or social login.',
  },
  {
    title: 'Import Your Data',
    description: 'Sync with Google Calendar, Outlook, or import your existing tasks.',
  },
  {
    title: 'Start Scheduling',
    description: 'Use natural language to add events and let AI optimize your time.',
  },
]

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Product Manager at TechCorp',
    content: 'Chronos has completely transformed how I manage my time. The AI suggestions are spot-on, and the interface is beautiful.',
  },
  {
    name: 'David Kumar',
    role: 'Freelance Designer',
    content: 'The focus mode is a game-changer. I\'ve increased my deep work sessions by 40% since using Chronos.',
  },
  {
    name: 'Emily Rodriguez',
    role: 'CEO at StartupCo',
    content: 'Finally, a calendar app that understands how I work. The natural language input saves me so much time.',
  },
]
```

---

These two files create an exceptional foundation for the Chronos application:

## **`layout.tsx` Highlights:**
- **Comprehensive metadata** for SEO and social sharing
- **Multiple font configurations** for beautiful typography
- **Security headers** and CSP policies
- **PWA support** with proper meta tags
- **Structured data** for search engines
- **Analytics integration** for tracking
- **Accessibility features** like skip links
- **Performance optimizations** with preconnect/prefetch

## **`page.tsx` Highlights:**
- **Stunning animations** using Framer Motion
- **Compelling hero section** with clear value proposition
- **Interactive features showcase** with auto-rotation
- **Social proof** with testimonials and metrics
- **Beautiful gradients and effects** for visual appeal
- **Responsive design** that works on all devices
- **Video modal** for demo presentation
- **Clear CTAs** to drive conversions

Together, these files create a landing page that not only looks exceptional but also performs excellently, with proper SEO, accessibility, and user experience considerations built in from the ground up.
