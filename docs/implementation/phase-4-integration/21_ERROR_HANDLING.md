# 21. Error Handling & Recovery

## Overview

Comprehensive error handling ensures graceful degradation, clear user feedback, and quick recovery from failures. This implementation uses Error Boundaries, typed error classes, user-friendly messages, retry mechanisms, and structured logging.

**Key Responsibilities:**
- Catch and handle errors at appropriate levels
- Transform technical errors to user-friendly messages
- Provide retry mechanisms (manual and automatic)
- Log errors for debugging and monitoring
- Show fallback UI when errors occur
- Prevent error propagation from breaking the entire app

## Prerequisites

**Phase Dependencies:**
- Phase 1: Database types
- Phase 2: UI components
- Server Actions with error handling (doc 18)
- API Client with error types (doc 19)

**Required Packages:**
```bash
npm install zod
npm install react-error-boundary
npm install sonner # For toast notifications
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Root                      │
│  <AppErrorBoundary>                                     │
│    └─ Catches all uncaught errors                       │
└─────────┬───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                  Feature Boundaries                      │
│  <ContentErrorBoundary>                                 │
│  <CampaignErrorBoundary>                                │
│    └─ Catches feature-specific errors                   │
└─────────┬───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                  Component Level                         │
│  try/catch in event handlers                            │
│  Error state management                                 │
│    └─ Handles component-specific errors                 │
└─────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                   Error Display                          │
│  Toast Notifications (transient errors)                 │
│  Error Pages (critical errors)                          │
│  Inline Messages (form errors)                          │
└─────────────────────────────────────────────────────────┘
```

## Next.js 16 Features

### Error Boundaries with error.tsx

```typescript
// app/dashboard/error.tsx
'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### Global Error Handling

```typescript
// app/global-error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Application Error</h2>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  )
}
```

## Complete Implementation

### lib/errors/types.ts

**Error Type Definitions**

```typescript
// ============================================================================
// Base Error Classes
// ============================================================================

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown,
    public userMessage?: string
  ) {
    super(message)
    this.name = 'AppError'
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      userMessage: this.userMessage,
    }
  }
}

// ============================================================================
// Specific Error Types
// ============================================================================

export class ValidationError extends AppError {
  constructor(
    message: string,
    public fieldErrors: Record<string, string[]>,
    userMessage?: string
  ) {
    super(
      message,
      'VALIDATION_ERROR',
      422,
      fieldErrors,
      userMessage || 'Please check your input and try again.'
    )
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      'AUTHENTICATION_ERROR',
      401,
      undefined,
      userMessage || 'Please sign in to continue.'
    )
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      'AUTHORIZATION_ERROR',
      403,
      undefined,
      userMessage || 'You do not have permission to perform this action.'
    )
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(
    resource: string,
    userMessage?: string
  ) {
    super(
      `${resource} not found`,
      'NOT_FOUND',
      404,
      { resource },
      userMessage || `The requested ${resource.toLowerCase()} could not be found.`
    )
    this.name = 'NotFoundError'
  }
}

export class NetworkError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      'NETWORK_ERROR',
      undefined,
      undefined,
      userMessage || 'Network connection failed. Please check your connection and try again.'
    )
    this.name = 'NetworkError'
  }
}

export class TimeoutError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      'TIMEOUT_ERROR',
      408,
      undefined,
      userMessage || 'The request took too long. Please try again.'
    )
    this.name = 'TimeoutError'
  }
}

export class RateLimitError extends AppError {
  constructor(
    message: string,
    public retryAfter?: number,
    userMessage?: string
  ) {
    super(
      message,
      'RATE_LIMIT_ERROR',
      429,
      { retryAfter },
      userMessage || `Too many requests. Please wait ${retryAfter || 60} seconds and try again.`
    )
    this.name = 'RateLimitError'
  }
}

export class ServerError extends AppError {
  constructor(message: string, statusCode: number, userMessage?: string) {
    super(
      message,
      'SERVER_ERROR',
      statusCode,
      undefined,
      userMessage || 'A server error occurred. Please try again later.'
    )
    this.name = 'ServerError'
  }
}

