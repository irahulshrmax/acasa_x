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

        // ✅ Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        if (!decoded) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired refresh token' },
                { status: 401 }
            );
        }

        // ✅ Get user from database
        const rows = await query<any[]>(
            `SELECT id, usertype, full_name, name, email, status
             FROM users WHERE id = ? AND status = 1`,
            [decoded.id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { success: false, message: 'User not found or inactive' },
                { status: 401 }
            );
        }

        const user = rows[0];

        // ✅ Get user permissions
        const permissions = await fetchUserPermissions(user.id, user.usertype);

        // ✅ Create token payload
        const tokenPayload = {
            id: user.id,
            email: user.email,
            usertype: user.usertype,
            name: user.name || user.full_name,
            fullName: user.full_name,
        };

        // ✅ Generate new token pair
        const tokens = generateTokenPair(tokenPayload);

        // ✅ Create response
        const response = NextResponse.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                token: tokens.accessToken,
                user: {
                    id: user.id,
                    name: user.name || user.full_name,
                    email: user.email,
                    usertype: user.usertype,
                },
                permissions,
            },
        });

        // ✅ Set new auth token cookie
        response.cookies.set('auth_token', tokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        });

        // ✅ Set new refresh token cookie
        response.cookies.set('refresh_token', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
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