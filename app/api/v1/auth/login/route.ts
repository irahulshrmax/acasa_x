// app/api/v1/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';           // ✅ getPool nahi - query import
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth/jwt';
import { fetchUserPermissions, getRedirectPath } from '@/lib/auth/permissions';
import { syncUserToZoho } from '@/lib/models/zoho';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe = false } = body;

    console.log('🔑 Login attempt:', { email });

    // ─── Validation ──────────────────────────────────
    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // ─── Get user ────────────────────────────────────
    const rows = await query<any[]>(
      `SELECT id, usertype, full_name, name, email, password,
              phone, photo, status, first_login
       FROM users WHERE email = ?`,
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = rows[0];

    // ─── Status check ────────────────────────────────
    if (user.status !== 1) {
      return NextResponse.json(
        { success: false, message: 'Account deactivated' },
        { status: 403 }
      );
    }

    // ─── Password check ──────────────────────────────
    if (!user.password) {
      return NextResponse.json(
        { success: false, message: 'Account uses Google Sign-In' },
        { status: 400 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // ─── Sync to Zoho ────────────────────────────────
    let zohoResult = null;
    try {
      zohoResult = await syncUserToZoho({
        id        : user.id,
        full_name : user.full_name,
        name      : user.name,
        email     : user.email,
        phone     : user.phone,
        usertype  : user.usertype,
        status    : user.status,
        provider  : 'email',
      });
      console.log('📤 Zoho sync result:', zohoResult);
    } catch (zohoError) {
      console.error('❌ Zoho sync error (non-blocking):', zohoError);
    }

    // ─── Permissions + Token ─────────────────────────
    const permissions = await fetchUserPermissions(user.id, user.usertype);

    const token = generateToken(
      {
        id       : user.id,
        email    : user.email,
        usertype : user.usertype,
        name     : user.name || user.full_name,
        fullName : user.full_name,
      },
      rememberMe
    );

    // ─── Update last seen ────────────────────────────
    await query(
      'UPDATE users SET updated_at = NOW() WHERE id = ?',
      [user.id]
    );

    // ─── Safe user (no password) ─────────────────────
    const { password: _, ...safeUser } = user;

    // ─── Response ────────────────────────────────────
    const expiresIn = rememberMe
      ? 30 * 24 * 60 * 60
      :  7 * 24 * 60 * 60;

    const response = NextResponse.json({
      success : true,
      message : 'Login successful',
      data    : {
        user       : safeUser,
        permissions,
        token,
        redirectTo : getRedirectPath(user.usertype),
        zoho       : zohoResult,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly : true,
      secure   : process.env.NODE_ENV === 'production',
      sameSite : 'lax',
      maxAge   : expiresIn,
      path     : '/',
    });

    return response;

  } catch (error) {
    console.error('[Login Error]', error);
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    );
  }
}