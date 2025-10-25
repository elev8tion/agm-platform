# Styling Guide

## Overview

This document defines the complete styling system for the Agentic Marketing Dashboard using Tailwind CSS v4. It includes design tokens, component patterns, responsive design, dark mode, animations, and best practices for consistent, maintainable styles.

## Guiding Principles

1. **Design Tokens First**: All colors, spacing, typography from tokens
2. **Mobile-First**: Build for mobile, enhance for desktop
3. **Utility-First**: Use Tailwind utilities, avoid custom CSS
4. **Consistency**: Reuse patterns, avoid one-off styles
5. **Accessibility**: Maintain contrast ratios, visible focus states
6. **Performance**: Minimize CSS bundle, use PurgeCSS
7. **Dark Mode**: Support light and dark themes

## Tailwind CSS v4 Configuration

### Installation

```bash
npm install tailwindcss@next @tailwindcss/typography @tailwindcss/forms
```

### Configuration File

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'
import forms from '@tailwindcss/forms'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: {
            50: '#eef2ff',
            100: '#e0e7ff',
            200: '#c7d2fe',
            300: '#a5b4fc',
            400: '#818cf8',
            500: '#6366f1', // Main brand color
            600: '#4f46e5',
            700: '#4338ca',
            800: '#3730a3',
            900: '#312e81',
            950: '#1e1b4b',
          },
          secondary: {
            50: '#faf5ff',
            100: '#f3e8ff',
            200: '#e9d5ff',
            300: '#d8b4fe',
            400: '#c084fc',
            500: '#a855f7', // Secondary brand color
            600: '#9333ea',
            700: '#7e22ce',
            800: '#6b21a8',
            900: '#581c87',
            950: '#3b0764',
          },
        },
        status: {
          success: {
            50: '#f0fdf4',
            100: '#dcfce7',
            500: '#10b981',
            700: '#047857',
          },
          warning: {
            50: '#fffbeb',
            100: '#fef3c7',
            500: '#f59e0b',
            700: '#b45309',
          },
          error: {
            50: '#fef2f2',
            100: '#fee2e2',
            500: '#ef4444',
            700: '#b91c1c',
          },
          info: {
            50: '#eff6ff',
            100: '#dbeafe',
            500: '#3b82f6',
            700: '#1d4ed8',
          },
        },
        content: {
          research: '#8b5cf6', // Purple 500
          draft: '#3b82f6', // Blue 500
          polish: '#f59e0b', // Amber 500
          published: '#10b981', // Green 500
        },
        agent: {
          strategist: '#8b5cf6', // Purple 500
          writer: '#3b82f6', // Blue 500
          marketer: '#f59e0b', // Amber 500
          social: '#ec4899', // Pink 500
          analytics: '#10b981', // Green 500
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-lg': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-sm': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'heading-xl': ['2.25rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'heading-lg': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'heading-md': ['1.5rem', { lineHeight: '1.35', letterSpacing: '-0.005em' }],
        'heading-sm': ['1.25rem', { lineHeight: '1.4' }],
        'heading-xs': ['1.125rem', { lineHeight: '1.45' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body-md': ['1rem', { lineHeight: '1.5' }],
        'body-sm': ['0.875rem', { lineHeight: '1.45' }],
        'caption': ['0.75rem', { lineHeight: '1.4' }],
      },
      spacing: {
        '0.5': '0.125rem', // 2px
        '1': '0.25rem', // 4px
        '1.5': '0.375rem', // 6px
        '2': '0.5rem', // 8px
        '2.5': '0.625rem', // 10px
        '3': '0.75rem', // 12px
        '3.5': '0.875rem', // 14px
        '4': '1rem', // 16px
        '5': '1.25rem', // 20px
        '6': '1.5rem', // 24px
        '7': '1.75rem', // 28px
        '8': '2rem', // 32px
        '9': '2.25rem', // 36px
        '10': '2.5rem', // 40px
        '12': '3rem', // 48px
        '14': '3.5rem', // 56px
        '16': '4rem', // 64px
        '20': '5rem', // 80px
        '24': '6rem', // 96px
      },
      borderRadius: {
        'none': '0',
        'sm': '0.25rem', // 4px
        'DEFAULT': '0.5rem', // 8px
        'md': '0.5rem', // 8px
        'lg': '0.75rem', // 12px
        'xl': '1rem', // 16px
        '2xl': '1.5rem', // 24px
        'full': '9999px',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'DEFAULT': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'md': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'lg': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        'xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      },
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
      },
    },
  },
  plugins: [typography, forms],
}

