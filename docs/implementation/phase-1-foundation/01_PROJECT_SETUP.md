# Phase 1.1: Frontend Project Setup (Next.js 16)

## Overview

This document guides you through setting up a Next.js 16 project with App Router, Turbopack (default), TypeScript, and Tailwind CSS v4. By the end, you'll have a fully configured frontend ready for development.

**Outcomes:**
- Next.js 16 application with App Router
- TypeScript configured with strict mode
- Tailwind CSS v4 integrated
- Development server running on http://localhost:3000
- Production-ready build configuration

## Prerequisites

**Required Tools:**
- Node.js 18.17 or later (verify: `node -v`)
- npm 9+ or pnpm 8+ (recommended: pnpm)
- Git installed and configured

**Recommended:**
- VS Code with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

## Step-by-Step Instructions

### Step 1: Create Next.js 16 Project

```bash
# Navigate to your project root
cd /Users/kcdacre8tor/agentic-marketing-dashboard

# Create Next.js app with TypeScript, Tailwind, App Router
npx create-next-app@latest agentic-crm-template --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Navigate into the project
cd agentic-crm-template
```

**Interactive Prompts:**
- ✅ Would you like to use TypeScript? **Yes**
- ✅ Would you like to use ESLint? **Yes**
- ✅ Would you like to use Tailwind CSS? **Yes**
- ✅ Would you like to use `src/` directory? **No** (we'll use root-level app/)
- ✅ Would you like to use App Router? **Yes**
- ✅ Would you like to customize the default import alias? **No** (keep @/*)
- ✅ Would you like to use Turbopack? **Yes** (default in Next.js 16)

### Step 2: Install Additional Dependencies

```bash
# UI Components and utilities
pnpm add lucide-react class-variance-authority clsx tailwind-merge
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs
pnpm add @radix-ui/react-toast @radix-ui/react-tooltip @radix-ui/react-avatar

# State management and data fetching
pnpm add zustand swr

# Forms and validation
pnpm add react-hook-form zod @hookform/resolvers

# Charts and visualization
pnpm add recharts

# Date handling
pnpm add date-fns

# Development dependencies
pnpm add -D @types/node @types/react @types/react-dom
pnpm add -D prettier prettier-plugin-tailwindcss
pnpm add -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### Step 3: Configure TypeScript (Strict Mode)

Create or update `tsconfig.json`:

```json
{
  "compilerOptions": {
    /* Base Options */
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,

    /* Strict Type Checking */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,

    /* Emit */
    "noEmit": true,
    "jsx": "preserve",
    "incremental": true,

    /* Module Resolution */
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,

    /* Path Mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },

    /* Next.js Specific */
    "plugins": [
      {
        "name": "next"
      }
    ],
    "skipLibCheck": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

### Step 4: Configure Next.js 16

Create `next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Core Settings */
  reactStrictMode: true,

  /* Turbopack (default in Next.js 16) */
  // Turbopack is now the default bundler - no configuration needed

  /* Image Optimization */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/7.x/**',
      },
    ],
  },

  /* Environment Variables */
  env: {
    NEXT_PUBLIC_APP_NAME: 'Agentic Marketing Dashboard',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  /* Headers for Security */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  /* Redirects */
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  /* Output Configuration for Netlify */
  output: 'standalone', // Optimized for serverless deployment

  /* Experimental Features (Next.js 16) */
  experimental: {
    // Enable React Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
```

### Step 5: Configure Tailwind CSS v4

Create `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  // Content paths for Tailwind to scan
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  // Dark mode configuration
  darkMode: 'class',

  theme: {
    extend: {
      // Custom color palette
      colors: {
        // Brand colors (configurable per industry)
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },

        // UI colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        popover: 'hsl(var(--popover))',
        'popover-foreground': 'hsl(var(--popover-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },

      // Border radius
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      // Custom spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '128': '32rem',
      },

      // Typography
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Courier New', 'monospace'],
      },

      // Animations
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-from-top': {
          from: { transform: 'translateY(-10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-from-bottom': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
      },
    },
  },

  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
```

### Step 6: Configure ESLint

Create `.eslintrc.json`:

```json
{
  "extends": [
    "next/core-web-vitals",
    "next/typescript"
  ],
  "rules": {
    "react/no-unescaped-entities": "off",
    "@next/next/no-img-element": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "warn",
    "no-console": [
      "warn",
      {
        "allow": ["warn", "error"]
      }
    ]
  }
}
```

### Step 7: Configure Prettier

Create `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

Create `.prettierignore`:

```
node_modules
.next
out
public
*.lock
package-lock.json
pnpm-lock.yaml
```

### Step 8: Update package.json Scripts

Update the `scripts` section in `package.json`:

```json
{
  "name": "agentic-crm-template",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "clean": "rm -rf .next node_modules",
    "prepare": "husky install"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    "@radix-ui/react-tooltip": "^1.1.3",
    "@radix-ui/react-avatar": "^1.1.1",
    "lucide-react": "^0.460.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4",
    "zustand": "^5.0.2",
    "swr": "^2.2.5",
    "react-hook-form": "^7.54.0",
    "zod": "^3.23.8",
    "@hookform/resolvers": "^3.9.1",
    "recharts": "^2.14.1",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.1",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.1",
    "typescript": "^5.7.2",
    "eslint": "^9.16.0",
    "eslint-config-next": "^16.0.0",
    "@typescript-eslint/parser": "^8.18.0",
    "@typescript-eslint/eslint-plugin": "^8.18.0",
    "prettier": "^3.4.1",
    "prettier-plugin-tailwindcss": "^0.6.9",
    "tailwindcss": "^3.4.17",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20",
    "@tailwindcss/forms": "^0.5.9",
    "@tailwindcss/typography": "^0.5.15"
  }
}
```

### Step 9: Create Project Structure

```bash
# Create directory structure
mkdir -p app/api
mkdir -p components/ui
mkdir -p components/layout
mkdir -p components/dashboard
mkdir -p components/campaigns
mkdir -p components/content
mkdir -p components/agents
mkdir -p lib/utils
mkdir -p lib/hooks
mkdir -p lib/api
mkdir -p types
mkdir -p config
mkdir -p public/images
mkdir -p public/icons
mkdir -p data/mockData

# Create utility files
touch lib/utils/cn.ts
touch lib/utils/index.ts
touch lib/api/client.ts
touch types/index.ts
touch config/site.ts
```

### Step 10: Create Core Utility Files

**`lib/utils/cn.ts`** (className utility):

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 * @param inputs - Class names or conditional class objects
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**`lib/utils/index.ts`** (re-export utilities):

```typescript
export { cn } from './cn';

/**
 * Format currency with locale-aware formatting
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date with locale-aware formatting
 */
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (format === 'long') {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  }

  return new Intl.DateTimeFormat('en-US').format(d);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

**`lib/api/client.ts`** (API client):

```typescript
/**
 * API Client for backend communication
 * Handles authentication, error handling, and request formatting
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  token?: string;
}

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Make authenticated API request
 */
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new APIError(
      errorData.message || 'API request failed',
      response.status,
      errorData
    );
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export { APIError };
```

**`config/site.ts`** (site configuration):

```typescript
export const siteConfig = {
  name: 'Agentic Marketing Dashboard',
  description: 'AI-powered marketing command center with autonomous agents',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  links: {
    github: 'https://github.com/yourusername/agentic-marketing-dashboard',
  },
};
```

**`types/index.ts`** (TypeScript types):

```typescript
/**
 * Core type definitions for the application
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  startDate: string;
  endDate?: string;
  metrics: CampaignMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  roi: number;
}

export interface ContentAsset {
  id: string;
  title: string;
  type: 'blog' | 'email' | 'social' | 'video';
  status: 'draft' | 'review' | 'published';
  content: string;
  metadata: Record<string, unknown>;
  agentId?: string;
  campaignId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  type: 'seo_writer' | 'email_marketer' | 'social_media' | 'analyst';
  status: 'idle' | 'working' | 'error';
  currentTask?: string;
  completedTasks: number;
  createdAt: string;
}

export interface AgentJob {
  id: string;
  agentId: string;
  type: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  createdAt: string;
}
```

### Step 11: Update Global CSS

Update `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Background colors */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    /* Card colors */
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    /* Popover colors */
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    /* Primary colors */
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;

    /* Secondary colors */
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    /* Muted colors */
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    /* Accent colors */
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    /* Destructive colors */
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    /* Border and input */
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;

    /* Border radius */
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    @apply w-2 h-2;
  }

  ::-webkit-scrollbar-track {
    @apply bg-muted;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-muted-foreground/30 rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground/50;
  }
}

@layer utilities {
  /* Custom utility classes */
  .text-balance {
    text-wrap: balance;
  }

  .text-pretty {
    text-wrap: pretty;
  }
}
```

### Step 12: Create Root Layout

Update `app/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'Agentic Marketing Dashboard',
    template: '%s | Agentic Marketing Dashboard',
  },
  description: 'AI-powered marketing command center with autonomous agents',
  keywords: ['AI', 'Marketing', 'Automation', 'Agents', 'CRM'],
  authors: [{ name: 'Your Name' }],
  creator: 'Your Name',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'Agentic Marketing Dashboard',
    description: 'AI-powered marketing command center with autonomous agents',
    siteName: 'Agentic Marketing Dashboard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentic Marketing Dashboard',
    description: 'AI-powered marketing command center with autonomous agents',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen font-sans antialiased', inter.variable)}>
        {children}
      </body>
    </html>
  );
}
```

### Step 13: Create Home Page

Update `app/page.tsx`:

```typescript
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full space-y-8 text-center">
        <h1 className="text-6xl font-bold tracking-tight">
          Agentic Marketing Dashboard
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          AI-powered marketing command center with autonomous agents for content creation,
          campaign management, and performance optimization.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>

          <Link
            href="/docs"
            className="rounded-lg border border-input bg-background px-6 py-3 font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Documentation
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="rounded-lg border bg-card p-6 space-y-2">
            <h3 className="text-xl font-semibold">AI Agents</h3>
            <p className="text-sm text-muted-foreground">
              Autonomous marketing employees that write content, manage campaigns, and optimize performance.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 space-y-2">
            <h3 className="text-xl font-semibold">Real-time Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              Monitor campaigns, content creation, and agent activity in a unified command center.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 space-y-2">
            <h3 className="text-xl font-semibold">Budget Control</h3>
            <p className="text-sm text-muted-foreground">
              Track API costs, set spending limits, and optimize resource allocation automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 14: Create .gitignore

Create `.gitignore`:

```
# Dependencies
node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Environment variables
.env
.env*.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Local env files
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# Typescript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.idea
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
```

## Verification

### Step 1: Type Check

```bash
pnpm run type-check
```

**Expected output:** `No errors found.`

### Step 2: Lint Check

```bash
pnpm run lint
```

**Expected output:** `No linting errors found.`

### Step 3: Start Development Server

```bash
pnpm run dev
```

**Expected output:**
```
▲ Next.js 16.0.0
- Local:        http://localhost:3000
- Turbopack (experimental) enabled

✓ Ready in 1.2s
```

### Step 4: Visit Application

1. Open browser to http://localhost:3000
2. You should see the home page with:
   - "Agentic Marketing Dashboard" heading
   - Description text
   - "Get Started" and "Documentation" buttons
   - Three feature cards

### Step 5: Test Build

```bash
pnpm run build
```

**Expected output:**
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB          87 kB
└ ○ /api/hello                           0 B                0 B
```

## Troubleshooting

### Issue: "Module not found" errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
```

### Issue: TypeScript errors about missing types

**Solution:**
```bash
# Install missing type definitions
pnpm add -D @types/node @types/react @types/react-dom
```

### Issue: Tailwind classes not applying

**Solution:**
1. Verify `tailwind.config.ts` content paths include your files
2. Restart dev server: `Ctrl+C` then `pnpm run dev`
3. Clear `.next` cache: `rm -rf .next`

### Issue: Turbopack not working

**Solution:**
- Next.js 16 uses Turbopack by default
- If issues occur, you can disable it temporarily: `next dev` (without --turbo flag)
- Check Node.js version: `node -v` (must be 18.17+)

### Issue: Port 3000 already in use

**Solution:**
```bash
# Use different port
PORT=3001 pnpm run dev

# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Issue: Prettier conflicts with ESLint

**Solution:**
```bash
# Run format then lint
pnpm run format
pnpm run lint:fix
```

## Next Steps

✅ **Phase 1.1 Complete!** You now have a fully configured Next.js 16 frontend.

**Continue to:**
- [02_BACKEND_SETUP.md](./02_BACKEND_SETUP.md) - Set up FastAPI backend
- [03_DATABASE_SCHEMA.md](./03_DATABASE_SCHEMA.md) - Configure PostgreSQL database
- [04_ENVIRONMENT_CONFIG.md](./04_ENVIRONMENT_CONFIG.md) - Set up environment variables

**Good to know:**
- Always run `pnpm run type-check` before committing code
- Use `pnpm run format` to auto-format code before pushing
- Turbopack makes dev server startup 10x faster than Webpack
- Next.js 16's App Router uses async params by default
- Server Actions are enabled and ready to use
