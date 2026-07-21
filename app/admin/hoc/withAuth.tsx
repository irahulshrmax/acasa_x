'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

export function withAuth(WrappedComponent: React.ComponentType) {
  return function AuthenticatedComponent(props: any) {
    const router   = useRouter();
    const pathname = usePathname();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading]             = useState(true);

    useEffect(() => {
      // ✅ Login page pe verify call mat karo
      if (pathname === '/admin/login') {
        setIsLoading(false);
        setIsAuthenticated(true); // layout render hone do
        return;
      }

      async function checkAuth() {
        try {
          console.log('[withAuth] Checking auth for:', pathname);
          console.log('[withAuth] Cookies available:', document.cookie
            .split(';')
            .map(c => c.trim().split('=')[0])
            .filter(Boolean)
          );

          const res = await fetch('/api/v1/auth/admin/verify', {
            credentials: 'include',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
          });

          console.log('[withAuth] Verify response status:', res.status);

          const data = await res.json();

          console.log('[withAuth] Verify response:', {
            success: data.success,
            message: data.message,
          });

          if (data.success) {
            setIsAuthenticated(true);
          } else {
            toast.error('Please login to access admin panel');
            router.replace('/admin/login');
          }
        } catch (error) {
          console.error('[withAuth] Auth check error:', error);
          router.replace('/admin/login');
        } finally {
          setIsLoading(false);
        }
      }

      checkAuth();
    }, [router, pathname]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-500 font-medium">Verifying access...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) return null;

    return <WrappedComponent {...props} />;
  };
}