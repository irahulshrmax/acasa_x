import { query } from '@/lib/database';

export interface UserPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  isSuperAdmin: boolean;
}

interface UserRoleRow {
  usertype: string;
  status: number;
}

function buildPermissions(usertype: string): UserPermissions {
  const isSuperAdmin = usertype === 'super_admin';
  const isAdmin = usertype === 'admin' || isSuperAdmin;

  return {
    canView: true,
    canCreate: isAdmin,
    canEdit: isAdmin,
    canDelete: isAdmin,
    canManageUsers: isAdmin,
    canManageSettings: isSuperAdmin,
    isSuperAdmin,
  };
}

function emptyPermissions(): UserPermissions {
  return {
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
    canManageSettings: false,
    isSuperAdmin: false,
  };
}

export async function fetchUserPermissions(
  userId: number,
  usertype: string
): Promise<UserPermissions> {
  try {
    const rows = await query<UserRoleRow[]>(
      `SELECT usertype, status
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    if (!rows.length) {
      return emptyPermissions();
    }

    const user = rows[0];

    if (user.status !== 1) {
      return emptyPermissions();
    }

    return buildPermissions(user.usertype || usertype);
  } catch {
    return buildPermissions(usertype);
  }
}

export function getRedirectPath(usertype: string): string {
  if (usertype === 'admin' || usertype === 'super_admin') {
    return '/admin';
  }

  return '/dashboard';
}