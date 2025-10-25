# Accessibility Guide

## Overview

This document defines accessibility standards and implementation guidelines for the Agentic Marketing Dashboard to ensure WCAG 2.1 AA compliance. It covers semantic HTML, ARIA attributes, keyboard navigation, screen reader support, color contrast, and testing strategies.

## Guiding Principles

1. **Inclusive by Default**: Accessible to all users, regardless of ability
2. **Semantic HTML**: Use correct HTML elements for their purpose
3. **Keyboard Accessible**: All functionality available via keyboard
4. **Screen Reader Friendly**: Meaningful labels and announcements
5. **Color Independence**: Don't rely on color alone
6. **Focus Management**: Visible, logical focus indicators
7. **Progressive Enhancement**: Works without JavaScript

## WCAG 2.1 AA Compliance Guidelines

### Four Core Principles (POUR)

1. **Perceivable**: Information must be presentable to users in ways they can perceive
2. **Operable**: User interface components must be operable
3. **Understandable**: Information and operation must be understandable
4. **Robust**: Content must be robust enough for assistive technologies

### Success Criteria Checklist

- [ ] **1.1.1** Non-text content has text alternatives
- [ ] **1.3.1** Information structure is programmatically determined
- [ ] **1.4.3** Color contrast ratio of at least 4.5:1 for normal text
- [ ] **1.4.11** Non-text contrast of at least 3:1
- [ ] **2.1.1** All functionality available via keyboard
- [ ] **2.1.2** No keyboard trap
- [ ] **2.4.3** Focus order is logical
- [ ] **2.4.7** Focus is visible
- [ ] **3.2.1** Focus does not cause unexpected context changes
- [ ] **4.1.2** Name, role, and value are programmatically determined

## ARIA Labels and Roles

### Landmark Roles

```tsx
// Use semantic HTML with implicit roles
<header>           {/* role="banner" */}
  <nav>            {/* role="navigation" */}
    {/* ... */}
  </nav>
</header>

<main>             {/* role="main" */}
  <section aria-labelledby="agents-heading">
    <h2 id="agents-heading">Agents</h2>
  </section>
</main>

<aside>            {/* role="complementary" */}
  {/* Sidebar content */}
</aside>

<footer>           {/* role="contentinfo" */}
  {/* Footer content */}
</footer>

// Explicit ARIA roles when needed
<div role="search">
  <input type="search" aria-label="Search agents" />
</div>
```

### ARIA Labels

```tsx
// Descriptive labels for interactive elements
<button aria-label="Delete agent">
  <TrashIcon />
</button>

// aria-labelledby for complex labels
<section aria-labelledby="campaign-metrics">
  <h2 id="campaign-metrics">Campaign Metrics</h2>
  {/* Content */}
</section>

// aria-describedby for additional context
<input
  type="email"
  aria-label="Email address"
  aria-describedby="email-help"
/>
<span id="email-help">We'll never share your email</span>

// aria-label vs aria-labelledby
<button aria-label="Close modal">X</button>  {/* Simple label */}
<button aria-labelledby="delete-agent">Delete</button>  {/* References element */}
```

### ARIA States and Properties

```tsx
// Button states
<button aria-pressed={isActive}>
  {isActive ? 'Active' : 'Inactive'}
</button>

// Expandable sections
<button
  aria-expanded={isExpanded}
  aria-controls="panel-content"
  onClick={() => setIsExpanded(!isExpanded)}
>
  {isExpanded ? 'Collapse' : 'Expand'}
</button>
<div id="panel-content" hidden={!isExpanded}>
  {/* Panel content */}
</div>

// Loading states
<button aria-busy={isLoading} disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</button>

// Required fields
<input
  type="text"
  aria-required="true"
  required
/>

// Invalid inputs
<input
  type="email"
  aria-invalid={hasError}
  aria-errormessage={hasError ? 'email-error' : undefined}
/>
{hasError && (
  <span id="email-error" role="alert">
    Please enter a valid email
  </span>
)}
```

### ARIA Live Regions

