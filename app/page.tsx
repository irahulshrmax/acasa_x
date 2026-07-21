// app/page.tsx
"use client";

import { useEffect, useState, lazy, Suspense, memo, useRef, useCallback } from "react";
import { motion, type Variants } from "framer-motion";
import { Eye, EyeOff, Lock, Shield, XCircle, Loader2 } from "lucide-react";

// ─── LAZY IMPORTS ──────────────────────────────────────────────────────

const Navbar = lazy(() => import("@/components/Navbar"));
const Hero = lazy(() => import("@/components/Hero"));
const PropertyShowcase = lazy(() => import("@/components/PropertyShowcase"));
const FeaturedProperties = lazy(() => import("@/components/FeaturesProperties"));
const FeaturedProjects = lazy(() => import("@/components/FeaturedProjectSection"));
const Neighborhoods = lazy(() => import("@/components/Neighborhoods"));
const Lifestyle = lazy(() => import("@/components/LifestyleSection"));
const Developers = lazy(() => import("@/components/Developers"));
const About = lazy(() => import("@/components/About"));
const Blogs = lazy(() => import("@/components/Blogs"));
const Footer = lazy(() => import("@/components/Footer"));

// ─── CONSTANTS ──────────────────────────────────────────────────────────

const AUTH_KEY        = "acasa_auth";
const AUTH_TIME_KEY   = "acasa_auth_time";
const AUTH_EXPIRY_MS  = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS    = 5;
const LOCKOUT_MS      = 30 * 1000; // 30 seconds
const SITE_PASSWORD   = "1234567";

const SECTION_BG = {
  white   : "bg-white",
  cream   : "bg-[#F8F6F3]",
  offwhite: "bg-[#FAFAFA]",
  dark    : "bg-[#0D1520]",
} as const;

type SectionBg = keyof typeof SECTION_BG;

// ─── SKELETONS ──────────────────────────────────────────────────────────

const SectionSkeleton = memo(function SectionSkeleton({
  bg = "white",
  height = "h-40",
  cols = 3,
}: {
  bg?: SectionBg;
  height?: string;
  cols?: 2 | 3 | 4;
}) {
  const grid = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" }[cols];

  return (
    <div className={`py-6 md:py-8 ${SECTION_BG[bg]}`}>
      <div className="max-w-[1200px] mx-auto px-4">
        <div className={`grid grid-cols-1 ${grid} gap-4`}>
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className={`bg-neutral-100 rounded-xl ${height} animate-pulse`} />
          ))}
        </div>
      </div>
    </div>
  );
});

const NavbarSkeleton = memo(function NavbarSkeleton() {
  return (
    <div className="h-14 md:h-16 bg-white border-b border-neutral-200 animate-pulse">
      <div className="max-w-[1200px] mx-auto px-4 h-full flex items-center justify-between">
        <div className="w-24 h-6 bg-neutral-200 rounded" />
        <div className="hidden md:flex gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-14 h-3 bg-neutral-200 rounded" />
          ))}
        </div>
        <div className="w-16 h-7 bg-neutral-200 rounded" />
      </div>
    </div>
  );
});

const HeroSkeleton = memo(function HeroSkeleton() {
  return <div className="h-[400px] md:h-[600px] bg-[#0D1520] animate-pulse" />;
});

const FooterSkeleton = memo(function FooterSkeleton() {
  return <div className="h-48 md:h-64 bg-[#0D1520] animate-pulse" />;
});

// ─── SECTION WRAPPER ────────────────────────────────────────────────────

