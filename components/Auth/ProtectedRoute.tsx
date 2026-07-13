"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: ("Admin" | "admin_user" | "agents" | "User")[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  roles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, sessionLoading } = useAuth();

  useEffect(() => {
    if (sessionLoading) return;

    if (!isAuthenticated) {
      toast.error("Please login to continue");
      router.replace(redirectTo);
      return;
    }

    if (roles && user && !roles.includes(user.usertype as any)) {
      toast.error("You don't have permission to access this page");
      router.replace("/");
    }
  }, [isAuthenticated, sessionLoading, user, roles, router, redirectTo]);

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (roles && user && !roles.includes(user.usertype as any)) return null;

  return <>{children}</>;
}