export default config
```

## Design Tokens

### Color System

```typescript
// styles/tokens.css
@layer base {
  :root {
    /* Brand Colors */
    --color-brand-primary: 99 102 241; /* #6366f1 */
    --color-brand-secondary: 168 85 247; /* #a855f7 */

    /* Status Colors */
    --color-success: 16 185 129; /* #10b981 */
    --color-warning: 245 158 11; /* #f59e0b */
    --color-error: 239 68 68; /* #ef4444 */
    --color-info: 59 130 246; /* #3b82f6 */

    /* Content Stage Colors */
    --color-research: 139 92 246; /* #8b5cf6 */
    --color-draft: 59 130 246; /* #3b82f6 */
    --color-polish: 245 158 11; /* #f59e0b */
    --color-published: 16 185 129; /* #10b981 */

    /* Agent Type Colors */
    --color-strategist: 139 92 246; /* #8b5cf6 */
    --color-writer: 59 130 246; /* #3b82f6 */
    --color-marketer: 245 158 11; /* #f59e0b */
    --color-social: 236 72 153; /* #ec4899 */
    --color-analytics: 16 185 129; /* #10b981 */

    /* Neutral Colors */
    --color-gray-50: 249 250 251;
    --color-gray-100: 243 244 246;
    --color-gray-200: 229 231 235;
    --color-gray-300: 209 213 219;
    --color-gray-400: 156 163 175;
    --color-gray-500: 107 114 128;
    --color-gray-600: 75 85 99;
    --color-gray-700: 55 65 81;
    --color-gray-800: 31 41 55;
    --color-gray-900: 17 24 39;
    --color-gray-950: 3 7 18;

    /* Background Colors */
    --color-bg-primary: 255 255 255;
    --color-bg-secondary: 249 250 251;
    --color-bg-tertiary: 243 244 246;

    /* Text Colors */
    --color-text-primary: 17 24 39;
    --color-text-secondary: 55 65 81;
    --color-text-tertiary: 107 114 128;

    /* Border Colors */
    --color-border-primary: 229 231 235;
    --color-border-secondary: 209 213 219;
  }

  .dark {
    /* Background Colors */
    --color-bg-primary: 17 24 39;
    --color-bg-secondary: 31 41 55;
    --color-bg-tertiary: 55 65 81;

    /* Text Colors */
    --color-text-primary: 249 250 251;
    --color-text-secondary: 229 231 235;
    --color-text-tertiary: 156 163 175;

    /* Border Colors */
    --color-border-primary: 55 65 81;
    --color-border-secondary: 75 85 99;
  }
}
```

### Typography Scale

```css
/* styles/tokens.css */
@layer base {
  /* Display */
  .text-display-lg {
    font-size: 4.5rem;
    line-height: 1.1;
    letter-spacing: -0.02em;
    font-weight: 700;
  }

  .text-display-md {
    font-size: 3.75rem;
    line-height: 1.1;
    letter-spacing: -0.02em;
    font-weight: 700;
  }

  .text-display-sm {
    font-size: 3rem;
    line-height: 1.2;
    letter-spacing: -0.01em;
    font-weight: 700;
  }

  /* Headings */
  .text-heading-xl {
    font-size: 2.25rem;
    line-height: 1.25;
    letter-spacing: -0.01em;
    font-weight: 600;
  }

  .text-heading-lg {
    font-size: 1.875rem;
    line-height: 1.3;
    letter-spacing: -0.01em;
    font-weight: 600;
  }

  .text-heading-md {
    font-size: 1.5rem;
    line-height: 1.35;
    letter-spacing: -0.005em;
    font-weight: 600;
  }

  .text-heading-sm {
    font-size: 1.25rem;
    line-height: 1.4;
    font-weight: 600;
  }

  .text-heading-xs {
    font-size: 1.125rem;
    line-height: 1.45;
    font-weight: 600;
  }

  /* Body */
  .text-body-lg {
    font-size: 1.125rem;
    line-height: 1.6;
    font-weight: 400;
  }

  .text-body-md {
    font-size: 1rem;
    line-height: 1.5;
    font-weight: 400;
  }

  .text-body-sm {
    font-size: 0.875rem;
    line-height: 1.45;
    font-weight: 400;
  }

  .text-caption {
    font-size: 0.75rem;
    line-height: 1.4;
    font-weight: 400;
  }
}
```

### Spacing Scale (4px Grid)

```typescript
// 4px base grid
const spacing = {
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
}
```

## Component Styling Patterns

### Button Variants

```typescript
// components/ui/Button.tsx
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        // Variants
        {
          'bg-brand-primary-500 text-white hover:bg-brand-primary-600 focus-visible:ring-brand-primary-500':
            variant === 'primary',
          'bg-brand-secondary-500 text-white hover:bg-brand-secondary-600 focus-visible:ring-brand-secondary-500':
            variant === 'secondary',
          'border-2 border-gray-300 bg-transparent hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800':
            variant === 'outline',
          'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800':
            variant === 'ghost',
          'bg-status-error-500 text-white hover:bg-status-error-600 focus-visible:ring-status-error-500':
            variant === 'danger',
        },
        // Sizes
        {
          'h-8 px-3 text-body-sm rounded-md': size === 'sm',
          'h-10 px-4 text-body-md rounded-lg': size === 'md',
          'h-12 px-6 text-body-lg rounded-lg': size === 'lg',
        },
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  )
}
```

### Card Component

```typescript
// components/ui/Card.tsx
import { cn } from '@/lib/utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg',
        // Variants
        {
          'bg-white dark:bg-gray-800 shadow-sm': variant === 'default',
          'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700':
            variant === 'bordered',
          'bg-white dark:bg-gray-800 shadow-lg': variant === 'elevated',
        },
        // Padding
        {
          'p-0': padding === 'none',
          'p-4': padding === 'sm',
          'p-6': padding === 'md',
          'p-8': padding === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
```

### Badge Component

```typescript
// components/ui/Badge.tsx
import { cn } from '@/lib/utils/cn'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        // Variants
        {
          'bg-status-success-50 text-status-success-700 dark:bg-status-success-900/20 dark:text-status-success-400':
            variant === 'success',
          'bg-status-warning-50 text-status-warning-700 dark:bg-status-warning-900/20 dark:text-status-warning-400':
            variant === 'warning',
          'bg-status-error-50 text-status-error-700 dark:bg-status-error-900/20 dark:text-status-error-400':
            variant === 'error',
          'bg-status-info-50 text-status-info-700 dark:bg-status-info-900/20 dark:text-status-info-400':
            variant === 'info',
          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300':
            variant === 'neutral',
        },
        // Sizes
        {
          'px-2 py-0.5 text-caption': size === 'sm',
          'px-2.5 py-1 text-body-sm': size === 'md',
          'px-3 py-1.5 text-body-md': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
```

## Responsive Design Breakpoints

```typescript
// Breakpoints
const breakpoints = {
  mobile: '640px', // sm
  tablet: '768px', // md
  desktop: '1024px', // lg
  wide: '1280px', // xl
  ultrawide: '1536px', // 2xl
}

// Usage in Tailwind
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {/* Responsive grid */}
</div>

// Mobile-first approach
<div className="p-4 md:p-6 lg:p-8">
  {/* Padding increases on larger screens */}
</div>
```

### Responsive Patterns

```tsx
// Responsive Navigation
<nav className="flex flex-col md:flex-row gap-4 md:gap-6">
  <a href="/agents">Agents</a>
  <a href="/campaigns">Campaigns</a>
  <a href="/content">Content</a>
</nav>

// Responsive Typography
<h1 className="text-heading-md md:text-heading-lg lg:text-heading-xl">
  Dashboard
</h1>

// Responsive Layout
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <aside className="lg:col-span-3">Sidebar</aside>
  <main className="lg:col-span-9">Content</main>
</div>

// Show/Hide on Breakpoints
<div className="hidden md:block">Desktop Only</div>
<div className="block md:hidden">Mobile Only</div>
```

## Dark Mode Implementation

### Theme Provider

```typescript
// components/providers/ThemeProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
```

### Dark Mode Utilities

```tsx
// Dark mode color classes
<div className="bg-white dark:bg-gray-900">
  <h1 className="text-gray-900 dark:text-white">Title</h1>
  <p className="text-gray-600 dark:text-gray-300">Description</p>
</div>

// Dark mode borders
<div className="border border-gray-200 dark:border-gray-700">
  Content
</div>

// Dark mode hover states
<button className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
  Click Me
</button>
```

## Animation and Transition Guidelines

### Transition Utilities

```css
/* styles/globals.css */
@layer utilities {
  .transition-default {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }

  .transition-colors {
    transition-property: color, background-color, border-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }

  .transition-transform {
    transition-property: transform;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }
}
```

### Animation Examples

```tsx
// Fade in animation
<div className="animate-in fade-in duration-300">
  Content fades in
</div>

// Slide in from bottom
<div className="animate-in slide-in-from-bottom-4 duration-500">
  Content slides up
</div>

// Spin animation
<div className="animate-spin">
  <Spinner />
</div>

// Pulse animation
<div className="animate-pulse">
  <Skeleton />
</div>

// Custom transition
<button className="transform hover:scale-105 transition-transform duration-200">
  Hover to scale
</button>
```

### Custom Animations

```typescript
// tailwind.config.ts
theme: {
  extend: {
    keyframes: {
      'slide-in': {
        '0%': { transform: 'translateY(100%)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      'slide-out': {
        '0%': { transform: 'translateY(0)', opacity: '1' },
        '100%': { transform: 'translateY(100%)', opacity: '0' },
      },
      'fade-in': {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      'bounce-in': {
        '0%': { transform: 'scale(0.3)', opacity: '0' },
        '50%': { transform: 'scale(1.05)' },
        '70%': { transform: 'scale(0.9)' },
        '100%': { transform: 'scale(1)', opacity: '1' },
      },
    },
    animation: {
      'slide-in': 'slide-in 0.3s ease-out',
      'slide-out': 'slide-out 0.3s ease-in',
      'fade-in': 'fade-in 0.2s ease-out',
      'bounce-in': 'bounce-in 0.5s ease-out',
    },
  },
}
```

## Best Practices

### Do's

1. Use Tailwind utilities first, custom CSS only when necessary
2. Follow mobile-first responsive design
3. Use design tokens for all colors, spacing, typography
4. Maintain 4.5:1 contrast ratio for text
5. Use semantic color names (success, warning, error)
6. Implement dark mode for all components
7. Use transitions for interactive elements
8. Keep class names ordered (layout → typography → colors → effects)
9. Use `cn()` utility for conditional classes
10. Extract repeated patterns into components

### Don'ts

1. Don't use arbitrary values (`p-[13px]`) without good reason
2. Don't mix custom CSS and Tailwind classes
3. Don't use `!important` (use proper specificity)
4. Don't create one-off color values
5. Don't ignore dark mode
6. Don't use inline styles
7. Don't forget focus states for accessibility
8. Don't use generic class names (.container, .wrapper)
9. Don't create unused utilities
10. Don't forget to purge unused CSS in production

## Common Patterns

### Content Status Colors

```tsx
// components/content/ContentStatusBadge.tsx
import { Badge } from '@/components/ui/Badge'

const statusConfig = {
  research: { color: 'bg-content-research', label: 'Research' },
  draft: { color: 'bg-content-draft', label: 'Draft' },
  polish: { color: 'bg-content-polish', label: 'Polish' },
  published: { color: 'bg-content-published', label: 'Published' },
}

export function ContentStatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const config = statusConfig[status]
  return (
    <Badge className={`${config.color} text-white`}>
      {config.label}
    </Badge>
  )
}
```

### Agent Type Colors

```tsx
// components/agents/AgentCard.tsx
const agentColors = {
  strategist: 'border-l-agent-strategist',
  writer: 'border-l-agent-writer',
  marketer: 'border-l-agent-marketer',
  social: 'border-l-agent-social',
  analytics: 'border-l-agent-analytics',
}

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Card className={`border-l-4 ${agentColors[agent.type]}`}>
      {/* Card content */}
    </Card>
  )
}
```

### Loading Skeleton

```tsx
// components/ui/Skeleton.tsx
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
      {...props}
    />
  )
}

