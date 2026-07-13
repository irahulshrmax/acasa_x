import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthPage from "@/components/Auth/AuthPage";

export const metadata: Metadata = {
  title: "Sign In | A Casa",
  description:
    "Sign in to your A Casa account to access saved properties, manage enquiries, and discover Dubai's most exclusive real estate listings.",
  alternates: { canonical: "/login" },
  openGraph: {
    title: "Sign In | A Casa",
    description: "Access your A Casa account",
    url: "/login",
  },
};

export default function LoginPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white">
      <Navbar />
      <Suspense fallback={<AuthLoadingFallback />}>
        <AuthPage initialMode="login" />
      </Suspense>
      <Footer />
    </main>
  );
}

function AuthLoadingFallback() {
  return (
    <div className="flex min-h-[600px] items-center justify-center pt-32">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#1C2433]/20 border-t-[#1C2433]" />
        <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-[#1C2433]/50">
          Loading...
        </p>
      </div>
    </div>
  );
}


