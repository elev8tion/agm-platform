# 19. API Client & Backend Integration

## Overview

The API client provides a type-safe, resilient layer between Next.js Server Actions and the FastAPI backend. It handles authentication, request/response transformation, error handling, retries, and timeout management.

**Key Responsibilities:**
- Type-safe HTTP requests (GET, POST, PATCH, DELETE)
- Authentication header injection
- Request/response interceptors
- Automatic retry with exponential backoff
- Timeout handling
- Error transformation (backend errors → typed frontend errors)
- Request/response logging
- CORS handling

## Prerequisites

**Phase Dependencies:**
- Phase 1: Database types defined
- FastAPI backend running (default: `http://localhost:8000`)
- Server Actions ready to consume client (doc 18)

**Required Packages:**
```bash
npm install zod
npm install @types/node --save-dev
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Server Actions                        │
│  import { api } from '@/lib/api/client'                 │
│  const data = await api.post('/endpoint', payload)      │
└─────────┬───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                 API Client (lib/api/client.ts)          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1. Build request (URL, headers, body)           │   │
│  │ 2. Add auth token                               │   │
│  │ 3. Execute fetch with timeout                   │   │
│  │ 4. Handle response (parse JSON, check status)   │   │
│  │ 5. Retry on failure (exponential backoff)       │   │
│  │ 6. Transform errors                             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────┬───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                   FastAPI Backend                        │
│  http://localhost:8000/api/*                            │
└─────────────────────────────────────────────────────────┘
```

## Next.js 16 Features

### Server-Side Fetch with Caching

```typescript
// API client uses fetch with Next.js cache options
const response = await fetch(url, {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify(data),
  next: {
    revalidate: 0, // No cache for mutations
    tags: ['api-request'], // Tag for debugging
  },
})
```

### Environment Variables

```typescript
// Next.js 16 server-side env access
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

## Complete Implementation

### lib/api/types.ts

**Type Definitions for API Client**

```typescript
import { z } from 'zod'

// ============================================================================
// Configuration Types
// ============================================================================

export interface ApiConfig {
  baseURL: string
  timeout: number
  retries: number
  retryDelay: number
  headers: Record<string, string>
}

export interface RequestOptions {
  timeout?: number
  retries?: number
  headers?: Record<string, string>
  signal?: AbortSignal
  /** Skip authentication header */
  skipAuth?: boolean
  /** Custom error message prefix */
  errorContext?: string
}

// ============================================================================
// Error Types
// ============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown,
    public context?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NetworkError extends ApiError {
  constructor(message: string, context?: string) {
    super(message, undefined, undefined, context)
    this.name = 'NetworkError'
  }
}

