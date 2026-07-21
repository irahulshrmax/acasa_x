// app/api/v1/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import bcrypt from 'bcryptjs';
import { generateToken, TokenPayload } from '@/lib/auth/jwt';
import { fetchUserPermissions } from '@/lib/auth/permissions';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function buildCookieOptions(expiresIn: number) {
    return {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'lax' as const,
        maxAge: expiresIn,
        path: '/',
        ...(IS_PRODUCTION && { domain: '.acasa.ae' }),
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, rememberMe = false } = body;

        if (!email?.trim() || !password?.trim()) {
            return NextResponse.json(
                { success: false, message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // ✅ Find user
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

        if (user.status !== 1) {
            return NextResponse.json(
                { success: false, message: 'Account deactivated' },
                { status: 403 }
            );
        }

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

        const userTypeLower = user.usertype?.toLowerCase() || '';
        const isAdmin = userTypeLower === 'admin' || userTypeLower === 'super_admin';

        // ✅ Check if this is an admin login attempt
        const isAdminRequest = request.nextUrl.pathname.includes('/admin') ||
                              request.nextUrl.pathname.includes('/api/admin') ||
                              request.headers.get('referer')?.includes('/admin');

        if (isAdminRequest && !isAdmin) {
            return NextResponse.json(
                { success: false, message: 'Admin access required' },
                { status: 403 }
            );
        }

        // ✅ Get permissions
        const permissions = await fetchUserPermissions(user.id, user.usertype);

        // ✅ Generate token
        const tokenPayload: TokenPayload = {
            id: user.id,
            email: user.email,
            usertype: user.usertype,
            name: user.name || user.full_name,
            fullName: user.full_name,
        };

        const token = generateToken(tokenPayload, rememberMe);

        // ✅ Update last login
        await query(
            'UPDATE users SET updated_at = NOW() WHERE id = ?',
            [user.id]
        );

        const { password: _removed, ...safeUser } = user;

        const expiresIn = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
        const cookieOptions = buildCookieOptions(expiresIn);

        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            data: {
                user: safeUser,
                permissions,
                token,
                isAdmin,
                redirectTo: isAdmin ? '/admin/dashboard' : '/',
            },
        });

        // ✅ Set cookies
        response.cookies.set({ 
            name: 'auth_token', 
            value: token, 
            ...cookieOptions 
        });

        if (isAdmin) {
            response.cookies.set({ 
                name: 'admin_token', 
                value: token, 
                ...cookieOptions 
            });
            response.cookies.set({ 
                name: 'admin_role', 
                value: userTypeLower, 
                ...cookieOptions 
            });
            response.cookies.set({
                name: 'admin_user',
                value: JSON.stringify({
                    id: user.id,
                    name: user.name || user.full_name,
                    email: user.email,
                    usertype: userTypeLower,
                }),
                ...cookieOptions,
            });
        }

        return response;

    } catch (error) {
        console.error('[Login] Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}