export class AgentError extends AppError {
  constructor(
    agentType: string,
    message: string,
    userMessage?: string
  ) {
    super(
      message,
      'AGENT_ERROR',
      500,
      { agentType },
      userMessage || `The ${agentType} agent encountered an error. Please try again.`
    )
    this.name = 'AgentError'
  }
}

export class JobError extends AppError {
  constructor(
    jobId: string,
    message: string,
    userMessage?: string
  ) {
    super(
      message,
      'JOB_ERROR',
      500,
      { jobId },
      userMessage || 'The job failed. Please check the details and try again.'
    )
    this.name = 'JobError'
  }
}

// ============================================================================
// Error Severity Levels
// ============================================================================

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export function getErrorSeverity(error: Error): ErrorSeverity {
  if (error instanceof ValidationError) {
    return ErrorSeverity.LOW
  }

  if (
    error instanceof NetworkError ||
    error instanceof TimeoutError ||
    error instanceof RateLimitError
  ) {
    return ErrorSeverity.MEDIUM
  }

  if (
    error instanceof AuthenticationError ||
    error instanceof AuthorizationError
  ) {
    return ErrorSeverity.HIGH
  }

  if (
    error instanceof ServerError ||
    error instanceof AgentError ||
    error instanceof JobError
  ) {
    return ErrorSeverity.CRITICAL
  }

  return ErrorSeverity.MEDIUM
}
```

### lib/errors/handlers.ts

**Error Handler Utilities**

```typescript
import { ZodError } from 'zod'
import {
  AppError,
  ValidationError,
  AuthenticationError,
  NetworkError,
  TimeoutError,
  ServerError,
  getErrorSeverity,
  type ErrorSeverity,
} from './types'
import type { ApiError } from '@/lib/api/types'

// ============================================================================
// Server Action Error Handler
// ============================================================================

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown; severity?: ErrorSeverity }

export function handleActionError(
  error: unknown,
  context: string
): ActionResult<never> {
  // Log error for debugging
  logError(error, context)

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return {
      success: false,
      error: 'Validation failed',
      details: error.flatten().fieldErrors,
      severity: 'low',
    }
  }

  // Handle application errors
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.userMessage || error.message,
      details: error.details,
      severity: getErrorSeverity(error),
    }
  }

  // Handle API errors (from API client)
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const apiError = error as ApiError
    return {
      success: false,
      error: apiError.message || 'An error occurred',
      details: apiError.response,
      severity: apiError.statusCode && apiError.statusCode >= 500 ? 'critical' : 'medium',
    }
  }

  // Handle unknown errors
  return {
    success: false,
    error: context || 'An unexpected error occurred',
    details: error instanceof Error ? error.message : String(error),
    severity: 'critical',
  }
}

// ============================================================================
// Client-Side Error Handler
// ============================================================================

export function handleClientError(error: unknown, context?: string): string {
  // Log error
  logError(error, context)

  // Extract user-friendly message
  if (error instanceof AppError) {
    return error.userMessage || error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}

// ============================================================================
// Error Logging
// ============================================================================

interface ErrorLog {
  timestamp: string
  context?: string
  error: {
    name: string
    message: string
    stack?: string
    details?: unknown
  }
  severity: ErrorSeverity
  userAgent?: string
  url?: string
}

export function logError(error: unknown, context?: string): void {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      details: error instanceof AppError ? error.details : undefined,
    },
    severity: error instanceof Error ? getErrorSeverity(error) : 'medium',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  }

  // Console logging (development)
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Log]', errorLog)
  }

  // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  // Example:
  // if (typeof window !== 'undefined' && window.Sentry) {
  //   window.Sentry.captureException(error, {
  //     tags: { context },
  //     level: errorLog.severity,
  //   })
  // }
}

// ============================================================================
// Error Message Mapping
// ============================================================================

const errorMessageMap: Record<string, string> = {
  // Network errors
  'Failed to fetch': 'Network connection failed. Please check your internet connection.',
  'NetworkError': 'Unable to connect to the server. Please try again.',

  // Timeout errors
  'timeout': 'The request took too long. Please try again.',
  'aborted': 'The request was cancelled. Please try again.',

  // Auth errors
  'Unauthorized': 'Please sign in to continue.',
  'Invalid token': 'Your session has expired. Please sign in again.',

  // Validation errors
  'Validation failed': 'Please check your input and try again.',

  // Server errors
  'Internal Server Error': 'A server error occurred. Our team has been notified.',
  '500': 'A server error occurred. Please try again later.',
  '502': 'The server is temporarily unavailable. Please try again later.',
  '503': 'The service is under maintenance. Please try again later.',
}

