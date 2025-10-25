# 35. Security & Data Protection

## Overview

This guide implements comprehensive security measures for the Agentic Marketing Dashboard following OWASP Top 10 guidelines, including API key protection, input validation, rate limiting, CORS configuration, and secure data handling.

**Production Considerations:**
- Zero-trust security model
- Defense in depth
- Least privilege access
- Secure by default
- Regular security audits
- Incident response plan

## Prerequisites

**Completed Phases:**
- Phase 6: All previous documents (28-34)

**Security Standards:**
- OWASP Top 10 2021
- NIST Cybersecurity Framework
- GDPR compliance (if applicable)
- SOC 2 Type II (for enterprise)

## API Key & Secrets Protection

### Step 1: Environment Variable Management

**Never expose secrets to frontend:**

```typescript
// ❌ WRONG - Exposes secret to browser
const apiKey = process.env.OPENAI_API_KEY;

// ✅ CORRECT - Only server-side
// In Server Action or API Route:
import { headers } from 'next/headers';

async function generateContent() {
  'use server';
  const apiKey = process.env.OPENAI_API_KEY; // Safe - server only
  // Use apiKey...
}
```

**File: `agentic-crm-template/.env.example`**

```env
# Public variables (NEXT_PUBLIC_ prefix - exposed to browser)
NEXT_PUBLIC_APP_URL=https://your-app.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx

# Private variables (SERVER-SIDE ONLY - never exposed)
CLERK_SECRET_KEY=sk_live_xxx
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-xxx
STRIPE_SECRET_KEY=sk_live_xxx
WEBHOOK_SECRET=whsec_xxx
```

### Step 2: Secrets Validation

**File: `agentic-crm-template/lib/security/env.ts`**

```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Public
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),

  // Private
  CLERK_SECRET_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
});

export function validateEnv() {
  try {
    envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Environment validation failed');
  }
}

// Call on app start
validateEnv();
```

### Step 3: Backend Secrets Management

**File: `market-ai/config/secrets.py`**

```python
import os
from typing import Optional

class SecretsManager:
    """Centralized secrets management"""

    _secrets: dict = {}

    @classmethod
    def get(cls, key: str, default: Optional[str] = None) -> str:
        """Get secret from environment"""
        if key in cls._secrets:
            return cls._secrets[key]

        value = os.getenv(key, default)
        if value is None:
            raise ValueError(f"Secret {key} not found")

        cls._secrets[key] = value
        return value

    @classmethod
    def validate_required_secrets(cls):
        """Validate all required secrets are present"""
        required = [
            "DATABASE_URL",
            "OPENAI_API_KEY",
            "CLERK_SECRET_KEY",
            "JWT_SECRET_KEY",
        ]

        missing = []
        for key in required:
            try:
                cls.get(key)
            except ValueError:
                missing.append(key)

        if missing:
            raise ValueError(f"Missing required secrets: {', '.join(missing)}")

# Validate on import
SecretsManager.validate_required_secrets()
```

## Input Validation & Sanitization

### Step 1: Frontend Validation (Zod)

**File: `agentic-crm-template/lib/validation/schemas.ts`**

```typescript
import { z } from 'zod';

// Campaign schema
export const campaignSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .trim(),

  budget: z.number()
    .positive('Budget must be positive')
    .max(1000000, 'Budget too large'),

  type: z.enum(['email', 'social', 'search', 'display']),

  description: z.string()
    .max(1000, 'Description too long')
    .optional(),

  startDate: z.date()
    .min(new Date(), 'Start date must be in future'),

  endDate: z.date()
    .refine((date) => date > new Date(), 'End date must be in future'),
}).refine(
  (data) => data.endDate > data.startDate,
  { message: 'End date must be after start date', path: ['endDate'] }
);

export type CampaignInput = z.infer<typeof campaignSchema>;
```

**Usage in forms:**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { campaignSchema } from '@/lib/validation/schemas';