export class TimeoutError extends ApiError {
  constructor(message: string, context?: string) {
    super(message, 408, undefined, context)
    this.name = 'TimeoutError'
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public errors: Record<string, string[]>,
    context?: string
  ) {
    super(message, 422, errors, context)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string, context?: string) {
    super(message, 401, undefined, context)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string, context?: string) {
    super(message, 403, undefined, context)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string, context?: string) {
    super(message, 404, undefined, context)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends ApiError {
  constructor(
    message: string,
    public retryAfter?: number,
    context?: string
  ) {
    super(message, 429, { retryAfter }, context)
    this.name = 'RateLimitError'
  }
}

export class ServerError extends ApiError {
  constructor(message: string, statusCode: number, context?: string) {
    super(message, statusCode, undefined, context)
    this.name = 'ServerError'
  }
}

// ============================================================================
// Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T
  status: number
  headers: Headers
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface ErrorResponse {
  error: string
  message?: string
  details?: unknown
  statusCode?: number
}

// ============================================================================
// Request/Response Interceptors
// ============================================================================

export type RequestInterceptor = (
  url: string,
  options: RequestInit
) => Promise<{ url: string; options: RequestInit }> | { url: string; options: RequestInit }

export type ResponseInterceptor = (
  response: Response
) => Promise<Response> | Response

export type ErrorInterceptor = (
  error: ApiError
) => Promise<never> | never
```

### lib/api/config.ts

**API Client Configuration**

```typescript
import type { ApiConfig } from './types'

// ============================================================================
// Environment Configuration
// ============================================================================

const getEnvVar = (key: string, fallback: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback
  }
  return fallback
}

export const API_BASE_URL = getEnvVar(
  'NEXT_PUBLIC_API_URL',
  'http://localhost:8000'
)

export const API_TIMEOUT = parseInt(
  getEnvVar('NEXT_PUBLIC_API_TIMEOUT', '30000'),
  10
)

export const API_RETRIES = parseInt(
  getEnvVar('NEXT_PUBLIC_API_RETRIES', '3'),
  10
)

export const API_RETRY_DELAY = parseInt(
  getEnvVar('NEXT_PUBLIC_API_RETRY_DELAY', '1000'),
  10
)

// ============================================================================
// Default Configuration
// ============================================================================

export const defaultConfig: ApiConfig = {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  retries: API_RETRIES,
  retryDelay: API_RETRY_DELAY,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
}

// ============================================================================
// Endpoint Definitions
// ============================================================================

export const endpoints = {
  // Agent endpoints
  agents: {
    seoResearch: '/api/agents/seo/research',
    seoWrite: '/api/agents/seo/write',
    seoOptimize: '/api/agents/seo/optimize',
    emailCreate: '/api/agents/email/create',
    emailSeries: '/api/agents/email/series',
    cmoAnalyze: '/api/agents/cmo/analyze',
  },

  // Content endpoints
  content: {
    list: '/api/content',
    get: (id: string) => `/api/content/${id}`,
    create: '/api/content',
    update: (id: string) => `/api/content/${id}`,
    delete: (id: string) => `/api/content/${id}`,
    publish: (id: string) => `/api/content/${id}/publish`,
    duplicate: (id: string) => `/api/content/${id}/duplicate`,
    bulkStatus: '/api/content/bulk/status',
    bulkDelete: '/api/content/bulk/delete',
  },

  // Campaign endpoints
  campaigns: {
    list: '/api/campaigns',
    get: (id: string) => `/api/campaigns/${id}`,
    create: '/api/campaigns',
    update: (id: string) => `/api/campaigns/${id}`,
    delete: (id: string) => `/api/campaigns/${id}`,
    pause: (id: string) => `/api/campaigns/${id}/pause`,
    resume: (id: string) => `/api/campaigns/${id}/resume`,
    complete: (id: string) => `/api/campaigns/${id}/complete`,
    refreshMetrics: (id: string) => `/api/campaigns/${id}/refresh-metrics`,
  },

  // Job endpoints
  jobs: {
    list: '/api/jobs',
    get: (id: string) => `/api/jobs/${id}`,
    cancel: (id: string) => `/api/jobs/${id}/cancel`,
    retry: (id: string) => `/api/jobs/${id}/retry`,
    status: (id: string) => `/api/jobs/${id}/status`,
  },

  // Budget endpoints
  budget: {
    current: '/api/budget/current',
    history: '/api/budget/history',
    limits: '/api/budget/limits',
    updateLimits: '/api/budget/limits',
  },

  // Analytics endpoints
  analytics: {
    overview: '/api/analytics/overview',
    content: '/api/analytics/content',
    campaigns: '/api/analytics/campaigns',
  },
} as const
```

### lib/api/client.ts

**Core API Client Implementation**

```typescript
import {
  ApiError,
  NetworkError,
  TimeoutError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ServerError,
  type ApiConfig,
  type RequestOptions,
  type ApiResponse,
  type ErrorResponse,
  type RequestInterceptor,
  type ResponseInterceptor,
  type ErrorInterceptor,
} from './types'
import { defaultConfig } from './config'

// ============================================================================
// API Client Class
// ============================================================================

class ApiClient {
  private config: ApiConfig
  private requestInterceptors: RequestInterceptor[] = []
  private responseInterceptors: ResponseInterceptor[] = []
  private errorInterceptors: ErrorInterceptor[] = []

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  // ==========================================================================
  // Interceptor Management
  // ==========================================================================

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor)
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor)
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor)
  }

  // ==========================================================================
  // Request Building
  // ==========================================================================

  private async buildRequest(
    endpoint: string,
    options: RequestInit & RequestOptions = {}
  ): Promise<{ url: string; options: RequestInit }> {
    const {
      timeout = this.config.timeout,
      headers: customHeaders = {},
      skipAuth = false,
      ...fetchOptions
    } = options

    // Build full URL
    let url = endpoint.startsWith('http')
      ? endpoint
      : `${this.config.baseURL}${endpoint}`

    // Build headers
    const headers = {
      ...this.config.headers,
      ...customHeaders,
    }

    // Add authentication if needed
    if (!skipAuth) {
      const token = await this.getAuthToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    // Build final request
    let requestConfig = {
      url,
      options: {
        ...fetchOptions,
        headers,
      } as RequestInit,
    }

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      requestConfig = await interceptor(requestConfig.url, requestConfig.options)
    }

    return requestConfig
  }

  // ==========================================================================
  // Authentication
  // ==========================================================================

  private async getAuthToken(): Promise<string | null> {
    // TODO: Implement auth token retrieval (e.g., from cookies, session)
    // For now, return null (no auth)
    // In production: integrate with next-auth or similar
    return null
  }

  // ==========================================================================
  // Timeout Management
  // ==========================================================================

  private withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    context?: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new TimeoutError(
            `Request timeout after ${timeoutMs}ms`,
            context
          )),
          timeoutMs
        )
      ),
    ])
  }

  // ==========================================================================
  // Retry Logic
  // ==========================================================================

  private async withRetry<T>(
    fn: () => Promise<T>,
    retries: number,
    delay: number,
    context?: string
  ): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error

        // Don't retry on client errors (4xx except 429)
        if (error instanceof ApiError && error.statusCode) {
          const status = error.statusCode
          if (status >= 400 && status < 500 && status !== 429) {
            throw error
          }
        }

        // Don't retry validation errors
        if (error instanceof ValidationError) {
          throw error
        }

        // Last attempt - throw error
        if (attempt === retries) {
          throw error
        }

        // Calculate backoff delay (exponential)
        const backoffDelay = delay * Math.pow(2, attempt)

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, backoffDelay))
      }
    }

    throw lastError || new Error('Request failed after retries')
  }

  // ==========================================================================
  // Response Handling
  // ==========================================================================

  private async handleResponse<T>(
    response: Response,
    context?: string
  ): Promise<T> {
    // Apply response interceptors
    let processedResponse = response
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse)
    }

    // Handle error responses
    if (!processedResponse.ok) {
      await this.handleErrorResponse(processedResponse, context)
    }

    // Parse JSON response
    try {
      const data = await processedResponse.json()
      return data as T
    } catch (error) {
      throw new ServerError(
        'Failed to parse response JSON',
        processedResponse.status,
        context
      )
    }
  }

  private async handleErrorResponse(
    response: Response,
    context?: string
  ): Promise<never> {
    const status = response.status
    let errorData: ErrorResponse | undefined

    // Try to parse error response
    try {
      errorData = await response.json()
    } catch {
      // Ignore JSON parse errors
    }

    const message = errorData?.message || errorData?.error || response.statusText

    // Create appropriate error type
    let error: ApiError

    switch (status) {
      case 400:
        error = new ValidationError(
          message || 'Validation error',
          (errorData?.details as Record<string, string[]>) || {},
          context
        )
        break

      case 401:
        error = new AuthenticationError(
          message || 'Authentication required',
          context
        )
        break

      case 403:
        error = new AuthorizationError(
          message || 'Insufficient permissions',
          context
        )
        break

      case 404:
        error = new NotFoundError(
          message || 'Resource not found',
          context
        )
        break

      case 422:
        error = new ValidationError(
          message || 'Validation error',
          (errorData?.details as Record<string, string[]>) || {},
          context
        )
        break

      case 429:
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10)
        error = new RateLimitError(
          message || 'Rate limit exceeded',
          retryAfter,
          context
        )
        break

      case 500:
      case 502:
      case 503:
      case 504:
        error = new ServerError(
          message || 'Server error',
          status,
          context
        )
        break

      default:
        error = new ApiError(
          message || 'Request failed',
          status,
          errorData,
          context
        )
    }

    // Apply error interceptors
    for (const interceptor of this.errorInterceptors) {
      await interceptor(error)
    }

    throw error
  }

  // ==========================================================================
  // HTTP Methods
  // ==========================================================================

  async get<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      timeout = this.config.timeout,
      retries = this.config.retries,
      errorContext,
      ...requestOptions
    } = options

    return this.withRetry(
      async () => {
        const { url, options: fetchOptions } = await this.buildRequest(
          endpoint,
          { ...requestOptions, method: 'GET' }
        )

        const response = await this.withTimeout(
          fetch(url, {
            ...fetchOptions,
            next: { revalidate: 0 }, // No cache for API calls
          }),
          timeout,
          errorContext
        )

        return this.handleResponse<T>(response, errorContext)
      },
      retries,
      this.config.retryDelay,
      errorContext
    )
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      timeout = this.config.timeout,
      retries = this.config.retries,
      errorContext,
      ...requestOptions
    } = options

    return this.withRetry(
      async () => {
        const { url, options: fetchOptions } = await this.buildRequest(
          endpoint,
          {
            ...requestOptions,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
          }
        )

        const response = await this.withTimeout(
          fetch(url, {
            ...fetchOptions,
            next: { revalidate: 0 },
          }),
          timeout,
          errorContext
        )

        return this.handleResponse<T>(response, errorContext)
      },
      retries,
      this.config.retryDelay,
      errorContext
    )
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      timeout = this.config.timeout,
      retries = this.config.retries,
      errorContext,
      ...requestOptions
    } = options

    return this.withRetry(
      async () => {
        const { url, options: fetchOptions } = await this.buildRequest(
          endpoint,
          {
            ...requestOptions,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
          }
        )

        const response = await this.withTimeout(
          fetch(url, {
            ...fetchOptions,
            next: { revalidate: 0 },
          }),
          timeout,
          errorContext
        )

        return this.handleResponse<T>(response, errorContext)
      },
      retries,
      this.config.retryDelay,
      errorContext
    )
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      timeout = this.config.timeout,
      retries = this.config.retries,
      errorContext,
      ...requestOptions
    } = options

    return this.withRetry(
      async () => {
        const { url, options: fetchOptions } = await this.buildRequest(
          endpoint,
          {
            ...requestOptions,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
          }
        )

        const response = await this.withTimeout(
          fetch(url, {
            ...fetchOptions,
            next: { revalidate: 0 },
          }),
          timeout,
          errorContext
        )

        return this.handleResponse<T>(response, errorContext)
      },
      retries,
      this.config.retryDelay,
      errorContext
    )
  }

  async delete<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      timeout = this.config.timeout,
      retries = this.config.retries,
      errorContext,
      ...requestOptions
    } = options

    return this.withRetry(
      async () => {
        const { url, options: fetchOptions } = await this.buildRequest(
          endpoint,
          { ...requestOptions, method: 'DELETE' }
        )

        const response = await this.withTimeout(
          fetch(url, {
            ...fetchOptions,
            next: { revalidate: 0 },
          }),
          timeout,
          errorContext
        )

        return this.handleResponse<T>(response, errorContext)
      },
      retries,
      this.config.retryDelay,
      errorContext
    )
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const api = new ApiClient()