```tsx
// Polite announcements (non-urgent)
<div aria-live="polite" aria-atomic="true">
  {status}
</div>

// Assertive announcements (urgent)
<div aria-live="assertive" role="alert">
  {error}
</div>

// Status updates
<div role="status" aria-live="polite">
  {jobCount} jobs running
</div>

// Toast notifications
function Toast({ message, type }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn('toast', `toast-${type}`)}
    >
      {message}
    </div>
  )
}
```

## Keyboard Navigation

### Focus Management

```tsx
// Visible focus indicators (global styles)
// styles/globals.css
@layer base {
  *:focus-visible {
    outline: 2px solid theme('colors.brand.primary.500');
    outline-offset: 2px;
  }

  /* Remove default outline */
  *:focus {
    outline: none;
  }
}

// Skip to main content
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900"
    >
      Skip to main content
    </a>
  )
}

// Main content anchor
<main id="main-content" tabIndex={-1}>
  {/* Content */}
</main>
```

### Tab Order

```tsx
// Natural tab order (follows DOM order)
<form>
  <input type="text" />      {/* tabindex 0 (first) */}
  <input type="email" />     {/* tabindex 0 (second) */}
  <button type="submit">Submit</button>  {/* tabindex 0 (third) */}
</form>

// Custom tab order (use sparingly)
<div>
  <button tabIndex={3}>Third</button>
  <button tabIndex={1}>First</button>
  <button tabIndex={2}>Second</button>
</div>

// Remove from tab order
<div tabIndex={-1}>Not keyboard accessible</div>

// ❌ Bad - Don't use positive tabindex
<button tabIndex={1}>Avoid this</button>
```

### Keyboard Shortcuts

```tsx
// components/layout/Header.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function Header() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Global shortcuts (Cmd/Ctrl + Key)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // Open command palette
      }

      // Navigation shortcuts (g + key)
      if (e.key === 'g') {
        document.addEventListener('keypress', handleSecondKey)
      }
    }

    const handleSecondKey = (e: KeyboardEvent) => {
      if (e.key === 'a') router.push('/agents')
      if (e.key === 'c') router.push('/campaigns')
      if (e.key === 'j') router.push('/jobs')
      document.removeEventListener('keypress', handleSecondKey)
    }

    document.addEventListener('keypress', handleKeyPress)
    return () => document.removeEventListener('keypress', handleKeyPress)
  }, [router])

  return (
    <header>
      <div className="text-sm text-gray-500">
        Press <kbd className="kbd">Cmd+K</kbd> to search
      </div>
    </header>
  )
}
```

### Keyboard Accessible Components

```tsx
// Modal with focus trap
'use client'

import { useEffect, useRef } from 'react'

export function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement

      // Focus first focusable element
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()

      // Trap focus
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }

        if (e.key === 'Tab') {
          const focusables = modalRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          if (!focusables || focusables.length === 0) return

          const firstFocusable = focusables[0]
          const lastFocusable = focusables[focusables.length - 1]

          if (e.shiftKey && document.activeElement === firstFocusable) {
            e.preventDefault()
            lastFocusable.focus()
          } else if (!e.shiftKey && document.activeElement === lastFocusable) {
            e.preventDefault()
            firstFocusable.focus()
          }
        }
      }

      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    } else {
      // Restore focus
      previousFocusRef.current?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      ref={modalRef}
      className="fixed inset-0 z-modal"
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 p-6 bg-white rounded-lg">
        {children}
      </div>
    </div>
  )
}
```

## Screen Reader Support

### Semantic HTML

```tsx
// ✅ Good - Semantic HTML
<nav>
  <ul>
    <li><a href="/agents">Agents</a></li>
    <li><a href="/campaigns">Campaigns</a></li>
  </ul>
</nav>

// ❌ Bad - Non-semantic div soup
<div className="nav">
  <div className="nav-item">
    <div onClick={handleClick}>Agents</div>
  </div>
</div>

// ✅ Good - Proper headings
<h1>Dashboard</h1>
<section>
  <h2>Agents</h2>
  <h3>Active Agents</h3>
</section>

// ❌ Bad - Skipping heading levels
<h1>Dashboard</h1>
<h4>Agents</h4>
```

