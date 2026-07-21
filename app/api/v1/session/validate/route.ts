// app/api/v1/session/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

export const runtime = 'nodejs'; // ✅ Force Node.js runtime

const IS_DEV = process.env.NODE_ENV === 'development';

export async function GET(request: NextRequest) {
    try {
        // ✅ Get token from cookies
        const token = request.cookies.get('admin_token')?.value || 
                      request.cookies.get('auth_token')?.value;

        if (!token) {
            if (IS_DEV) {
                console.log('[Session Validate] ❌ No token found');
            }
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'No session found',
                    code: 'NO_SESSION' 
                },
                { status: 401 }
            );
        }

        // ✅ Verify token
        const payload = verifyToken(token);

        if (!payload) {
            if (IS_DEV) {
                console.log('[Session Validate] ❌ Invalid token');
            }
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Invalid session',
                    code: 'INVALID_SESSION' 
                },
                { status: 401 }
            );
        }

        // ✅ Check if user is admin
        const usertype = payload.usertype?.toLowerCase() || '';
        const isAdmin = usertype === 'admin' || usertype === 'super_admin';

        if (IS_DEV) {
            console.log('[Session Validate] ✅ Valid session:', {
                userId: payload.id,
                email: payload.email,
                usertype: payload.usertype,
                isAdmin,
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Session valid',
            data: {
                id: payload.id,
                email: payload.email,
                name: payload.name || payload.fullName,
                usertype: payload.usertype,
                isAdmin,
            },
        });

    } catch (error) {
        console.error('[Session Validate] Error:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Session validation failed',
                code: 'VALIDATION_ERROR' 
            },
            { status: 500 }
        );
    }
}