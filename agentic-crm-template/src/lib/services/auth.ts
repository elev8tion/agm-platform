// Mock Authentication Service
// Production-ready interface - swap for real JWT/bcrypt when ready

import { dataStore, type User } from './dataStore';

export type AuthSession = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
  };
  token: string;
  expiresAt: Date;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterData = {
  email: string;
  password: string;
  name: string;
  tenantId: string;
  role?: 'ADMIN' | 'BROKER' | 'AGENT' | 'VIEWER';
};

class AuthService {
  private activeSessions: Map<string, AuthSession> = new Map();

  // ===== MOCK PASSWORD HASHING =====
  async hashPassword(password: string): Promise<string> {
    // In production: use bcrypt
    // return await bcrypt.hash(password, 10);
    console.log('[MOCK AUTH] Hashing password (would use bcrypt in production)');
    return `$2a$10$mock.hash.${password.substring(0, 10)}`;
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    // In production: use bcrypt
    // return await bcrypt.compare(password, hash);
    console.log('[MOCK AUTH] Comparing password (would use bcrypt in production)');
    // Mock: accept "password123" for demo users
    return password === 'password123' || hash.includes(password.substring(0, 10));
  }

  // ===== MOCK JWT TOKEN GENERATION =====
  generateToken(user: User): string {
    // In production: use jsonwebtoken or jose
    // const token = jwt.sign(
    //   { userId: user.id, email: user.email, tenantId: user.tenantId },
    //   process.env.JWT_SECRET,
    //   { expiresIn: '7d' }
    // );
    console.log('[MOCK AUTH] Generating JWT token (would use jose in production)');
    const mockToken = `mock.jwt.${user.id}.${Date.now()}`;
    return mockToken;
  }

  verifyToken(token: string): { userId: string; email: string; tenantId: string } | null {
    // In production: use jsonwebtoken or jose
    // try {
    //   const payload = jwt.verify(token, process.env.JWT_SECRET);
    //   return payload;
    // } catch {
    //   return null;
    // }
    console.log('[MOCK AUTH] Verifying JWT token (would use jose in production)');

    const session = this.activeSessions.get(token);
    if (!session) return null;

    if (session.expiresAt < new Date()) {
      this.activeSessions.delete(token);
      return null;
    }

    return {
      userId: session.user.id,
      email: session.user.email,
      tenantId: session.user.tenantId
    };
  }

  // ===== LOGIN =====
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    console.log(`[MOCK AUTH] Login attempt for ${credentials.email}`);

    // Find user by email
    const user = await dataStore.getUserByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await this.comparePassword(credentials.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is inactive');
    }