### Descriptive Links

```tsx
// ✅ Good - Descriptive link text
<a href="/agents/123">View agent details</a>

// ❌ Bad - Generic link text
<a href="/agents/123">Click here</a>

// ✅ Good - Context for screen readers
<a href="/agents/123" aria-label="View details for SEO Writer agent">
  View details
</a>
```

### Image Alternatives

```tsx
// Informative images
<img src="/chart.png" alt="Bar chart showing campaign performance over 6 months" />

// Decorative images
<img src="/decoration.png" alt="" role="presentation" />

// Complex images
<figure>
  <img src="/analytics.png" alt="Analytics dashboard" />
  <figcaption>
    Campaign performance metrics showing 45% increase in conversions
  </figcaption>
</figure>

// Icons with text
<button>
  <TrashIcon aria-hidden="true" />
  <span>Delete</span>
</button>

// Icons without text
<button aria-label="Delete agent">
  <TrashIcon aria-hidden="true" />
</button>
```

### Live Announcements

```tsx
// components/providers/AnnouncementProvider.tsx
'use client'

import { createContext, useContext, useState } from 'react'

interface AnnouncementContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined)

export function AnnouncementProvider({ children }: { children: React.ReactNode }) {
  const [announcement, setAnnouncement] = useState('')
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite')

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement('')
    setPriority(priority)
    setTimeout(() => setAnnouncement(message), 100)
  }

  return (
    <AnnouncementContext.Provider value={{ announce }}>
      {children}
      <div
        role={priority === 'assertive' ? 'alert' : 'status'}
        aria-live={priority}
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </AnnouncementContext.Provider>
  )
}

export function useAnnouncement() {
  const context = useContext(AnnouncementContext)
  if (!context) throw new Error('useAnnouncement must be used within AnnouncementProvider')
  return context
}

// Usage
function AgentList() {
  const { announce } = useAnnouncement()

  const handleDelete = async (id: string) => {
    await deleteAgent(id)
    announce('Agent deleted successfully', 'polite')
  }

  return <div>{/* ... */}</div>
}
```

## Color Contrast Requirements

### Text Contrast

```typescript
// Minimum contrast ratios
const CONTRAST_RATIOS = {
  normalText: 4.5,      // 4.5:1 for normal text (< 18pt)
  largeText: 3,         // 3:1 for large text (≥ 18pt or 14pt bold)
  uiComponents: 3,      // 3:1 for UI components and graphics
}

// Color combinations (verified with WebAIM)
const accessibleColors = {
  // Light mode
  light: {
    text: {
      primary: '#111827',    // gray-900 on white (15.7:1) ✅
      secondary: '#374151',  // gray-700 on white (9.7:1) ✅
      tertiary: '#6b7280',   // gray-500 on white (4.6:1) ✅
    },
    brand: {
      primary: '#4f46e5',    // indigo-600 on white (5.2:1) ✅
      secondary: '#7c3aed',  // violet-600 on white (5.1:1) ✅
    },
  },
  // Dark mode
  dark: {
    text: {
      primary: '#f9fafb',    // gray-50 on gray-900 (15.5:1) ✅
      secondary: '#e5e7eb',  // gray-200 on gray-900 (12.6:1) ✅
      tertiary: '#9ca3af',   // gray-400 on gray-900 (5.9:1) ✅
    },
    brand: {
      primary: '#818cf8',    // indigo-400 on gray-900 (6.4:1) ✅
      secondary: '#a78bfa',  // violet-400 on gray-900 (6.1:1) ✅
    },
  },
}
```

### Status Colors

```tsx
// Accessible status colors
const statusColors = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-400',  // 4.5:1 contrast
    border: 'border-green-200 dark:border-green-800',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-900 dark:text-amber-300',  // 4.5:1 contrast
    border: 'border-amber-200 dark:border-amber-800',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',  // 4.5:1 contrast
    border: 'border-red-200 dark:border-red-800',
  },
}

// Usage
<Badge className={statusColors.success.bg}>
  <span className={statusColors.success.text}>Success</span>
</Badge>
```

