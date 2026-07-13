// app/api/v1/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';           // ✅ getPool nahi - query import
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth/jwt';
import { fetchUserPermissions, getRedirectPath } from '@/lib/auth/permissions';
import { syncUserToZoho } from '@/lib/models/zoho';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, email, phone, password } = body;

    console.log('📝 Registration attempt:', { full_name, email, phone });

    // ─── Validation ──────────────────────────────────
    if (!full_name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // ─── Check existing user ─────────────────────────
    const existing = await query<any[]>(
      'SELECT id FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 409 }
      );
    }

    // ─── Save to Database ────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query<any>(
      `INSERT INTO users 
        (full_name, name, email, phone, password, usertype, status, 
         public_permision, category, nationality, marital_status, 
         originality, languages, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'User', 1, 1, '(Primary; Secondary)', 
               '', '', '', '', NOW(), NOW())`,
      [
        full_name.trim(),
        full_name.trim(),
        email.trim().toLowerCase(),
        phone?.trim() || null,
        hashedPassword,
      ]
    );

    const userId = result.insertId;
    console.log('✅ User registered in DB, ID:', userId);

    // ─── Get user data ──────────────────────────────
    const userRows = await query<any[]>(
      `SELECT id, usertype, full_name, name, email, phone, 
              photo, status, first_login 
       FROM users WHERE id = ?`,
      [userId]
    );

    const user = userRows[0];

    // ─── Sync to Zoho CRM ────────────────────────────
    let zohoResult = null;
    try {
      zohoResult = await syncUserToZoho(user);
      console.log('📤 Zoho sync result:', zohoResult);
    } catch (zohoError) {
      console.error('❌ Zoho sync error (non-blocking):', zohoError);
    }

    // ─── Generate token ──────────────────────────────
    const permissions = await fetchUserPermissions(user.id, user.usertype);

    const token = generateToken({
      id       : user.id,
      email    : user.email,
      usertype : user.usertype,
      name     : user.name || user.full_name,
      fullName : user.full_name,
    });

    // ─── Response ────────────────────────────────────
    const response = NextResponse.json({
      success : true,
      message : 'Registration successful',
      data    : {
        user,
        permissions,
        token,
        redirectTo : getRedirectPath(user.usertype),
        zoho       : zohoResult,
      },
    }, { status: 201 });

    response.cookies.set('auth_token', token, {
      httpOnly : true,
      secure   : process.env.NODE_ENV === 'production',
      sameSite : 'lax',
      maxAge   : 7 * 24 * 60 * 60,
      path     : '/',
    });

    return response;

  } catch (error) {
    console.error('[Register Error]', error);
    return NextResponse.json(
      { success: false, message: 'Registration failed' },
      { status: 500 }
    );
  }
}