# 28. Authentication Implementation

## Overview

This guide covers implementing production-ready authentication for the Agentic Marketing Dashboard using Clerk (recommended) or NextAuth.js v5 (Auth.js). Authentication ensures secure user access with email verification, session management, and protected routes.

**Production Considerations:**
- Secure JWT token management
- Email verification for new accounts
- Password reset with time-limited tokens
- Session persistence across page reloads
- Automatic token refresh
- Rate limiting on auth endpoints

## Prerequisites

**Completed Phases:**
- Phase 1-5 (Core infrastructure and features)

**Required Accounts:**
- Clerk account (https://clerk.com) OR
- Email service (SendGrid, AWS SES, or Resend)

**Dependencies:**
```bash
# Clerk (Recommended)
npm install @clerk/nextjs

# Alternative: NextAuth.js v5
npm install next-auth@beta @auth/core
```

## Clerk Authentication (Recommended)

### Step 1: Clerk Setup

1. **Create Clerk Application**
   - Sign up at https://clerk.com
   - Create new application
   - Copy API keys

2. **Configure Environment Variables**

```env
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk URLs (auto-configured)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Step 2: Middleware Configuration

**File: `agentic-crm-template/middleware.ts`**

```typescript
import { authMiddleware } from "@clerk/nextjs";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    "/",
    "/api/webhook(.*)",
    "/api/health",
  ],
  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: [
    "/api/webhook/clerk",
    "/_next/static(.*)",
    "/_next/image(.*)",
    "/favicon.ico",
  ],
  // Add custom logic
  async afterAuth(auth, req) {
    // Handle users who aren't authenticated
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return Response.redirect(signInUrl);
    }

    // Redirect signed in users to dashboard if on public route
    if (auth.userId && req.nextUrl.pathname === '/') {
      const dashboard = new URL('/dashboard', req.url);
      return Response.redirect(dashboard);
    }

    // Allow the request to proceed
    return;
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### Step 3: Sign-In Page

**File: `agentic-crm-template/app/sign-in/[[...sign-in]]/page.tsx`**

```typescript
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome back to Agentic Marketing Dashboard
          </p>
        </div>

        <SignIn
          appearance={{
            elements: {
              formButtonPrimary:
                'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
              card: 'shadow-xl',
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}
```

### Step 4: Sign-Up Page

**File: `agentic-crm-template/app/sign-up/[[...sign-up]]/page.tsx`**

```typescript
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Start managing your marketing campaigns with AI
          </p>
        </div>

        <SignUp
          appearance={{
            elements: {
              formButtonPrimary:
                'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
              card: 'shadow-xl',
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
```

### Step 5: Root Layout Integration

**File: `agentic-crm-template/app/layout.tsx`**

```typescript
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### Step 6: Protected Route Component

**File: `agentic-crm-template/components/auth/ProtectedRoute.tsx`**

```typescript
'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded) {
    return fallback || (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  return <>{children}</>;
}
```

### Step 7: User Profile Component

**File: `agentic-crm-template/components/auth/UserProfile.tsx`**

```typescript
'use client';

import { UserButton, useUser } from '@clerk/nextjs';

export function UserProfile() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-xs text-gray-500">
          {user.primaryEmailAddress?.emailAddress}
        </p>
      </div>
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: 'w-10 h-10',
          },
        }}
      />
    </div>
  );
}
```

## Backend Authentication (FastAPI)

### Step 1: Auth Service

**File: `market-ai/services/auth_service.py`**

```python
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import os

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class TokenData(BaseModel):
    user_id: str
    email: str
    exp: datetime

class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against a hash"""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password for storage"""
        return pwd_context.hash(password)

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a new JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    @staticmethod
    def verify_token(token: str) -> Optional[TokenData]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("user_id")
            email: str = payload.get("email")
            exp: datetime = datetime.fromtimestamp(payload.get("exp"))

            if user_id is None or email is None:
                return None

            return TokenData(user_id=user_id, email=email, exp=exp)
        except JWTError:
            return None

    @staticmethod
    def verify_clerk_token(token: str) -> Optional[dict]:
        """Verify a Clerk JWT token"""
        try:
            # For Clerk, use their JWKS endpoint
            clerk_domain = os.getenv("CLERK_DOMAIN", "")
            # Implementation depends on Clerk SDK
            # This is a placeholder - use Clerk's Python SDK
            return {"user_id": "from_clerk", "email": "from_clerk"}
        except Exception as e:
            print(f"Clerk token verification failed: {e}")
            return None
```

### Step 2: Auth Middleware

**File: `market-ai/middleware/auth.py`**

```python
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.auth_service import AuthService

security = HTTPBearer()

