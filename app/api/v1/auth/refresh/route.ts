// app/api/v1/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyRefreshToken, generateTokenPair } from '@/lib/auth/jwt';
import { fetchUserPermissions } from '@/lib/auth/permissions';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token required' },
        { status: 401 }
      );
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // ── Get user ─────────────────────────────────────────────
    const rows = await query<any[]>(
      `SELECT id, usertype, full_name, name, email, status
       FROM users WHERE id = ? AND status = 1`,
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

    const tokenPayload = {
      id      : user.id,
      email   : user.email,
      usertype: user.usertype,
      name    : user.name || user.full_name,
      fullName: user.full_name,
    };

    const tokens = generateTokenPair(tokenPayload);

    const response = NextResponse.json({
      success : true,
      data    : {
        token      : tokens.accessToken,
        user,
        permissions,
      },
    });

    response.cookies.set('auth_token', tokens.accessToken, {
      httpOnly : true,
      secure   : process.env.NODE_ENV === 'production',
      sameSite : 'lax',
      maxAge   : 7 * 24 * 60 * 60,
      path     : '/',
    });

    return response;

  } catch (error) {
    console.error('[Refresh Error]', error);
    return NextResponse.json(
      { success: false, message: 'Token refresh failed' },
      { status: 500 }
    );
  }
}