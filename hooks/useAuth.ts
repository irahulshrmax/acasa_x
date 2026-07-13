// hooks/useAuth.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ════════════════════════════════════════════════════════════════
//  TYPES
// ════════════════════════════════════════════════════════════════

export interface AuthUser {
  id         : number;
  usertype   : string;
  full_name  : string | null;
  name       : string;
  email      : string;
  phone      : string | null;
  photo      : string | null;
  status     : number;
  first_login?: number | null;
  provider   ?: string | null;
  provider_id?: string | null;
}

export interface AuthPermissions {
  [module: string]: {
    [action: string]: number;
  };
}

interface AuthState {
  user          : AuthUser | null;
  permissions   : AuthPermissions | null;
  token         : string | null;
  isAuthenticated: boolean;
  loading       : boolean;
  sessionLoading: boolean;
}

// ════════════════════════════════════════════════════════════════
//  ROLE HELPER
// ════════════════════════════════════════════════════════════════

export function getUserRole(user: AuthUser | null) {
  if (!user) {
    return {
      isAdmin       : false,
      isAdminUser   : false,
      isAgent       : false,
      isUser        : false,
      hasAdminAccess: false,
    };
  }

  const role        = user.usertype?.toLowerCase() || '';
  const isAdmin     = role === 'admin';
  const isAdminUser = role === 'admin_user';
  const isAgent     = role === 'agents';
  const isUser      = role === 'user';

  return {
    isAdmin,
    isAdminUser,
    isAgent,
    isUser,
    hasAdminAccess: isAdmin || isAdminUser,
  };
}

// ════════════════════════════════════════════════════════════════
//  SESSION HELPERS
// ════════════════════════════════════════════════════════════════

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSession(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

function saveSession(token: string, user: AuthUser): void {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
}

// ════════════════════════════════════════════════════════════════
//  HOOK
// ════════════════════════════════════════════════════════════════

export function useAuth() {
  const router = useRouter();

  const [state, setState] = useState<AuthState>({
    user           : null,
    permissions    : null,
    token          : null,
    isAuthenticated: false,
    loading        : false,
    sessionLoading : true,
  });

  // ── Verify session on mount ────────────────────────────────
  useEffect(() => {
    verifySession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifySession = useCallback(async () => {
    const token = getStoredToken();
    const user  = getStoredUser();

    // No token - not authenticated
    if (!token || !user) {
      setState((prev) => ({
        ...prev,
        sessionLoading : false,
        isAuthenticated: false,
        user           : null,
        token          : null,
        permissions    : null,
      }));
      return;
    }

    try {
      // Verify token with server
      const res = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!data.success) {
        clearSession();
        setState((prev) => ({
          ...prev,
          sessionLoading : false,
          isAuthenticated: false,
          user           : null,
          token          : null,
          permissions    : null,
        }));
        return;
      }

      // Update localStorage with fresh data
      saveSession(token, data.data.user);

      setState({
        user           : data.data.user,
        permissions    : data.data.permissions ?? null,
        token,
        isAuthenticated: true,
        loading        : false,
        sessionLoading : false,
      });

    } catch {
      // Server error - use stored data as fallback
      setState({
        user           : user,
        permissions    : null,
        token,
        isAuthenticated: true,
        loading        : false,
        sessionLoading : false,
      });
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      clearSession();
      setState({
        user           : null,
        permissions    : null,
        token          : null,
        isAuthenticated: false,
        loading        : false,
        sessionLoading : false,
      });
      router.push('/');
    }
  }, [router]);

  // ── Permission check ──────────────────────────────────────
  const hasPermission = useCallback(
    (module: string, action: string): boolean => {
      if (!state.permissions) return false;
      return state.permissions[module]?.[action] === 1;
    },
    [state.permissions]
  );

  // ── Update user data (profile edit etc) ──────────────────
  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const updated = { ...prev.user, ...updates };
      localStorage.setItem('auth_user', JSON.stringify(updated));
      return { ...prev, user: updated };
    });
  }, []);

  const roles = getUserRole(state.user);

  return {
    // State
    user           : state.user,
    permissions    : state.permissions,
    token          : state.token,
    isAuthenticated: state.isAuthenticated,
    loading        : state.loading,
    sessionLoading : state.sessionLoading,

    // Roles
    ...roles,

    // Actions
    hasPermission,
    updateUser,
    logout        : handleLogout,
    refreshSession: verifySession,
  };
}