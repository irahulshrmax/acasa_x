// app/api/v1/session/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ─── Cookie names to clear ──────────────────────────────────────────────
const COOKIES_TO_CLEAR = [
    'auth_token',
    'admin_token',
    'admin_role',
    'admin_user',
    'user_token',
    'user_role',
    'user_data',
];

// ─── Get cookie delete options ──────────────────────────────────────────
function getDeleteCookieOptions() {
    const options: any = {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'lax' as const,
        maxAge: 0,
        expires: new Date(0),
        path: '/',
    };

    // ✅ In production, match the domain used when setting cookies
    if (IS_PRODUCTION) {
        options.domain = '.acasa.ae';
    }

    return options;
}

// ─── POST - Logout ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        // ✅ Get logout type from request body
        const body = await request.json().catch(() => ({}));
        const logoutType = body?.type || 'all'; // 'admin' | 'user' | 'all'

        // ✅ Determine which cookies to clear
        let cookiesToClear: string[] = [];

        if (logoutType === 'admin') {
            cookiesToClear = ['auth_token', 'admin_token', 'admin_role', 'admin_user'];
        } else if (logoutType === 'user') {
            cookiesToClear = ['auth_token', 'user_token', 'user_role', 'user_data'];
        } else {
            // Clear all cookies
            cookiesToClear = [...COOKIES_TO_CLEAR];
        }

        // ✅ Create response
        const response = NextResponse.json({
            success: true,
            message: 'Logged out successfully',
            data: {
                type: logoutType,
                clearedCookies: cookiesToClear,
            },
        });

        // ✅ Delete cookies using response.cookies.set()
        const deleteOptions = getDeleteCookieOptions();

        for (const cookieName of cookiesToClear) {
            // Method 1: Set empty cookie with maxAge 0
            response.cookies.set({
                name: cookieName,
                value: '',
                ...deleteOptions,
            });

            // Method 2: Explicit delete
            response.cookies.delete(cookieName);
        }

        // ✅ Additional fallback: Set raw Set-Cookie headers
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
        console.error('[Logout] Error:', error);
        return NextResponse.json(
            { success: false, message: 'Logout failed' },
            { status: 500 }
        );
    }
}

// ─── GET - Simple logout via URL ──────────────────────────────────────
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
            cookiesToClear = [...COOKIES_TO_CLEAR];
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

        // ✅ Raw Set-Cookie headers as fallback
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
        console.error('[Logout GET] Error:', error);
        return NextResponse.json(
            { success: false, message: 'Logout failed' },
            { status: 500 }
        );
    }
}