const sectionVariants: Variants = {
  hidden : { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const Section = memo(function Section({
  children,
  id,
  bg = "white",
}: {
  children: React.ReactNode;
  id?: string;
  bg?: SectionBg;
}) {
  return (
    <motion.section
      id={id}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className={`relative ${SECTION_BG[bg]}`}
    >
      {children}
    </motion.section>
  );
});

// ─── SECTION CONFIG ─────────────────────────────────────────────────────

type SectionConfig = {
  id       : string;
  bg       : SectionBg;
  Component: React.LazyExoticComponent<React.ComponentType>;
  skeleton : { bg: SectionBg; height: string; cols: 2 | 3 | 4 };
};

const SECTIONS: SectionConfig[] = [
  { id: "property-showcase",   bg: "white",    Component: PropertyShowcase,  skeleton: { bg: "white",    height: "h-48", cols: 3 } },
  { id: "featured-properties", bg: "cream",    Component: FeaturedProperties, skeleton: { bg: "cream",    height: "h-48", cols: 3 } },
  { id: "featured-projects",   bg: "white",    Component: FeaturedProjects,  skeleton: { bg: "white",    height: "h-40", cols: 2 } },
  { id: "neighborhoods",       bg: "offwhite", Component: Neighborhoods,     skeleton: { bg: "offwhite", height: "h-40", cols: 3 } },
  { id: "lifestyle",           bg: "white",    Component: Lifestyle,         skeleton: { bg: "white",    height: "h-40", cols: 2 } },
  { id: "developers",          bg: "cream",    Component: Developers,        skeleton: { bg: "cream",    height: "h-24", cols: 4 } },
  { id: "about",               bg: "cream",    Component: About,             skeleton: { bg: "cream",    height: "h-24", cols: 4 } },
  { id: "blogs",               bg: "white",    Component: Blogs,             skeleton: { bg: "white",    height: "h-40", cols: 3 } },
];

// ─── AUTH HELPERS ───────────────────────────────────────────────────────

function isSessionValid(): boolean {
  try {
    const auth     = localStorage.getItem(AUTH_KEY);
    const authTime = localStorage.getItem(AUTH_TIME_KEY);

    if (auth !== "true" || !authTime) return false;

    const elapsed = Date.now() - parseInt(authTime, 10);
    if (elapsed >= AUTH_EXPIRY_MS) {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(AUTH_TIME_KEY);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function setSession(): void {
  try {
    localStorage.setItem(AUTH_KEY, "true");
    localStorage.setItem(AUTH_TIME_KEY, Date.now().toString());
  } catch {
    // storage full or blocked — fail silently
  }
}

// ─── PASSWORD LOCK SCREEN ─────────────────────────────────────────────

function PasswordLockScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password,     setPassword    ] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError       ] = useState(false);
  const [attempts,     setAttempts    ] = useState(0);
  const [lockedUntil,  setLockedUntil ] = useState(0);
  const [shake,        setShake       ] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLocked = Date.now() < lockedUntil;

  // Focus input on mount and after lockout ends
  useEffect(() => {
    if (!isLocked) inputRef.current?.focus();
  }, [isLocked]);

  // Countdown timer for lockout
  useEffect(() => {
    if (!isLocked) return;

    const timer = setInterval(() => {
      if (Date.now() >= lockedUntil) {
        setLockedUntil(0);
        setAttempts(0);
        setError(false);
        inputRef.current?.focus();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockedUntil]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked || !password.trim()) return;

    if (password === SITE_PASSWORD) {
      setError(false);
      setSession();
      onSuccess();
      return;
    }

    // Wrong password
    setError(true);
    setShake(true);
    setPassword("");
    setTimeout(() => setShake(false), 500);

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= MAX_ATTEMPTS) {
      setLockedUntil(Date.now() + LOCKOUT_MS);
    }
  }, [password, attempts, isLocked, onSuccess]);

  const remainingSeconds = isLocked
    ? Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000))
    : 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1520] px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 md:p-8">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 border border-white/10 mb-3">
              <Shield className="w-7 h-7 md:w-8 md:h-8 text-[#C8AA78]" />
            </div>
            <h1
              className="text-xl md:text-2xl font-light text-white"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              ACASA
            </h1>
            <p className="text-[11px] text-white/30 mt-1 tracking-[0.2em] uppercase">
              Private Access
            </p>
          </div>

          {/* Error */}
          {error && !isLocked && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
            >
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">Incorrect password. Try again.</p>
            </motion.div>
          )}

          {/* Attempts counter */}
          {attempts > 0 && attempts < MAX_ATTEMPTS && !isLocked && (
            <p className="mb-3 text-center text-[11px] text-white/25">
              Attempt {attempts} of {MAX_ATTEMPTS}
            </p>
          )}

          {/* Locked state */}
          {isLocked ? (
            <div className="text-center py-6">
              <Lock className="w-10 h-10 text-red-400/40 mx-auto mb-3" />
              <p className="text-sm text-white/40">Too many attempts</p>
              <p className="text-xs text-white/25 mt-1">
                Try again in {remainingSeconds}s
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  ref={inputRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Enter password"
                  className={`
                    w-full pl-10 pr-10 py-3 bg-white/[0.06] border rounded-xl
                    text-white text-sm placeholder:text-white/25
                    focus:outline-none focus:ring-2 focus:ring-[#C8AA78]/30 focus:border-[#C8AA78]/40
                    transition-all duration-200
                    ${error ? "border-red-500/40" : "border-white/10"}
                    ${shake ? "animate-shake" : ""}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={!password.trim()}
                className={`
                  w-full py-3 rounded-xl text-sm font-medium tracking-wider uppercase
                  transition-all duration-200
                  ${!password.trim()
                    ? "bg-white/[0.06] text-white/20 cursor-not-allowed"
                    : "bg-[#C8AA78] text-white hover:bg-[#B89A68]"
                  }
                `}
              >
                Unlock
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-[10px] text-white/15">
            Restricted Access
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── HOME CONTENT ──────────────────────────────────────────────────────

function HomeContent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-white">
        <NavbarSkeleton />
        <HeroSkeleton />
        {SECTIONS.map(({ id, skeleton }) => (
          <SectionSkeleton key={id} bg={skeleton.bg} height={skeleton.height} cols={skeleton.cols} />
        ))}
        <FooterSkeleton />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <div className="relative z-50">
        <Suspense fallback={<NavbarSkeleton />}>
          <Navbar />
        </Suspense>
      </div>

      <div className="relative">
        <Suspense fallback={<HeroSkeleton />}>
          <Hero />
        </Suspense>
      </div>

      {SECTIONS.map(({ id, bg, Component, skeleton }) => (
        <Section key={id} id={id} bg={bg}>
          <Suspense fallback={<SectionSkeleton bg={skeleton.bg} height={skeleton.height} cols={skeleton.cols} />}>
            <Component />
          </Suspense>
        </Section>
      ))}

      <div className="relative z-10">
        <Suspense fallback={<FooterSkeleton />}>
          <Footer />
        </Suspense>
      </div>
    </main>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking,        setChecking       ] = useState(true);

  useEffect(() => {
    setIsAuthenticated(isSessionValid());
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1520]">
        <Loader2 className="w-8 h-8 text-[#C8AA78]/50 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordLockScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  return <HomeContent />;
}