export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError && error.userMessage) {
    return error.userMessage
  }

  if (error instanceof Error) {
    // Check for mapped messages
    for (const [key, message] of Object.entries(errorMessageMap)) {
      if (error.message.includes(key)) {
        return message
      }
    }

    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}

// ============================================================================
// Retry Helpers
// ============================================================================

export function isRetryableError(error: unknown): boolean {
  // Network errors are retryable
  if (error instanceof NetworkError || error instanceof TimeoutError) {
    return true
  }

  // API errors: retry on 5xx and 429
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const statusCode = (error as { statusCode?: number }).statusCode
    return statusCode ? statusCode >= 500 || statusCode === 429 : false
  }

  // Unknown errors: don't retry by default
  return false
}

export function getRetryDelay(error: unknown, attempt: number): number {
  // Rate limit: use Retry-After header
  if (error instanceof RateLimitError && error.retryAfter) {
    return error.retryAfter * 1000
  }

  // Exponential backoff: 1s, 2s, 4s, 8s...
  return Math.min(1000 * Math.pow(2, attempt), 30000)
}
```

### components/error-boundary.tsx

**Error Boundary Components**

```typescript
'use client'

import { Component, type ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { logError, getUserFriendlyMessage, getErrorSeverity } from '@/lib/errors/handlers'
import type { ErrorSeverity } from '@/lib/errors/types'

// ============================================================================
// Error Boundary Props & State
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  level?: 'app' | 'feature' | 'component'
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

// ============================================================================
// Generic Error Boundary
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error
    logError(error, `ErrorBoundary (${this.props.level || 'component'})`)

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Update state
    this.setState({
      errorInfo,
    })
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset)
      }

      // Default fallback
      return <DefaultErrorFallback error={this.state.error} reset={this.reset} />
    }

    return this.props.children
  }
}

// ============================================================================
// Default Error Fallback
// ============================================================================