    // Generate token
    const token = this.generateToken(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session: AuthSession = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId
      },
      token,
      expiresAt
    };

    // Store session
    this.activeSessions.set(token, session);

    console.log(`[MOCK AUTH] ✅ Login successful for ${user.email}`);
    return session;
  }

  // ===== REGISTER =====
  async register(data: RegisterData): Promise<AuthSession> {
    console.log(`[MOCK AUTH] Registration attempt for ${data.email}`);

    // Check if user already exists
    const existing = await dataStore.getUserByEmail(data.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user
    const user = await dataStore.createUser({
      email: data.email,
      name: data.name,
      tenantId: data.tenantId,
      role: data.role || 'AGENT',
      passwordHash,
      twoFactorEnabled: false,
      isActive: true
    });

    // Generate token
    const token = this.generateToken(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session: AuthSession = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId
      },
      token,
      expiresAt
    };

    this.activeSessions.set(token, session);

    console.log(`[MOCK AUTH] ✅ Registration successful for ${user.email}`);
    return session;
  }

  // ===== LOGOUT =====
  async logout(token: string): Promise<void> {
    console.log('[MOCK AUTH] Logout');
    this.activeSessions.delete(token);
  }

  // ===== GET CURRENT SESSION =====
  async getSession(token: string): Promise<AuthSession | null> {
    const session = this.activeSessions.get(token);
    if (!session) return null;

    if (session.expiresAt < new Date()) {
      this.activeSessions.delete(token);
      return null;
    }

    return session;
  }

  // ===== REFRESH TOKEN =====
  async refreshToken(oldToken: string): Promise<AuthSession> {
    console.log('[MOCK AUTH] Refreshing token');

    const session = await this.getSession(oldToken);
    if (!session) {
      throw new Error('Invalid or expired token');
    }

    // Get fresh user data
    const user = await dataStore.getUser(session.user.id);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Remove old session
    this.activeSessions.delete(oldToken);

    // Generate new token
    const newToken = this.generateToken(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newSession: AuthSession = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId
      },
      token: newToken,
      expiresAt
    };

    this.activeSessions.set(newToken, newSession);

    console.log('[MOCK AUTH] ✅ Token refreshed');
    return newSession;
  }

  // ===== PASSWORD RESET =====
  async requestPasswordReset(email: string): Promise<void> {
    console.log(`[MOCK AUTH] Password reset requested for ${email}`);

    const user = await dataStore.getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      console.log('[MOCK AUTH] User not found, but not revealing this');
      return;
    }

    // In production: generate reset token and send email
    // const resetToken = crypto.randomBytes(32).toString('hex');
    // await emailService.sendPasswordReset(user.email, resetToken);

    console.log('[MOCK AUTH] ✉️ Password reset email would be sent (using Resend in production)');
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    console.log('[MOCK AUTH] Password reset with token');

    // In production: verify reset token and update password
    // const userId = await verifyResetToken(token);
    // const user = await dataStore.getUser(userId);
    // const passwordHash = await this.hashPassword(newPassword);
    // await updateUserPassword(userId, passwordHash);

    console.log('[MOCK AUTH] ✅ Password would be reset (mock mode)');
  }

  // ===== 2FA METHODS =====
  async enable2FA(userId: string): Promise<{ secret: string; qrCode: string }> {
    console.log(`[MOCK AUTH] Enabling 2FA for user ${userId}`);

    // In production: generate TOTP secret
    // const secret = speakeasy.generateSecret();
    // const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: 'MOCK2FASECRET',
      qrCode: 'data:image/png;base64,mock-qr-code'
    };
  }

  async verify2FA(userId: string, token: string): Promise<boolean> {
    console.log(`[MOCK AUTH] Verifying 2FA token for user ${userId}`);

    // In production: verify TOTP token
    // return speakeasy.totp.verify({
    //   secret: user.twoFactorSecret,
    //   encoding: 'base32',
    //   token
    // });

    return token === '123456'; // Mock: accept "123456"
  }
}

export const authService = new AuthService();

// ===== MIDDLEWARE HELPER =====
export function requireAuth(token: string | undefined): AuthSession {
  if (!token) {
    throw new Error('Authentication required');
  }

  const payload = authService.verifyToken(token);
  if (!payload) {
    throw new Error('Invalid or expired token');
  }

  // This would fetch the full session in a real implementation
  return {
    user: {
      id: payload.userId,
      email: payload.email,
      name: '', // Would be fetched from DB
      role: '', // Would be fetched from DB
      tenantId: payload.tenantId
    },
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };
}

// ===== PRODUCTION INTEGRATION NOTES =====
/*
TO SWITCH TO PRODUCTION:

1. Install dependencies (already done):
   - bcryptjs for password hashing
   - jose or jsonwebtoken for JWT tokens
   - speakeasy for 2FA (optional)

2. Replace mock methods:
   - hashPassword: use bcrypt.hash()
   - comparePassword: use bcrypt.compare()
   - generateToken: use jose or jwt.sign()
   - verifyToken: use jose or jwt.verify()

3. Add environment variables:
   - JWT_SECRET: secret key for signing tokens
   - JWT_EXPIRY: token expiration (e.g., "7d")

4. Integrate with Prisma:
   - Replace dataStore calls with Prisma client
   - Add sessions table for refresh tokens
   - Add password reset tokens table

5. Add email service:
   - Send password reset emails via Resend
   - Send verification emails
   - Send 2FA setup instructions

Example production code:

import bcrypt from 'bcryptjs';
import * as jose from 'jose';

async hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

async generateToken(user: User): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const token = await new jose.SignJWT({
    userId: user.id,
    email: user.email,
    tenantId: user.tenantId
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
  return token;
}
*/
