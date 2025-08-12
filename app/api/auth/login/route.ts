import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { userRepository } from '@/lib/db/axiodb-user-repository';
import { LoginCredentials, User } from '@/lib/types/user';
import { authRateLimiter, createRateLimitResponse } from '@/lib/auth/rate-limiter';

export async function POST(request: NextRequest) {
  // Check rate limit first
  if (authRateLimiter.isRateLimited(request)) {
    const info = authRateLimiter.getRateLimitInfo(request);
    return createRateLimitResponse(info.resetTime, info.remaining);
  }

  try {
    const body = await request.json();
    const { email, password }: LoginCredentials = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      // Record failed attempt
      authRateLimiter.recordAttempt(request, false);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isMatch) {
      // Record failed attempt
      authRateLimiter.recordAttempt(request, false);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session with 24-hour expiry for security
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const sessionId = await userRepository.createSession(user.id, expiresAt);

    // Record successful attempt (this will reset the counter)
    authRateLimiter.recordAttempt(request, true);

    // Remove password hash from response
    const { passwordHash, ...userResponse } = user;

    const response = NextResponse.json({
      success: true,
      user: userResponse,
      message: 'Logged in successfully'
    });

    // Set session cookie
    response.cookies.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}