// Export for custom instances
export { ApiClient }
```

### lib/api/interceptors.ts

**Common Interceptors**

```typescript
import type { RequestInterceptor, ResponseInterceptor, ErrorInterceptor } from './types'

// ============================================================================
// Request Logging Interceptor
// ============================================================================

export const requestLoggingInterceptor: RequestInterceptor = (url, options) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[API Request]', options.method, url)
  }
  return { url, options }
}

// ============================================================================
// Response Logging Interceptor
// ============================================================================

export const responseLoggingInterceptor: ResponseInterceptor = (response) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[API Response]', response.status, response.url)
  }
  return response
}

// ============================================================================
// Error Logging Interceptor
// ============================================================================

export const errorLoggingInterceptor: ErrorInterceptor = (error) => {
  console.error('[API Error]', {
    name: error.name,
    message: error.message,
    statusCode: error.statusCode,
    context: error.context,
  })
  throw error
}

// ============================================================================
// Setup Development Interceptors
// ============================================================================

export function setupDevelopmentInterceptors(client: typeof import('./client').api) {
  if (process.env.NODE_ENV === 'development') {
    client.addRequestInterceptor(requestLoggingInterceptor)
    client.addResponseInterceptor(responseLoggingInterceptor)
    client.addErrorInterceptor(errorLoggingInterceptor)
  }
}
```

## Type Safety

### Type-Safe Endpoint Calls

```typescript
import { api } from '@/lib/api/client'
import { endpoints } from '@/lib/api/config'
import type { ContentAsset } from '@/lib/types/database'