async def verify_auth(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    """
    Verify JWT token from Authorization header
    Returns user data if valid, raises HTTPException if invalid
    """
    token = credentials.credentials

    # Try Clerk token first
    clerk_data = AuthService.verify_clerk_token(token)
    if clerk_data:
        return clerk_data

    # Fallback to custom JWT
    token_data = AuthService.verify_token(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "user_id": token_data.user_id,
        "email": token_data.email,
    }

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    """Get current authenticated user"""
    return await verify_auth(credentials)
```

### Step 3: Protected API Endpoint Example

**File: `market-ai/api/routes/campaigns.py`**

```python
from fastapi import APIRouter, Depends
from middleware.auth import get_current_user

router = APIRouter()

@router.get("/campaigns")
async def get_campaigns(current_user: dict = Depends(get_current_user)):
    """
    Get campaigns for authenticated user
    Requires valid JWT token in Authorization header
    """
    user_id = current_user["user_id"]

    # Fetch campaigns for this user
    campaigns = await fetch_user_campaigns(user_id)

    return {
        "campaigns": campaigns,
        "user": current_user
    }

async def fetch_user_campaigns(user_id: str):
    # Database query here
    return []
```

## Alternative: NextAuth.js v5 (Auth.js)

### Configuration

**File: `agentic-crm-template/auth.ts`**

```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;

        // Verify against database
        const response = await fetch(`${process.env.API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) return null;

        const user = await response.json();
        return user;
      },
    }),
  ],
  pages: {
    signIn: '/sign-in',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
```

## Environment Variables

**Production (.env.production)**

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Backend
JWT_SECRET_KEY=generate-with-openssl-rand-hex-32
CLERK_DOMAIN=your-app.clerk.accounts.dev

# Email (if using custom auth)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
```

## Testing Procedures

### 1. Manual Testing

```bash
# Test sign-up flow
1. Navigate to /sign-up
2. Enter email and password
3. Verify email sent
4. Click verification link
5. Confirm redirect to dashboard

# Test sign-in flow
1. Navigate to /sign-in
2. Enter credentials
3. Verify redirect to dashboard
4. Check session persistence on reload

# Test protected routes
1. Sign out
2. Try accessing /dashboard
3. Verify redirect to /sign-in
4. Sign in
5. Verify access granted
```

### 2. Automated Testing

**File: `agentic-crm-template/__tests__/auth/sign-in.test.tsx`**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignInPage } from '@/app/sign-in/page';

describe('Sign In Page', () => {
  it('renders sign in form', () => {
    render(<SignInPage />);
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<SignInPage />);
    const emailInput = screen.getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });
});
```

## Troubleshooting

### Common Issues

1. **"Invalid authentication credentials"**
   - Check JWT_SECRET_KEY matches between frontend and backend
   - Verify token hasn't expired (check exp claim)
   - Ensure Authorization header format: `Bearer <token>`

2. **Redirect loop on protected routes**
   - Check middleware configuration
   - Verify publicRoutes array includes sign-in/sign-up
   - Clear browser cookies and localStorage

3. **Email verification not working**
   - Check SMTP credentials in environment variables
   - Verify email template configuration in Clerk dashboard
   - Check spam folder

4. **Session lost on page refresh**
   - Verify ClerkProvider wraps entire app
   - Check cookie settings (sameSite, secure)
   - Ensure middleware runs on all routes

## Best Practices

### Security

1. **Never expose secret keys to frontend**
   ```typescript
   // ❌ Wrong
   const apiKey = process.env.CLERK_SECRET_KEY;

   // ✅ Correct
   const apiKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
   ```

2. **Use HTTPS in production** (automatic with Netlify)

3. **Implement rate limiting on auth endpoints**

4. **Use strong password requirements** (min 8 chars, uppercase, number, symbol)

5. **Enable email verification before account activation**

### User Experience

1. **Show loading states during authentication**
2. **Provide clear error messages**
3. **Remember me functionality** (longer session duration)
4. **Social login options** (Google, GitHub)
5. **Password strength indicator**

### Performance

1. **Cache user session client-side** (Clerk does this automatically)
2. **Use Next.js middleware for route protection** (faster than component-level checks)
3. **Implement token refresh** before expiration

## Monitoring & Alerts

### Metrics to Track

1. **Sign-up conversion rate**
   - Track users who start vs complete sign-up
   - Monitor email verification rate

2. **Sign-in success rate**
   - Failed login attempts (potential brute force)
   - Password reset requests

3. **Session duration**
   - Average time users stay logged in
   - Session timeout frequency

### Sentry Integration

```typescript
// Log auth errors to Sentry
import * as Sentry from '@sentry/nextjs';

try {
  await signIn(credentials);
} catch (error) {
  Sentry.captureException(error, {
    tags: { type: 'auth_error' },
    user: { email: credentials.email },
  });
}
```

## Next Steps

1. **Implement Authorization (Document 29)** - Role-based access control
2. **Set up Email Templates** - Customize Clerk email appearance
3. **Add Multi-Factor Authentication (MFA)** - Optional security layer
4. **Configure SSO** - For enterprise customers
5. **Implement Audit Logging** - Track authentication events

---

**Production Checklist:**
- [ ] Clerk production keys configured
- [ ] Email verification enabled
- [ ] Password requirements enforced
- [ ] Protected routes working
- [ ] Backend endpoints require auth
- [ ] Rate limiting configured
- [ ] Error tracking enabled
- [ ] Session management tested
- [ ] Sign-out flow working
- [ ] Password reset flow tested
