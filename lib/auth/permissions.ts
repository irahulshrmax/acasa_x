// lib/auth/permissions.ts

import { query } from '@/lib/database';

// ─── Fetch User Permissions ───────────────────────────────────────────────────
export async function fetchUserPermissions(
    userId: number,
    usertype: string
): Promise<any> {
    // Admin ko saare permissions
    if (usertype === 'Admin' || usertype === 'admin') {
        return { admin: { view: 1, edit: 1, delete: 1, create: 1 } };
    }

    // Agent ko limited permissions
    if (usertype === 'agents' || usertype === 'Agent') {
        return { agent: { view: 1, edit: 1, create: 1 } };
    }

    // Normal user ke liye DB se fetch karo
    try {
        const rows = await query<{ permission: string }[]>(
            `SELECT permission FROM user_permission WHERE user_id = ?`,
            [userId]
        );

        const permissions: any = {};
        rows.forEach((row) => {
            const parts = row.permission.split('.');
            if (parts.length === 2) {
                const [module, action] = parts;
                if (!permissions[module]) permissions[module] = {};
                permissions[module][action] = 1;
            }
        });

        return permissions;
    } catch (error) {
        console.error('[Permissions Error]', error);
        return {};
    }
}

// ─── Get Redirect Path ────────────────────────────────────────────────────────
export function getRedirectPath(usertype: string): string {
    const paths: Record<string, string> = {
        'Admin':  '/admin/dashboard',
        'admin':  '/admin/dashboard',
        'agents': '/agent/dashboard',
        'Agent':  '/agent/dashboard',
        'User':   '/',
        'user':   '/',
    };
    return paths[usertype] || '/';
}

// ─── Get User Role ────────────────────────────────────────────────────────────
export function getUserRole(user: any): {
    isAdmin: boolean;
    isAdminUser: boolean;
    isAgent: boolean;
    isUser: boolean;
    hasAdminAccess: boolean;
} {
    if (!user) {
        return {
            isAdmin:        false,
            isAdminUser:    false,
            isAgent:        false,
            isUser:         false,
            hasAdminAccess: false,
        };
    }

    const role       = user.usertype?.toLowerCase() || "";
    const isAdmin    = role === "admin";
    const isAdminUser = role === "admin_user";
    const isAgent    = role === "agents";
    const isUser     = role === "user" || role === "";

    return {
        isAdmin,
        isAdminUser,
        isAgent,
        isUser,
        hasAdminAccess: isAdmin || isAdminUser,
    };
}