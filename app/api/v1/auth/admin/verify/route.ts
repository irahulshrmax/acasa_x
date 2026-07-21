import { NextRequest, NextResponse } from 'next/server';

// ─── logger (works in both dev & prod — visible in Vercel/server logs) ───────
const log = {
  info : (...a: unknown[]) => console.log  ('[verify]', new Date().toISOString(), ...a),
  warn : (...a: unknown[]) => console.warn ('[verify]', new Date().toISOString(), ...a),
  error: (...a: unknown[]) => console.error('[verify]', new Date().toISOString(), ...a),
};

export async function GET(request: NextRequest) {
  // ── 1. log every incoming request ─────────────────────────────────────────
  log.info('→ GET /api/v1/auth/admin/verify called', {
    url    : request.url,
    method : request.method,

    // log cookie NAMES only — never log raw token values in production
    cookieKeys: [...request.cookies.getAll()].map(c => c.name),

    // useful to detect missing cookies in prod
    hasAdminToken: !!request.cookies.get('admin_token')?.value,
    hasAdminRole : !!request.cookies.get('admin_role')?.value,
    hasAdminUser : !!request.cookies.get('admin_user')?.value,

    // helps debug cookie domain/path issues
    referer  : request.headers.get('referer'),
    origin   : request.headers.get('origin'),
    userAgent: request.headers.get('user-agent'),
  });

  try {
    const token     = request.cookies.get('admin_token')?.value;
    const role      = request.cookies.get('admin_role')?.value;
    const adminUser = request.cookies.get('admin_user')?.value;

    // ── 2. missing token or role ───────────────────────────────────────────
    if (!token || !role) {
      log.warn('← 401 Not authenticated', {
        missingToken: !token,
        missingRole : !role,
        // helps diagnose: "cookie exists in browser but not here"
        // usually means cookie domain/path/secure mismatch
        allCookies  : [...request.cookies.getAll()].map(c => c.name),
      });

      return NextResponse.json(
        {
          success   : false,
          message   : 'Not authenticated',
          redirectTo: '/admin/login',
        },
        { status: 401 }
      );
    }

    // ── 3. role check ──────────────────────────────────────────────────────
    const roleLower = role.toLowerCase();
    const isAdmin   = roleLower === 'admin' || roleLower === 'super_admin';

    log.info('Role check', {
      rawRole : role,
      roleLower,
      isAdmin,
      // first/last 6 chars of token — enough to confirm it exists, not expose it
      tokenPreview: token.length > 12
        ? `${token.slice(0, 6)}...${token.slice(-6)}`
        : '[too short]',
      tokenLength: token.length,
    });

    if (!isAdmin) {
      log.warn('← 403 Admin access required', { roleLower });

      return NextResponse.json(
        {
          success   : false,
          message   : 'Admin access required',
          redirectTo: '/admin/login',
        },
        { status: 403 }
      );
    }

    // ── 4. parse user JSON ─────────────────────────────────────────────────
    let parsedUser: Record<string, unknown> | null = null;

    if (adminUser) {
      try {
        parsedUser = JSON.parse(adminUser);
        log.info('Parsed admin_user cookie OK', {
          // log shape but not sensitive values
          keys: Object.keys(parsedUser ?? {}),
        });
      } catch (parseErr) {
        // not fatal — we still let them through if token+role are valid
        log.warn('Failed to parse admin_user cookie — continuing anyway', {
          error         : parseErr instanceof Error ? parseErr.message : String(parseErr),
          adminUserLength: adminUser.length,
          // first 30 chars to spot obvious corruption
          adminUserPreview: adminUser.slice(0, 30),
        });
        parsedUser = null;
      }
    } else {
      log.info('No admin_user cookie present — user will be null in response');
    }

    // ── 5. success ─────────────────────────────────────────────────────────
    log.info('← 200 Authenticated', {
      role     : roleLower,
      userKeys : parsedUser ? Object.keys(parsedUser) : null,
    });

    return NextResponse.json({
      success: true,
      message: 'Authenticated',
      data   : {
        role: roleLower,
        user: parsedUser,
      },
    });

  } catch (err) {
    // ── 6. unexpected error ────────────────────────────────────────────────
    log.error('← 500 Unexpected error', {
      message: err instanceof Error ? err.message : String(err),
      stack  : err instanceof Error ? err.stack  : undefined,
    });

    return NextResponse.json(
      {
        success   : false,
        message   : 'Internal server error',
        redirectTo: '/admin/login',
      },
      { status: 500 }
    );
  }
}