### Don't Rely on Color Alone

```tsx
// ✅ Good - Color + icon + text
function StatusBadge({ status }) {
  return (
    <Badge variant={status}>
      {status === 'success' && <CheckIcon />}
      {status === 'error' && <XIcon />}
      {status === 'warning' && <AlertIcon />}
      <span>{status}</span>
    </Badge>
  )
}

// ❌ Bad - Color only
function StatusBadge({ status }) {
  return <div className={`bg-${status}`} />
}
```

## Form Accessibility

### Form Labels

```tsx
// ✅ Good - Explicit labels
<label htmlFor="email">Email address</label>
<input id="email" type="email" name="email" />

// ✅ Good - Wrapped labels
<label>
  Email address
  <input type="email" name="email" />
</label>

// ❌ Bad - No label
<input type="email" placeholder="Email" />
```

### Form Validation

```tsx
// components/forms/FormField.tsx
interface FormFieldProps {
  label: string
  name: string
  type?: string
  error?: string
  required?: boolean
  helpText?: string
}

export function FormField({
  label,
  name,
  type = 'text',
  error,
  required = false,
  helpText,
}: FormFieldProps) {
  const id = `field-${name}`
  const errorId = `${id}-error`
  const helpId = `${id}-help`

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-medium">
        {label}
        {required && <span className="text-red-500" aria-label="required">*</span>}
      </label>

      {helpText && (
        <p id={helpId} className="text-sm text-gray-600">
          {helpText}
        </p>
      )}

      <input
        id={id}
        name={name}
        type={type}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={cn(
          helpText && helpId,
          error && errorId
        )}
        className={cn(
          'w-full px-4 py-2 border rounded-lg',
          error && 'border-red-500'
        )}
      />

      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
```

### Fieldset and Legend

```tsx
// Group related inputs
<fieldset>
  <legend className="font-medium">Agent Configuration</legend>
  <FormField label="Model" name="model" />
  <FormField label="Temperature" name="temperature" type="number" />
</fieldset>

// Radio groups
<fieldset>
  <legend>Agent Type</legend>
  <label>
    <input type="radio" name="type" value="strategist" />
    Content Strategist
  </label>
  <label>
    <input type="radio" name="type" value="writer" />
    SEO Writer
  </label>
</fieldset>
```

## Modal Accessibility

```tsx
// components/ui/Dialog.tsx
'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
}

export function Dialog({ isOpen, onClose, title, description, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Focus close button when opened
      closeButtonRef.current?.focus()

      // Prevent body scroll
      document.body.style.overflow = 'hidden'

      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-description' : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        >
          {/* Close button */}
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <h2 id="dialog-title" className="text-heading-lg mb-2">
            {title}
          </h2>

          {/* Description */}
          {description && (
            <p id="dialog-description" className="text-gray-600 mb-4">
              {description}
            </p>
          )}

          {/* Content */}
          {children}
        </div>
      </div>
    </div>
  )
}
```

## Data Table Accessibility

```tsx
// components/ui/Table.tsx
interface Column<T> {
  header: string
  accessor: keyof T
  sortable?: boolean
}

interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  caption: string
}

export function Table<T extends { id: string }>({
  data,
  columns,
  caption,
}: TableProps<T>) {
  return (
    <table className="w-full border-collapse">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={String(column.accessor)}
              scope="col"
              className="text-left p-4 border-b"
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id}>
            {columns.map((column, index) => (
              <td
                key={String(column.accessor)}
                className="p-4 border-b"
                {...(index === 0 && { scope: 'row' })}
              >
                {String(row[column.accessor])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

## Testing Tools and Utilities

### Automated Testing

```bash
# Install tools
npm install --save-dev @axe-core/react @testing-library/jest-dom

# Run accessibility tests
npm run test:a11y
```

```typescript
// __tests__/accessibility.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe'
import { render } from '@testing-library/react'
import { AgentCard } from '@/components/agents/AgentCard'

expect.extend(toHaveNoViolations)

