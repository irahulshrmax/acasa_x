import { NextRequest, NextResponse } from 'next/server';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ─── Cookie names to clear ───────────────────────────────────────────────────
const COOKIE_NAMES = [
  'auth_token',
  'admin_token',
  'admin_role',
  'admin_user',
  'user_token',
  'user_role',
  'user_data',
  'session_id',
  'refresh_token',
] as const;

// ─── Cookie options for deletion ─────────────────────────────────────────────
function getDeleteCookieOptions() {
  const options: any = {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax' as const,
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  };

  // ONLY set domain in production and ensure it matches exactly
  if (IS_PRODUCTION) {
    // Important: The domain MUST start with a dot
    options.domain = '.acasa.ae';
  }

  return options;
}

export async function POST(request: NextRequest) {
  try {
    // ── Detect logout type from request ────────────────────────────────────
    const body = await request.json().catch(() => ({}));
    const logoutType = body?.type || 'all'; // 'admin' | 'user' | 'all'

    // ── Determine which cookies to clear ───────────────────────────────────
    let cookiesToClear: string[] = [];

    if (logoutType === 'admin') {
      cookiesToClear = ['auth_token', 'admin_token', 'admin_role', 'admin_user'];
    } else if (logoutType === 'user') {
      cookiesToClear = ['auth_token', 'user_token', 'user_role', 'user_data'];
    } else {
      // Clear all cookies
      cookiesToClear = [...COOKIE_NAMES];
    }

    // ── Build response ─────────────────────────────────────────────────────
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
      data: {
        type: logoutType,
        clearedCookies: cookiesToClear,
      },
    });

    // ── Delete cookies ─────────────────────────────────────────────────────
    const deleteOptions = getDeleteCookieOptions();

    // IMPORTANT: Delete each cookie with the EXACT same options used when setting
    for (const cookieName of cookiesToClear) {
      // Method 1: Set empty cookie with maxAge 0 and expires in past
      response.cookies.set({
        name: cookieName,
        value: '',
        ...deleteOptions,
      });

      // Method 2: Explicit delete (Next.js handles this internally)
      // Note: delete() might not work with custom domains in all versions
      // So we use both methods
      response.cookies.delete(cookieName);
    }

    // ─── Also set a response header to clear cookies (fallback) ────────────
    // This is an additional layer of protection
    const cookieHeaders = cookiesToClear.map(name => {
      const parts = [
        `${name}=;`,
        'Max-Age=0;',
        'Expires=Thu, 01 Jan 1970 00:00:00 GMT;',
        'Path=/;',
      ];
      if (IS_PRODUCTION) {
        parts.push('Domain=.acasa.ae;');
      }
      parts.push('HttpOnly;');
      if (IS_PRODUCTION) {
        parts.push('Secure;');
      }
      parts.push('SameSite=Lax;');
      return parts.join(' ');
    });

    // Add multiple Set-Cookie headers
    cookieHeaders.forEach(header => {
      response.headers.append('Set-Cookie', header);
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}

// ─── GET method for simple logout via URL ────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const logoutType = searchParams.get('type') || 'all';

    let cookiesToClear: string[] = [];

    if (logoutType === 'admin') {
      cookiesToClear = ['auth_token', 'admin_token', 'admin_role', 'admin_user'];
    } else if (logoutType === 'user') {
      cookiesToClear = ['auth_token', 'user_token', 'user_role', 'user_data'];
    } else {
      cookiesToClear = [...COOKIE_NAMES];
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
      data: {
        type: logoutType,
        clearedCookies: cookiesToClear,
      },
    });

    const deleteOptions = getDeleteCookieOptions();

    for (const cookieName of cookiesToClear) {
      response.cookies.set({
        name: cookieName,
        value: '',
        ...deleteOptions,
      });
      response.cookies.delete(cookieName);
    }

    // Also add raw Set-Cookie headers
    const cookieHeaders = cookiesToClear.map(name => {
      const parts = [
        `${name}=;`,
        'Max-Age=0;',
        'Expires=Thu, 01 Jan 1970 00:00:00 GMT;',
        'Path=/;',
      ];
      if (IS_PRODUCTION) {
        parts.push('Domain=.acasa.ae;');
      }
      parts.push('HttpOnly;');
      if (IS_PRODUCTION) {
        parts.push('Secure;');
      }
      parts.push('SameSite=Lax;');
      return parts.join(' ');
    });

    cookieHeaders.forEach(header => {
      response.headers.append('Set-Cookie', header);
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}