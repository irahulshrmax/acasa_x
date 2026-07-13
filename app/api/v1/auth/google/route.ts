// app/api/v1/auth/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';           // ✅ getPool → query
import { OAuth2Client } from 'google-auth-library';
import { generateToken } from '@/lib/auth/jwt';
import { fetchUserPermissions, getRedirectPath } from '@/lib/auth/permissions';
import { syncUserToZoho } from '@/lib/models/zoho'; // ✅ zoho/sync → models/zoho

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential } = body;

    console.log('🔑 Google auth attempt');

    if (!credential) {
      return NextResponse.json(
        { success: false, message: 'Google credential is required' },
        { status: 400 }
      );
    }

    // ─── Verify Google Token ─────────────────────────
    const ticket = await client.verifyIdToken({
      idToken  : credential,
      audience : process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      return NextResponse.json(
        { success: false, message: 'Invalid Google token' },
        { status: 400 }
      );
    }

    const { sub: googleId, email, name, picture } = payload;
    console.log('👤 Google user:', { email, name });

    // ─── Check existing user ─────────────────────────
    const existing = await query<any[]>(
      `SELECT id, usertype, full_name, name, email, phone,
              photo, status, provider, provider_id
       FROM users WHERE email = ?`,
      [email.toLowerCase()]
    );

    let user: any;
    let isNewUser = false;

    if (existing.length > 0) {
      // ── Existing user ────────────────────────────
      user = existing[0];
      console.log('✅ Existing user found, ID:', user.id);

      if (user.status !== 1) {
        return NextResponse.json(
          { success: false, message: 'Account deactivated' },
          { status: 403 }
        );
      }

      // Update Google provider info if missing
      if (!user.provider_id) {
        await query(
          `UPDATE users
           SET provider    = 'google',
               provider_id = ?,
               photo       = COALESCE(photo, ?),
               updated_at  = NOW()
           WHERE id = ?`,
          [googleId, picture || null, user.id]
        );

        const updated = await query<any[]>(
          `SELECT id, usertype, full_name, name, email,
                  phone, photo, status, first_login
           FROM users WHERE id = ?`,
          [user.id]
        );
        user = updated[0];
      }

    } else {
      // ── New user ─────────────────────────────────
      isNewUser = true;
      console.log('📝 Creating new user from Google');

      const result = await query<any>(
        `INSERT INTO users
          (full_name, name, email, provider, provider_id, photo,
           usertype, status, public_permision, category, nationality,
           marital_status, originality, languages, created_at, updated_at)
         VALUES (?, ?, ?, 'google', ?, ?, 'User', 1, 1,
                 '(Primary; Secondary)', '', '', '', '', NOW(), NOW())`,
        [
          name || 'Google User',
          name || 'User',
          email.toLowerCase(),
          googleId,
          picture || null,
        ]
      );

      const newUser = await query<any[]>(
        `SELECT id, usertype, full_name, name, email,
                phone, photo, status, first_login
         FROM users WHERE id = ?`,
        [result.insertId]
      );

      user = newUser[0];
      console.log('✅ New user created, ID:', user.id);
    }

    // ─── Sync to Zoho (new users only) ───────────────
    let zohoResult = null;
    if (isNewUser) {
      try {
        zohoResult = await syncUserToZoho({
          id         : user.id,
          full_name  : user.full_name,
          name       : user.name,
          email      : user.email,
          phone      : user.phone,
          usertype   : user.usertype,
          status     : user.status,
          provider   : 'google',
          provider_id: googleId,
        });
        console.log('📤 Zoho sync result:', zohoResult);
      } catch (zohoError) {
        console.error('❌ Zoho sync error (non-blocking):', zohoError);
      }
    }

    // ─── Permissions + Token ─────────────────────────
    const permissions = await fetchUserPermissions(user.id, user.usertype);

    const token = generateToken({
      id       : user.id,
      email    : user.email,
      usertype : user.usertype,
      name     : user.name || user.full_name,
      fullName : user.full_name,
    });

    // ─── Update last seen ────────────────────────────
    await query(
      'UPDATE users SET updated_at = NOW() WHERE id = ?',
      [user.id]
    );

    // ─── Response ────────────────────────────────────
    const response = NextResponse.json({
      success : true,
      message : isNewUser ? 'Account created successfully' : 'Login successful',
      data    : {
        user,
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
      maxAge   : 7 * 24 * 60 * 60,
      path     : '/',
    });

    return response;

  } catch (error) {
    console.error('[Google Auth Error]', error);
    return NextResponse.json(
      { success: false, message: 'Google authentication failed' },
      { status: 500 }
    );
  }
}