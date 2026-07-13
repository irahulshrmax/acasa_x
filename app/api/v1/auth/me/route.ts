// app/api/v1/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';          // ✅ getPool → query
import { verifyToken } from '@/lib/auth/jwt';
import { fetchUserPermissions } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    const authHeader  = request.headers.get('Authorization');
    const cookieToken = request.cookies.get('auth_token')?.value;
    const token       = authHeader?.replace('Bearer ', '') || cookieToken;

    // ── Token check ──────────────────────────────────────────
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // ── Verify token ─────────────────────────────────────────
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // ── Get user ─────────────────────────────────────────────
    const rows = await query<any[]>(                    // ✅ direct query
      `SELECT id, usertype, full_name, name, email, phone, photo,
              status, first_login, first_name, last_name,
              country, city, provider, provider_id
       FROM users
       WHERE id = ? AND status = 1`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 401 }
      );
    }

    const user        = rows[0];
    const permissions = await fetchUserPermissions(user.id, user.usertype);

    return NextResponse.json({
      success : true,
      data    : { user, permissions },
    });

  } catch (error) {
    console.error('[Me Error]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}