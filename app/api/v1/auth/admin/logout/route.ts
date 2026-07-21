// app/api/v1/auth/admin/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
      redirectTo: '/admin/login',
    });

    // Clear all admin cookies
    response.cookies.delete('admin_token');
    response.cookies.delete('admin_role');
    response.cookies.delete('admin_user');

    // Optionally clear main auth token too
    response.cookies.delete('auth_token');

    return response;
  } catch (error) {
    console.error('[Admin Logout Error]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}