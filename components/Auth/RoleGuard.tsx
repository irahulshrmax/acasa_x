// components/Auth/RoleGuard.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

// ════════════════════════════════════════════════════════════════
//  TYPES
// ════════════════════════════════════════════════════════════════

type UserRole = 'Admin' | 'admin_user' | 'agents' | 'User';

interface RoleGuardProps {
  children   : React.ReactNode;
  roles      ?: UserRole[];
  permission ?: { module: string; action: string };
  fallback   ?: React.ReactNode;
}

// ════════════════════════════════════════════════════════════════
//  COMPONENT
// ════════════════════════════════════════════════════════════════

export default function RoleGuard({
  children,
  roles,
  permission,
  fallback = null,
}: RoleGuardProps) {
  const { user, hasPermission } = useAuth();

  // ── Role check ───────────────────────────────────────────
  if (roles && user) {
    if (!roles.includes(user.usertype as UserRole)) {
      return <>{fallback}</>;
    }
  }

  // ── Permission check ─────────────────────────────────────
  if (permission) {
    if (!hasPermission(permission.module, permission.action)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}