function CampaignForm() {
  const form = useForm({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      budget: 0,
      type: 'email',
    },
  });

  async function onSubmit(data: CampaignInput) {
    // Data is validated and type-safe
    await createCampaign(data);
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

### Step 2: XSS Prevention

**File: `agentic-crm-template/lib/security/sanitize.ts`**

```typescript
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}

/**
 * Escape user input for display
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitize URL to prevent javascript: protocol
 */
export function sanitizeUrl(url: string): string {
  const parsed = new URL(url);

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Invalid URL protocol');
  }

  return url;
}
```

### Step 3: Backend Validation (Pydantic)

**File: `market-ai/schemas/campaign.py`**

```python
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional

class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    budget: float = Field(..., gt=0, le=1000000)
    type: str = Field(..., regex="^(email|social|search|display)$")
    description: Optional[str] = Field(None, max_length=1000)
    start_date: datetime
    end_date: datetime

    @validator('name')
    def sanitize_name(cls, v):
        """Remove potentially dangerous characters"""
        return v.strip()

    @validator('end_date')
    def end_after_start(cls, v, values):
        """Validate end date is after start date"""
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v

    @validator('start_date', 'end_date')
    def dates_in_future(cls, v):
        """Validate dates are in future"""
        if v < datetime.now():
            raise ValueError('Date must be in the future')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Summer Sale",
                "budget": 5000.0,
                "type": "email",
                "start_date": "2024-06-01T00:00:00Z",
                "end_date": "2024-08-31T23:59:59Z"
            }
        }
```

## SQL Injection Prevention

### Using Parameterized Queries

**File: `market-ai/repositories/campaign_repository.py`**

```python
import asyncpg

class CampaignRepository:
    def __init__(self, db_pool: asyncpg.Pool):
        self.db = db_pool

    async def find_by_name(self, name: str):
        """Safe: Using parameterized query"""
        async with self.db.acquire() as conn:
            # ✅ CORRECT - Parameterized
            result = await conn.fetch(
                "SELECT * FROM campaigns WHERE name = $1",
                name
            )
            return result

    async def unsafe_find(self, name: str):
        """❌ WRONG - SQL Injection vulnerability"""
        async with self.db.acquire() as conn:
            # DON'T DO THIS!
            query = f"SELECT * FROM campaigns WHERE name = '{name}'"
            result = await conn.fetch(query)
            return result
```

## CORS Configuration

### Step 1: Strict CORS Policy

**File: `market-ai/config/cors.py`**

```python
from fastapi.middleware.cors import CORSMiddleware
import os

def configure_cors(app):
    """Configure CORS with strict policy"""

    # Get allowed origins from environment
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")

    # In production, be explicit
    if os.getenv("NODE_ENV") == "production":
        # Only allow specific origins
        origins = [origin.strip() for origin in allowed_origins if origin]
    else:
        # Development: allow localhost
        origins = [
            "http://localhost:3000",
            "http://localhost:5173",
        ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,  # Specific origins only
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["*"],
        expose_headers=["X-Total-Count", "X-Page-Number"],
        max_age=600,  # Cache preflight requests for 10 minutes
    )
```

### Step 2: Frontend CORS Headers

**File: `agentic-crm-template/netlify.toml`** (addition)

```toml
[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "https://your-api.onrender.com"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, PATCH"
    Access-Control-Allow-Headers = "Content-Type, Authorization"
    Access-Control-Allow-Credentials = "true"
```

## Rate Limiting

### Step 1: Backend Rate Limiting

**File: `market-ai/middleware/rate_limiter.py`**

```python
from fastapi import HTTPException, Request, status
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio

class RateLimiter:
    """In-memory rate limiter (use Redis in production)"""

    def __init__(self):
        self.requests = defaultdict(list)
        self.lock = asyncio.Lock()

    async def check_rate_limit(
        self,
        key: str,
        max_requests: int = 100,
        window_seconds: int = 60
    ):
        """Check if request is within rate limit"""
        async with self.lock:
            now = datetime.now()
            window_start = now - timedelta(seconds=window_seconds)

            # Clean old requests
            self.requests[key] = [
                req_time for req_time in self.requests[key]
                if req_time > window_start
            ]

            # Check limit
            if len(self.requests[key]) >= max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Max {max_requests} requests per {window_seconds} seconds."
                )

            # Add current request
            self.requests[key].append(now)

rate_limiter = RateLimiter()

async def rate_limit_middleware(request: Request, call_next):
    """Apply rate limiting to all requests"""

    # Get user ID or IP address as key
    user_id = getattr(request.state, "user_id", None)
    key = user_id or request.client.host

    # Different limits for different endpoints
    if request.url.path.startswith("/api/ai"):
        # Stricter limit for AI endpoints
        await rate_limiter.check_rate_limit(key, max_requests=10, window_seconds=60)
    else:
        # Standard limit
        await rate_limiter.check_rate_limit(key, max_requests=100, window_seconds=60)

    response = await call_next(request)
    return response

# Add to main.py
app.middleware("http")(rate_limit_middleware)
```

### Step 2: Redis-Based Rate Limiting (Production)

**File: `market-ai/middleware/redis_rate_limiter.py`**

```python
import redis
from fastapi import HTTPException, status
import os

redis_client = redis.from_url(os.getenv("REDIS_URL"))

async def redis_rate_limit(key: str, max_requests: int, window_seconds: int):
    """Redis-based rate limiting"""

    try:
        # Increment counter
        current = redis_client.incr(key)

        # Set expiry on first request
        if current == 1:
            redis_client.expire(key, window_seconds)

        # Check limit
        if current > max_requests:
            ttl = redis_client.ttl(key)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again in {ttl} seconds.",
                headers={"Retry-After": str(ttl)}
            )

    except redis.RedisError as e:
        # Fail open (allow request) if Redis is down
        print(f"Redis error: {e}")
```

## Content Security Policy (CSP)

### Strict CSP Headers

**File: `agentic-crm-template/netlify.toml`** (addition)

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = '''
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.com https://*.clerk.accounts.dev;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https: blob:;
      font-src 'self' data: https://fonts.gstatic.com;
      connect-src 'self' https://*.clerk.accounts.dev https://your-api.onrender.com;
      frame-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    '''
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
```

## CSRF Protection

### Step 1: CSRF Tokens

**File: `market-ai/middleware/csrf.py`**

```python
from fastapi import HTTPException, Request, status
import secrets
import hmac
import hashlib
import os

SECRET_KEY = os.getenv("CSRF_SECRET_KEY", "change-in-production")

def generate_csrf_token() -> str:
    """Generate CSRF token"""
    token = secrets.token_urlsafe(32)
    return token

def verify_csrf_token(token: str, expected: str) -> bool:
    """Verify CSRF token using constant-time comparison"""
    return hmac.compare_digest(token, expected)

async def csrf_protection(request: Request):
    """CSRF protection middleware"""

    # Only check for state-changing methods
    if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
        # Get token from header
        csrf_token = request.headers.get("X-CSRF-Token")

        # Get expected token from session/cookie
        expected_token = request.cookies.get("csrf_token")

        if not csrf_token or not expected_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token missing"
            )

        if not verify_csrf_token(csrf_token, expected_token):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid CSRF token"
            )
