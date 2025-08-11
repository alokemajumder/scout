import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { userRepository } from '@/lib/db/simple-user-repository';
import { LoginCredentials, LocalUser } from '@/lib/types/user';

export async function POST(request: NextRequest) {
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
    const user = await userRepository.findByEmail(email) as LocalUser;
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (user.provider !== 'local') {
      return NextResponse.json(
        { success: false, error: 'Please use social login for this account' },
        { status: 401 }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const sessionId = await userRepository.createSession(user.id, expiresAt);

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