// Usage
<div className="space-y-4">
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-32 w-full" />
  <Skeleton className="h-8 w-3/4" />
</div>
```

## Anti-Patterns

### Avoid Magic Numbers

```tsx
// ❌ Bad - arbitrary values without context
<div className="p-[17px] mt-[23px]">Content</div>

// ✅ Good - use spacing scale
<div className="p-4 mt-6">Content</div>
```

### Avoid Mixing Approaches

```tsx
// ❌ Bad - mixing inline styles and Tailwind
<div className="p-4 bg-blue-500" style={{ marginTop: '20px' }}>
  Content
</div>

// ✅ Good - all Tailwind
<div className="p-4 mt-5 bg-blue-500">
  Content
</div>
```

### Avoid Repetition

```tsx
// ❌ Bad - repeated class strings
<div className="p-4 bg-white rounded-lg shadow-sm">Card 1</div>
<div className="p-4 bg-white rounded-lg shadow-sm">Card 2</div>
<div className="p-4 bg-white rounded-lg shadow-sm">Card 3</div>

// ✅ Good - extract to component
function Card({ children }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      {children}
    </div>
  )
}
```

## Tools and Utilities

### Class Name Utility

```typescript
// lib/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage
<div className={cn(
  'p-4 rounded-lg',
  isActive && 'bg-blue-500',
  isDisabled && 'opacity-50 pointer-events-none'
)}>
  Content
</div>
```

### VS Code Extensions

- **Tailwind CSS IntelliSense** - Autocomplete, linting, hover previews
- **Headwind** - Class sorting
- **PostCSS Language Support** - Syntax highlighting

## Checklists

### New Component Checklist

- [ ] Uses Tailwind utilities (no custom CSS)
- [ ] Follows design token system
- [ ] Supports dark mode
- [ ] Responsive on all breakpoints
- [ ] Has proper focus states
- [ ] Uses `cn()` for conditional classes
- [ ] Maintains 4.5:1 contrast ratio
- [ ] Includes loading/disabled states
- [ ] Uses semantic color names
- [ ] Follows spacing scale (4px grid)

### Accessibility Checklist

- [ ] Minimum 4.5:1 contrast for text
- [ ] Visible focus indicators
- [ ] No color-only information
- [ ] Sufficient touch target size (44x44px)
- [ ] Motion respects `prefers-reduced-motion`

## References

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS v4 Alpha](https://tailwindcss.com/blog/tailwindcss-v4-alpha)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Material Design Color System](https://m3.material.io/styles/color/system/overview)
- [Refactoring UI](https://www.refactoringui.com/)
