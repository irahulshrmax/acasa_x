// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const PUBLIC_ROUTES = [
    '/',
    '/admin/login',
    '/admin/forgot-password',
    '/admin/reset-password',
];

const PUBLIC_API_PREFIXES = [
    '/api/v1/auth/',
    '/api/v1/session/',
    '/api/v1/admin/login',
    '/api/v1/admin/logout',
    '/api/v1/health',
    '/api/v1/ping',
];

const STATIC_PREFIXES = [
    '/_next',
    '/favicon',
    '/icons',
    '/images',
    '/fonts',
    '/styles',
    '/manifest',
    '/.well-known',
];

const IS_DEV = process.env.NODE_ENV === 'development';

function isStaticAsset(pathname: string): boolean {
    return STATIC_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

function isPublicRoute(pathname: string): boolean {
    if (PUBLIC_ROUTES.includes(pathname)) return true;
    if (PUBLIC_API_PREFIXES.some(prefix => pathname.startsWith(prefix))) return true;
    return false;
}

function isAdminRoute(pathname: string): boolean {
    return pathname.startsWith('/admin') && !isPublicRoute(pathname);
}

// ─── MAIN MIDDLEWARE ──────────────────────────────────────────────────────
export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ✅ Skip logging for static assets
    if (IS_DEV && !isStaticAsset(pathname)) {
        console.log(`[Middleware] ➜ ${request.method} ${pathname}`);
    }

    // ── 1. Static assets — skip ────────────────────────────────────────────
    if (isStaticAsset(pathname)) {
        return NextResponse.next();
    }

    // ── 2. Public routes — allow ────────────────────────────────────────────
    if (isPublicRoute(pathname)) {
        // ✅ If on login page but already logged in -> redirect to dashboard
        if (pathname === '/admin/login') {
            const token = request.cookies.get('admin_token')?.value;
            const role = request.cookies.get('admin_role')?.value || '';

            if (token && (role === 'admin' || role === 'super_admin')) {
                if (IS_DEV) {
                    console.log('[Middleware] 🔄 Already logged in — redirecting to dashboard');
                }
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            }
        }

        return NextResponse.next();
    }

    // ── 3. Admin routes — authentication check ──────────────────────────────
    if (isAdminRoute(pathname)) {
        const token = request.cookies.get('admin_token')?.value;
        const role = request.cookies.get('admin_role')?.value || '';

        if (IS_DEV) {
            console.log('[Middleware] Cookie check:', {
                hasToken: !!token,
                hasAdminRole: role === 'admin' || role === 'super_admin',
                role: role,
                tokenPreview: token ? `${token.slice(0, 6)}...${token.slice(-4)}` : 'missing',
            });
        }

        // ❌ No token -> redirect to login
        if (!token) {
            if (IS_DEV) {
                console.log('[Middleware] ⛔ No token — redirecting to login');
            }
            const response = NextResponse.redirect(new URL('/admin/login', request.url));
            return response;
        }

        // ✅ Check role from cookie (no JWT verification in middleware)
        const isAdmin = role === 'admin' || role === 'super_admin';

        if (!isAdmin) {
            if (IS_DEV) {
                console.log('[Middleware] ⛔ Not admin role — redirecting to login');
            }
            const response = NextResponse.redirect(new URL('/admin/login', request.url));
            response.cookies.delete('admin_token');
            response.cookies.delete('admin_role');
            response.cookies.delete('admin_user');
            return response;
        }

        // ✅ All checks passed
        if (IS_DEV) {
            console.log(`[Middleware] ✅ Admin access granted: ${pathname}`);
        }

        return NextResponse.next();
    }

    // ── 4. All other routes — allow ──────────────────────────────────────────
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
    // ✅ Important: Run middleware on Node.js runtime, not edge
    runtime: 'nodejs',
};