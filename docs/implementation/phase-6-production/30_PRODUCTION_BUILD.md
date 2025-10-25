# 30. Production Build Configuration

## Overview

This guide covers optimizing and building the Agentic Marketing Dashboard for production deployment. Focus areas include bundle optimization, environment configuration, static asset handling, source maps, and build analysis.

**Production Considerations:**
- Minimize bundle size (target: <200KB initial JS)
- Optimize images and fonts
- Enable compression (Brotli/Gzip)
- Generate source maps for debugging
- Tree-shake unused code
- Code splitting for optimal loading

## Prerequisites

**Completed Phases:**
- Phase 1-5 (All features implemented)
- Phase 6: Authentication & Authorization (Documents 28-29)

**Dependencies:**
```bash
# Bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Additional optimization tools
npm install --save-dev sharp  # Image optimization
```

## Next.js Production Configuration

### Step 1: Production Config

**File: `agentic-crm-template/next.config.ts`**

```typescript
import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Enable Turbopack for faster builds (Next.js 15+)
  turbopack: {
    // Turbopack-specific optimizations
  },

  // React Compiler (experimental - Next.js 15+)
  experimental: {
    reactCompiler: true,
    // Enable PPR (Partial Prerendering) for better performance
    ppr: true,
    // Optimize package imports
    optimizePackageImports: [
      '@clerk/nextjs',
      'lucide-react',
      'recharts',
      'date-fns',
    ],
  },

  // Output configuration
  output: 'standalone', // For Docker/containerized deployments
  // OR: Leave default for Netlify (uses static export)

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Production-only settings
  ...(process.env.NODE_ENV === 'production' && {
    // Disable dev indicators
    devIndicators: false,

    // Minimize
    swcMinify: true,

    // Generate ETags
    generateEtags: true,

    // Compress output
    compress: true,

    // Strict mode
    reactStrictMode: true,

    // Production source maps
    productionBrowserSourceMaps: true,
  }),

  // Headers for all routes
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
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Rewrites (if needed for API proxying)
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },

  // Webpack customizations (if needed beyond Turbopack)
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Replace React with Preact in production for smaller bundle
      // Uncomment if you want to use Preact (requires additional setup)
      // config.resolve.alias = {
      //   ...config.resolve.alias,
      //   'react': 'preact/compat',
      //   'react-dom': 'preact/compat',
      // };

      // Optimize lodash imports
      config.resolve.alias['lodash'] = 'lodash-es';
    }

    return config;
  },

  // TypeScript configuration
  typescript: {
    // Production: fail build on type errors
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Production: fail build on lint errors
    ignoreDuringBuilds: false,
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  // Environment variables exposed to browser (use NEXT_PUBLIC_ prefix)
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default withBundleAnalyzer(nextConfig);
```

### Step 2: Environment Variables

**File: `agentic-crm-template/.env.production`**

```env
# DO NOT COMMIT THIS FILE - Use for local production builds only
# For actual production, set these in Netlify dashboard

# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.netlify.app
NEXT_PUBLIC_API_URL=https://your-api.onrender.com

# Clerk Authentication (Production Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database (Supabase/Neon)
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Analytics & Monitoring
NEXT_PUBLIC_POSTHOG_KEY=xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_SENTRY_DSN=xxx
SENTRY_AUTH_TOKEN=xxx

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true

# Build Configuration
ANALYZE=false  # Set to 'true' to analyze bundle
```

**File: `agentic-crm-template/.env.local.example`**

```env
# Copy this to .env.local and fill in your values
# Development environment variables

NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:5173
NEXT_PUBLIC_API_URL=http://localhost:8000

# Clerk (Development Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Database (Local)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marketing_dashboard

# Analytics (Development)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_SENTRY_DSN=
```

### Step 3: Build Scripts

**File: `agentic-crm-template/package.json`**