describe('AgentCard Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<AgentCard agent={mockAgent} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

### Browser Extensions

- **axe DevTools** - Automated accessibility testing
- **WAVE** - Web accessibility evaluation tool
- **Lighthouse** - Performance and accessibility audits
- **NVDA/JAWS** - Screen reader testing (Windows)
- **VoiceOver** - Screen reader testing (macOS)

### Manual Testing

```bash
# Keyboard navigation checklist
- [ ] Tab through all interactive elements
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] No keyboard traps
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals
- [ ] Arrow keys work in lists/menus

# Screen reader checklist
- [ ] All images have alt text
- [ ] Headings are in logical order
- [ ] Forms have proper labels
- [ ] Buttons have descriptive text
- [ ] Links make sense out of context
- [ ] Dynamic content is announced
- [ ] Error messages are read

# Color contrast checklist
- [ ] Text meets 4.5:1 ratio
- [ ] Large text meets 3:1 ratio
- [ ] UI components meet 3:1 ratio
- [ ] Focus indicators are visible
- [ ] Don't rely on color alone
```

## Common Patterns and Examples

### Accessible Button

```tsx
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  icon?: React.ReactNode
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={cn(/* styles */)}
      {...props}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
      {isLoading && (
        <span className="ml-2" aria-hidden="true">
          <Spinner />
        </span>
      )}
    </button>
  )
}
```

### Accessible Navigation

```tsx
// components/layout/Navigation.tsx
export function Navigation() {
  return (
    <nav aria-label="Main navigation">
      <ul role="list">
        <li>
          <a
            href="/agents"
            className="nav-link"
            aria-current={isActive('/agents') ? 'page' : undefined}
          >
            Agents
          </a>
        </li>
        <li>
          <a href="/campaigns" className="nav-link">
            Campaigns
          </a>
        </li>
      </ul>
    </nav>
  )
}
```

### Accessible Tooltip

```tsx
// components/ui/Tooltip.tsx
'use client'

import { useState } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const id = `tooltip-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-describedby={isVisible ? id : undefined}
      >
        {children}
      </div>

      {isVisible && (
        <div
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-tooltip"
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}
```

## Anti-Patterns to Avoid

### Common Mistakes

```tsx
// ❌ Bad - onClick on div
<div onClick={handleClick}>Click me</div>

// ✅ Good - Use button
<button onClick={handleClick}>Click me</button>

// ❌ Bad - Placeholder as label
<input type="text" placeholder="Name" />

// ✅ Good - Proper label
<label htmlFor="name">Name</label>
<input id="name" type="text" />

// ❌ Bad - Missing alt text
<img src="/photo.jpg" />

// ✅ Good - Descriptive alt
<img src="/photo.jpg" alt="Team celebrating product launch" />

// ❌ Bad - Positive tabindex
<div tabIndex={1}>Content</div>

// ✅ Good - Natural tab order
<button>Content</button>

// ❌ Bad - Title attribute for critical info
<button title="Delete">X</button>

// ✅ Good - aria-label for screen readers
<button aria-label="Delete agent">
  <TrashIcon aria-hidden="true" />
</button>
```

## Accessibility Checklist

### Component Level
- [ ] Semantic HTML elements used
- [ ] All interactive elements keyboard accessible
- [ ] Focus states visible
- [ ] ARIA labels where needed
- [ ] Color contrast meets requirements
- [ ] Screen reader tested
- [ ] No reliance on color alone
- [ ] Error messages clear and accessible

### Page Level
- [ ] Page title descriptive
- [ ] Skip to main content link
- [ ] Heading hierarchy correct
- [ ] Landmark regions defined
- [ ] Form labels present
- [ ] Images have alt text
- [ ] Links descriptive
- [ ] Live regions for dynamic content

### Application Level
- [ ] Keyboard navigation throughout
- [ ] Focus management in SPAs
- [ ] Error handling accessible
- [ ] Loading states announced
- [ ] Notifications accessible
- [ ] Modal focus trapped
- [ ] Responsive at 200% zoom
- [ ] Works without JavaScript

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Web Accessibility Tool](https://wave.webaim.org/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