// Type-safe endpoint usage
const asset = await api.get<ContentAsset>(
  endpoints.content.get('asset-123')
)
// asset is typed as ContentAsset

// Type-safe request body
const newAsset = await api.post<ContentAsset>(
  endpoints.content.create,
  {
    title: 'My Article',
    content: 'Content here',
    type: 'blog_post',
  }
)
```

### Generic Response Types

```typescript
import type { PaginatedResponse } from '@/lib/api/types'
import type { Campaign } from '@/lib/types/database'

const response = await api.get<PaginatedResponse<Campaign>>(
  '/api/campaigns?page=1&limit=10'
)

// Fully typed
response.items // Campaign[]
response.total // number
response.hasMore // boolean
```

## Error Handling

### Catching Specific Errors

```typescript
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
} from '@/lib/api/types'

try {
  await api.post('/api/content', data)
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
    console.log(error.errors) // Field-level errors
  } else if (error instanceof AuthenticationError) {
    // Redirect to login
    redirect('/login')
  } else if (error instanceof NotFoundError) {
    // Show 404 page
    notFound()
  } else if (error instanceof RateLimitError) {
    // Show rate limit message
    console.log(`Retry after ${error.retryAfter}s`)
  }
}
```

## Testing

### Mock API Client

```typescript
// lib/api/__tests__/client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiClient } from '../client'
import { NetworkError, TimeoutError } from '../types'