function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const message = getUserFriendlyMessage(error)
  const severity = getErrorSeverity(error)

  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <Alert variant={severity === 'critical' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={reset} className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/dashboard')}
            className="flex-1"
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Error Details (Dev Only)
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-muted p-4 text-xs">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// App-Level Error Boundary
// ============================================================================

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="app"
      fallback={(error, reset) => (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="w-full max-w-md space-y-4 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="text-2xl font-bold">Application Error</h1>
            <p className="text-muted-foreground">
              {getUserFriendlyMessage(error)}
            </p>
            <div className="flex gap-2">
              <Button onClick={reset} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

// ============================================================================
// Feature-Level Error Boundaries
// ============================================================================

export function ContentErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="feature"
      fallback={(error, reset) => (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Content Error</AlertTitle>
          <AlertDescription>
            {getUserFriendlyMessage(error)}
            <Button variant="outline" size="sm" onClick={reset} className="ml-4">
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

export function CampaignErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="feature"
      fallback={(error, reset) => (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Campaign Error</AlertTitle>
          <AlertDescription>
            {getUserFriendlyMessage(error)}
            <Button variant="outline" size="sm" onClick={reset} className="ml-4">
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

export function JobErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="feature"
      fallback={(error, reset) => (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Job Error</AlertTitle>
          <AlertDescription>
            {getUserFriendlyMessage(error)}
            <Button variant="outline" size="sm" onClick={reset} className="ml-4">
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
```

### components/error-toast.tsx

**Toast Notification for Errors**

```typescript
'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import type { ErrorSeverity } from '@/lib/errors/types'

// ============================================================================
// Error Toast
// ============================================================================

export function showErrorToast(
  message: string,
  options?: {
    description?: string
    severity?: ErrorSeverity
    duration?: number
    action?: {
      label: string
      onClick: () => void
    }
  }
) {
  const duration = options?.duration ?? 5000
  const severity = options?.severity ?? 'medium'

  const icon = {
    low: <Info className="h-5 w-5" />,
    medium: <AlertTriangle className="h-5 w-5" />,
    high: <AlertCircle className="h-5 w-5" />,
    critical: <AlertCircle className="h-5 w-5" />,
  }[severity]

  toast.error(message, {
    description: options?.description,
    icon,
    duration,
    action: options?.action,
  })
}

// ============================================================================
// Success Toast
// ============================================================================

export function showSuccessToast(
  message: string,
  options?: {
    description?: string
    duration?: number
  }
) {
  toast.success(message, {
    description: options?.description,
    icon: <CheckCircle className="h-5 w-5" />,
    duration: options?.duration ?? 3000,
  })
}

// ============================================================================
// Info Toast
// ============================================================================

export function showInfoToast(
  message: string,
  options?: {
    description?: string
    duration?: number
  }
) {
  toast.info(message, {
    description: options?.description,
    icon: <Info className="h-5 w-5" />,
    duration: options?.duration ?? 3000,
  })
}
```

## Type Safety

### Typed Error Results

```typescript
// Server Action with typed error
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; severity?: ErrorSeverity }

async function myAction(): Promise<Result<MyData>> {
  try {
    const data = await fetchData()
    return { success: true, data }
  } catch (error) {
    return handleActionError(error, 'Failed to fetch data')
  }
}

// Type-safe usage
const result = await myAction()
if (result.success) {
  // TypeScript knows result.data exists
  console.log(result.data)
} else {
  // TypeScript knows result.error exists
  showErrorToast(result.error, { severity: result.severity })
}
```

## Error Handling

### Form Error Display

```typescript
'use client'

import { useFormState } from 'react-dom'
import { myAction } from '@/app/actions'
import { showErrorToast } from '@/components/error-toast'

export function MyForm() {
  const [state, formAction] = useFormState(myAction, null)

  useEffect(() => {
    if (state && !state.success) {
      showErrorToast(state.error, { severity: state.severity })
    }
  }, [state])

  return <form action={formAction}>{/* form fields */}</form>
}
```

## Testing

### Error Boundary Tests

```typescript
// components/__tests__/error-boundary.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '../error-boundary'

function ThrowError() {
  throw new Error('Test error')
}

describe('ErrorBoundary', () => {
  it('should catch and display error', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText(/test error/i)).toBeInTheDocument()
  })

  it('should call onError callback', () => {
    const onError = vi.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalled()
  })
})
```

## Performance

### Error Tracking Integration

```typescript
// lib/errors/sentry.ts
export function initSentry() {
  if (typeof window === 'undefined') return

  // Example Sentry initialization
  // import * as Sentry from '@sentry/nextjs'
  //
  // Sentry.init({
  //   dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  //   environment: process.env.NODE_ENV,
  //   tracesSampleRate: 1.0,
  // })
}
```

## Troubleshooting

### Issue: Errors Not Caught by Boundary

**Symptom:** Errors crash the app instead of showing fallback

**Solution:**
```typescript
// Async errors in event handlers need try/catch
async function handleClick() {
  try {
    await myAsyncFunction()
  } catch (error) {
    handleClientError(error, 'Button click')
    showErrorToast(getUserFriendlyMessage(error))
  }
}
```

### Issue: Error Boundary Not Resetting

**Symptom:** Error persists after clicking "Try Again"

**Solution:**
```typescript
// Ensure reset clears all error state
reset = () => {
  this.setState({
    hasError: false,
    error: null,
    errorInfo: null,
  })

  // Also reset any external state if needed
  window.location.reload() // Or use router.refresh()
}
```

## Next Steps

**Phase 5 Integration:**
- Wrap app with AppErrorBoundary
- Add feature boundaries to dashboard sections
- Implement toast notifications
- Set up error tracking (Sentry)
- Test error scenarios

**Action Items:**
1. Create all error handling files
2. Implement Error Boundaries
3. Add toast notifications
4. Configure error logging
5. Write error tests
6. Document error scenarios
7. Set up monitoring

**Dependencies:**
- Previous: Document 18 (Server Actions)
- Previous: Document 19 (API Client)
- Next: Document 22 (Form Handling)