```json
{
  "name": "agentic-crm-template",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "build:analyze": "ANALYZE=true next build",
    "start": "next start",
    "preview": "next build && next start",

    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,md}\"",

    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",

    "pre-commit": "npm run type-check && npm run lint && npm run format:check",
    "pre-build": "npm run pre-commit && npm run test",

    "clean": "rm -rf .next out node_modules/.cache",
    "clean:full": "npm run clean && rm -rf node_modules"
  },
  "dependencies": {
    "@clerk/nextjs": "^5.0.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.10.0",
    "date-fns": "^3.0.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^15.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.3.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^15.0.0",
    "prettier": "^3.0.0",
    "vitest": "^1.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "sharp": "^0.33.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0",
    "tailwindcss": "^3.4.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### Step 4: TypeScript Production Config

**File: `agentic-crm-template/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"]
    },
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", ".next", "out", "dist"]
}
```

## Asset Optimization

### Image Optimization

**File: `agentic-crm-template/src/components/OptimizedImage.tsx`**

```typescript
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}

/**
 * Wrapper around Next.js Image with optimized defaults
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      quality={85} // Balance quality vs size
      placeholder="blur"
      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
```

### Font Optimization

**File: `agentic-crm-template/app/layout.tsx`**

```typescript
import { Inter, JetBrains_Mono } from 'next/font/google';

// Optimize font loading
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  adjustFontFallback: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
  preload: false, // Only preload primary font
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

### CSS Optimization

**File: `agentic-crm-template/tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Production optimizations
  future: {
    hoverOnlyWhenSupported: true, // Prevent hover states on touch devices
  },
  corePlugins: {
    preflight: true,
  },
};

export default config;
```

## Build Optimization Techniques

### 1. Code Splitting

**File: `agentic-crm-template/src/app/dashboard/page.tsx`**

```typescript
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load heavy components
const AnalyticsChart = dynamic(() => import('@/components/charts/AnalyticsChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Don't render on server if not needed
});

const CampaignTable = dynamic(() => import('@/components/tables/CampaignTable'), {
  loading: () => <TableSkeleton />,
});

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1>Dashboard</h1>

      {/* Critical content loads immediately */}
      <MetricsOverview />

      {/* Heavy components load lazily */}
      <Suspense fallback={<ChartSkeleton />}>
        <AnalyticsChart />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <CampaignTable />
      </Suspense>
    </div>
  );
}
```

### 2. Tree Shaking

**File: `agentic-crm-template/src/lib/utils.ts`**

```typescript
// ❌ Bad: Imports entire library
import _ from 'lodash';

// ✅ Good: Import only what you need
import debounce from 'lodash-es/debounce';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tree-shakeable utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 3. Bundle Analysis Script

**File: `agentic-crm-template/scripts/analyze-bundle.sh`**

```bash
#!/bin/bash

echo "🔍 Analyzing production bundle..."

# Build with analyzer
ANALYZE=true npm run build

echo ""
echo "✅ Bundle analysis complete!"
echo "Check .next/analyze/client.html for detailed report"
echo ""
echo "Bundle size targets:"
echo "  - Initial JS: < 200KB"
echo "  - Total JS: < 500KB"
echo "  - CSS: < 50KB"
```

Make executable:
```bash
chmod +x scripts/analyze-bundle.sh
```

## Source Maps Configuration

### Production Source Maps (Sentry)

**File: `agentic-crm-template/next.config.ts`** (addition)

```typescript
// Enable source maps for error tracking
const nextConfig: NextConfig = {
  // ... other config

  productionBrowserSourceMaps: true,

  webpack: (config, { isServer }) => {
    // Upload source maps to Sentry in production
    if (!isServer && process.env.NODE_ENV === 'production') {
      config.devtool = 'hidden-source-map';
    }

    return config;
  },
};
```

**File: `agentic-crm-template/sentry.client.config.ts`**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  debug: false,

  // Upload source maps
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['localhost', /^https:\/\/yourapp\.netlify\.app/],
    }),
  ],

  // Filter out noise
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],

  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },
});
```

## Build Process

### Local Production Build

```bash
# 1. Clean previous builds
npm run clean

# 2. Install dependencies
npm ci  # Use ci for production (faster, deterministic)

# 3. Run type check
npm run type-check

# 4. Run linter
npm run lint

# 5. Run tests
npm run test

# 6. Build for production
npm run build

# 7. Analyze bundle (optional)
npm run build:analyze

# 8. Preview production build locally
npm run preview
```

### Automated Build Script

**File: `agentic-crm-template/scripts/build-production.sh`**

```bash
#!/bin/bash

set -e  # Exit on error

echo "🚀 Starting production build..."
echo ""

# Check Node version
echo "📋 Checking Node.js version..."
node_version=$(node -v)
echo "Node version: $node_version"