describe('ApiClient', () => {
  let client: ApiClient

  beforeEach(() => {
    client = new ApiClient({
      baseURL: 'http://test-api.com',
      timeout: 5000,
      retries: 2,
    })
  })

  it('should make GET request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: '123', name: 'Test' }),
    })

    const result = await client.get('/api/test')

    expect(result).toEqual({ id: '123', name: 'Test' })
    expect(fetch).toHaveBeenCalledWith(
      'http://test-api.com/api/test',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('should retry on network error', async () => {
    let attempts = 0
    global.fetch = vi.fn().mockImplementation(async () => {
      attempts++
      if (attempts < 3) {
        throw new Error('Network error')
      }
      return {
        ok: true,
        json: async () => ({ success: true }),
      }
    })

    const result = await client.get('/api/test')

    expect(attempts).toBe(3)
    expect(result).toEqual({ success: true })
  })

  it('should handle timeout', async () => {
    global.fetch = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 10000))
    )

    await expect(client.get('/api/test')).rejects.toThrow(TimeoutError)
  })
})
```

## Performance

### Request Deduplication

```typescript
// lib/api/dedupe.ts
const pendingRequests = new Map<string, Promise<any>>()

export function dedupeRequest<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!
  }

  const promise = fn().finally(() => {
    pendingRequests.delete(key)
  })

  pendingRequests.set(key, promise)
  return promise
}

// Usage
const data = await dedupeRequest(
  'campaigns-list',
  () => api.get('/api/campaigns')
)
```

## Troubleshooting

### Issue: CORS Errors

**Symptom:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution:**
```python
# FastAPI backend: Add CORS middleware
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Timeout on Long Operations

**Symptom:** TimeoutError on agent operations

**Solution:**
```typescript
// Increase timeout for specific requests
await api.post('/api/agents/seo/write', data, {
  timeout: 120000, // 2 minutes
})
```

### Issue: Authentication Token Not Sent

**Symptom:** 401 Unauthorized errors

**Solution:**
```typescript
// Implement getAuthToken in client.ts
private async getAuthToken(): Promise<string | null> {
  // Example with next-auth
  const session = await getServerSession()
  return session?.accessToken || null
}
```

## Next Steps

**Phase 5 Integration:**
- Use API client in Server Actions (doc 18)
- Implement error boundaries (doc 21)
- Configure cache management (doc 20)
- Build form components (doc 22)

**Action Items:**
1. Create all API client files
2. Configure environment variables
3. Test API connectivity
4. Implement authentication
5. Add request/response logging
6. Write integration tests
7. Set up error monitoring

**Dependencies:**
- Next: Document 18 (Server Actions)
- Next: Document 21 (Error Handling)