```

## Password Security

### Step 1: Password Hashing

**File: `market-ai/services/password_service.py`**

```python
from passlib.context import CryptContext
import re

# Use bcrypt with recommended rounds
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class PasswordService:
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password securely"""
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def validate_password_strength(password: str) -> bool:
        """
        Validate password meets security requirements:
        - At least 8 characters
        - Contains uppercase letter
        - Contains lowercase letter
        - Contains number
        - Contains special character
        """
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters")

        if not re.search(r"[A-Z]", password):
            raise ValueError("Password must contain uppercase letter")

        if not re.search(r"[a-z]", password):
            raise ValueError("Password must contain lowercase letter")

        if not re.search(r"\d", password):
            raise ValueError("Password must contain number")

        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            raise ValueError("Password must contain special character")

        # Check against common passwords
        common_passwords = ["password", "123456", "qwerty"]
        if password.lower() in common_passwords:
            raise ValueError("Password is too common")

        return True
```

## Data Encryption

### Step 1: Encrypt Sensitive Fields

**File: `market-ai/utils/encryption.py`**

```python
from cryptography.fernet import Fernet
import os
import base64

# Generate key: Fernet.generate_key()
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY").encode()
cipher = Fernet(ENCRYPTION_KEY)

def encrypt_data(data: str) -> str:
    """Encrypt sensitive data"""
    encrypted = cipher.encrypt(data.encode())
    return base64.b64encode(encrypted).decode()

def decrypt_data(encrypted_data: str) -> str:
    """Decrypt sensitive data"""
    encrypted = base64.b64decode(encrypted_data.encode())
    decrypted = cipher.decrypt(encrypted)
    return decrypted.decode()

# Usage
api_key = "sk-secret-key"
encrypted_key = encrypt_data(api_key)  # Store this
decrypted_key = decrypt_data(encrypted_key)  # Use this
```

## Security Headers Checklist

**File: `market-ai/middleware/security_headers.py`**

```python
async def security_headers_middleware(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)

    # Security headers
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

    # Remove server header (hide tech stack)
    if "Server" in response.headers:
        del response.headers["Server"]

    # Remove X-Powered-By (if any)
    if "X-Powered-By" in response.headers:
        del response.headers["X-Powered-By"]

    return response

app.middleware("http")(security_headers_middleware)
```

## Audit Logging

**File: `market-ai/services/audit_service.py`**

```python
from datetime import datetime
from loguru import logger

class AuditService:
    @staticmethod
    async def log_event(
        user_id: str,
        action: str,
        resource: str,
        resource_id: str,
        metadata: dict = None
    ):
        """Log security-relevant events"""

        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "resource_id": resource_id,
            "metadata": metadata or {},
        }

        logger.info("AUDIT", extra=event)

        # Store in database for compliance
        await store_audit_log(event)

# Usage
await AuditService.log_event(
    user_id="user-123",
    action="DELETE",
    resource="campaign",
    resource_id="campaign-456",
    metadata={"reason": "user_request"}
)
```

## Security Testing

### OWASP ZAP Scan

**File: `market-ai/scripts/security_scan.sh`**

```bash
#!/bin/bash

# Run OWASP ZAP security scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://your-api.onrender.com \
  -r security-report.html

# Check for vulnerabilities
if [ $? -ne 0 ]; then
  echo "❌ Security vulnerabilities found!"
  exit 1
fi

echo "✅ Security scan passed"
```

## Troubleshooting

### Common Security Issues

1. **CORS errors in production**
   - Verify allowed origins match exactly
   - Check protocol (http vs https)
   - Ensure credentials flag matches

2. **CSP violations**
   - Check browser console for blocked resources
   - Add domains to CSP whitelist
   - Use nonce for inline scripts

3. **Rate limit false positives**
   - Adjust limits for legitimate usage
   - Implement user-specific limits
   - Add rate limit bypass for admins

## Best Practices

1. **Never commit secrets** - Use .env files
2. **Validate all inputs** - Client and server side
3. **Use parameterized queries** - Prevent SQL injection
4. **Implement rate limiting** - Prevent abuse
5. **Enable HTTPS only** - Encrypt all traffic
6. **Set security headers** - Defense in depth
7. **Hash passwords** - Use bcrypt
8. **Encrypt sensitive data** - At rest and in transit
9. **Audit security events** - Know what's happening
10. **Regular security reviews** - Stay updated

## Next Steps

1. **Documentation (Document 36)** - User and API docs
2. **Penetration Testing** - Hire security firm
3. **Bug Bounty Program** - Community security
4. **Security Training** - Educate team
5. **Compliance Certifications** - SOC 2, ISO 27001

---

**Security Checklist:**
- [ ] API keys protected (not in frontend)
- [ ] Environment variables validated
- [ ] Input validation (Zod + Pydantic)
- [ ] XSS prevention implemented
- [ ] SQL injection prevented (parameterized queries)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] CSP headers set
- [ ] CSRF protection implemented
- [ ] Password hashing (bcrypt)
- [ ] Sensitive data encrypted
- [ ] Security headers configured
- [ ] Audit logging enabled
- [ ] HTTPS enforced
- [ ] Security scan passing