if [[ ! "$node_version" =~ ^v(18|20|22) ]]; then
  echo "❌ Error: Node.js 18+ required"
  exit 1
fi

# Clean build
echo ""
echo "🧹 Cleaning previous builds..."
npm run clean

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm ci

# Type check
echo ""
echo "🔍 Running type check..."
npm run type-check

# Lint
echo ""
echo "✨ Running linter..."
npm run lint

# Run tests
echo ""
echo "🧪 Running tests..."
npm run test

# Build
echo ""
echo "🏗️  Building for production..."
npm run build

# Success
echo ""
echo "✅ Production build complete!"
echo ""
echo "Build output: .next/"
echo "To preview: npm run preview"
echo ""

# Show build stats
echo "📊 Build statistics:"
du -sh .next
ls -lh .next/static/chunks/*.js | head -5
```

Make executable:
```bash
chmod +x scripts/build-production.sh
```

## Performance Optimization Checklist

### Critical Rendering Path

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://img.clerk.com" />

        {/* DNS prefetch for subdomains */}
        <link rel="dns-prefetch" href="https://api.yourdomain.com" />

        {/* Preload critical assets */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## Testing Production Build

### 1. Manual Testing

```bash
# Build and run locally
npm run build
npm run preview

# Test checklist:
# ✓ All pages load without errors
# ✓ Authentication works
# ✓ API calls succeed
# ✓ Images load and are optimized
# ✓ Fonts render correctly
# ✓ No console errors
# ✓ Performance acceptable (Lighthouse 90+)
```

### 2. Lighthouse CI

**File: `agentic-crm-template/.lighthouserc.js`**

```javascript
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/', 'http://localhost:3000/dashboard'],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

## Troubleshooting

### Common Build Issues

1. **"Module not found" errors**
   ```bash
   # Clear cache and rebuild
   npm run clean
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Out of memory during build**
   ```bash
   # Increase Node.js memory
   NODE_OPTIONS=--max_old_space_size=4096 npm run build
   ```

3. **TypeScript errors in production**
   ```bash
   # Fix all type errors before building
   npm run type-check
   # Fix issues, then rebuild
   ```

4. **Large bundle size**
   ```bash
   # Analyze bundle
   npm run build:analyze
   # Check for:
   # - Duplicate dependencies
   # - Large libraries that can be lazy-loaded
   # - Unused code
   ```

## Best Practices

1. **Always use `npm ci` in CI/CD** - Faster and deterministic
2. **Enable source maps** - Essential for debugging production errors
3. **Monitor bundle size** - Set alerts for >10% increase
4. **Test production builds locally** - Before deploying
5. **Use environment variables** - Never hardcode secrets
6. **Optimize images** - Use Next.js Image component
7. **Lazy load heavy components** - Reduce initial bundle
8. **Remove console.logs** - Except errors and warnings
9. **Enable compression** - Brotli > Gzip
10. **Cache static assets** - Long cache times for immutable files

## Monitoring Build Performance

### Build Time Tracking

```javascript
// scripts/track-build-time.js
const start = Date.now();

process.on('exit', () => {
  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`\n⏱️  Build completed in ${duration}s`);

  // Alert if build time exceeds threshold
  if (duration > 180) {
    console.warn('⚠️  Warning: Build time exceeded 3 minutes');
  }
});
```

Add to package.json:
```json
{
  "scripts": {
    "build": "node scripts/track-build-time.js && next build"
  }
}
```

## Next Steps

1. **Configure Netlify Deployment (Document 31)** - Deploy frontend
2. **Set up CI/CD** - Automate builds and tests
3. **Implement Performance Monitoring** - Track Core Web Vitals
4. **Create Staging Environment** - Test before production
5. **Set up Preview Deployments** - For pull requests

---

**Production Build Checklist:**
- [ ] next.config.ts optimized
- [ ] Environment variables configured
- [ ] Bundle analyzer installed
- [ ] TypeScript strict mode enabled
- [ ] ESLint configured (no ignored errors)
- [ ] Images optimized (using Next.js Image)
- [ ] Fonts optimized (using next/font)
- [ ] Code splitting implemented
- [ ] Source maps enabled
- [ ] Build scripts tested
- [ ] Production build completes successfully
- [ ] Lighthouse score > 90
- [ ] Bundle size < 200KB (initial)
- [ ] No console errors in production
