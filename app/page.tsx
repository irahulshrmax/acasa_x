// app/page.tsx
"use client";

import { useEffect, useState, lazy, Suspense, memo, useRef } from "react";
import { motion, type Variants } from "framer-motion";
import { Eye, EyeOff, Lock, Shield, XCircle } from "lucide-react";

// ─── LAZY IMPORTS ──────────────────────────────────────────────────────

const Navbar = lazy(() => import("@/components/Navbar"));
const Hero = lazy(() => import("@/components/Hero"));
const PropertyShowcase = lazy(() => import("@/components/PropertyShowcase"));
const FeaturedProperties = lazy(() => import("@/components/FeaturesProperties"));
const FeaturedProjects = lazy(() => import("@/components/FeaturedProjectSection"));
const Neighborhoods = lazy(() => import("@/components/Neighborhoods"));
const Developers = lazy(() => import("@/components/Developers"));
const About = lazy(() => import("@/components/About"));
const Blogs = lazy(() => import("@/components/Blogs"));
const Footer = lazy(() => import("@/components/Footer"));

// ─── CONSTANTS ──────────────────────────────────────────────────────────

const PASSWORD = "1234567";
const PASSWORD_INCORRECT = "❌ Incorrect password. Try again.";

const SECTION_BG = {
  white: "bg-white",
  cream: "bg-[#F8F6F3]",
  offwhite: "bg-[#FAFAFA]",
  dark: "bg-[#0D1520]",
} as const;

type SectionBg = keyof typeof SECTION_BG;

// ─── SKELETONS ──────────────────────────────────────────────────────────

const SectionSkeleton = memo(function SectionSkeleton({
  bg = "white",
  height = "h-64",
  cols = 3,
}: {
  bg?: SectionBg;
  height?: string;
  cols?: 2 | 3 | 4;
}) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  }[cols];

  return (
    <div className={`py-8 ${SECTION_BG[bg]}`}>
      <div className="max-w-[1200px] mx-auto px-4">
        <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
          {Array.from({ length: cols }).map((_, i) => (
            <div
              key={i}
              className={`bg-gray-100 rounded-xl ${height} animate-pulse`}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

const NavbarSkeleton = memo(function NavbarSkeleton() {
  return (
    <div className="h-16 bg-white/90 backdrop-blur-sm border-b border-[#E8E6E1] animate-pulse">
      <div className="max-w-[1200px] mx-auto px-4 h-full flex items-center justify-between">
        <div className="w-32 h-8 bg-gray-200 rounded" />
        <div className="hidden md:flex gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-16 h-4 bg-gray-200 rounded" />
          ))}
        </div>
        <div className="w-20 h-8 bg-gray-200 rounded" />
      </div>
    </div>
  );
});

const HeroSkeleton = memo(function HeroSkeleton() {
  return (
    <div className="h-[600px] bg-gradient-to-b from-[#0D1520] to-[#1A2F4A] animate-pulse" />
  );
});

const FooterSkeleton = memo(function FooterSkeleton() {
  return <div className="h-64 bg-[#0D1520] animate-pulse" />;
});

// ─── SECTION VARIANT ────────────────────────────────────────────────────

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
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
      viewport={{ once: true, margin: "-80px" }}
      className={`relative ${SECTION_BG[bg]}`}
    >
      {children}
    </motion.section>
  );
});

// ─── SECTION CONFIG ─────────────────────────────────────────────────────

type SectionConfig = {
  id: string;
  bg: SectionBg;
  Component: React.LazyExoticComponent<React.ComponentType>;
  Skeleton: React.ComponentType;
};

const SECTIONS: SectionConfig[] = [
  {
    id: "property-showcase",
    bg: "white",
    Component: PropertyShowcase,
    Skeleton: () => <SectionSkeleton bg="white" height="h-80" cols={3} />,
  },
  {
    id: "featured-properties",
    bg: "cream",
    Component: FeaturedProperties,
    Skeleton: () => <SectionSkeleton bg="cream" height="h-80" cols={3} />,
  },
  {
    id: "featured-projects",
    bg: "white",
    Component: FeaturedProjects,
    Skeleton: () => <SectionSkeleton bg="white" height="h-64" cols={2} />,
  },
  {
    id: "neighborhoods",
    bg: "offwhite",
    Component: Neighborhoods,
    Skeleton: () => <SectionSkeleton bg="offwhite" height="h-64" cols={3} />,
  },
  {
    id: "developers",
    bg: "cream",
    Component: Developers,
    Skeleton: () => <SectionSkeleton bg="cream" height="h-32" cols={4} />,
  },
  {
    id: "about",
    bg: "cream",
    Component: About,
    Skeleton: () => <SectionSkeleton bg="cream" height="h-32" cols={4} />,
  },
  {
    id: "blogs",
    bg: "white",
    Component: Blogs,
    Skeleton: () => <SectionSkeleton bg="white" height="h-64" cols={3} />,
  },
];

// ─── PASSWORD LOCK SCREEN ─────────────────────────────────────────────

function PasswordLockScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const maxAttempts = 5;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === PASSWORD) {
      setError(false);
      localStorage.setItem("acasa_auth", "true");
      localStorage.setItem("acasa_auth_time", Date.now().toString());
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setAttempts(prev => prev + 1);
      setTimeout(() => setShake(false), 500);
      setPassword("");
      
      if (attempts + 1 >= maxAttempts) {
        setTimeout(() => {
          alert(`Too many failed attempts. Please try again after 30 seconds.`);
          setAttempts(0);
        }, 100);
      }
    }
  };

  const isLocked = attempts >= maxAttempts;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0D1520] via-[#1A2F4A] to-[#0D1520]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md px-6"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Logo / Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 border border-white/20 mb-4">
              <Shield className="w-10 h-10 text-[#C8AA78]" />
            </div>
            <h1 className="text-2xl font-light text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              ACASA
            </h1>
            <p className="text-sm text-white/40 mt-1 tracking-widest uppercase">
              Private Access
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2"
            >
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{PASSWORD_INCORRECT}</p>
            </motion.div>
          )}

          {/* Attempts Warning */}
          {attempts > 0 && attempts < maxAttempts && (
            <div className="mb-4 text-center text-sm text-white/30">
              Attempt {attempts} of {maxAttempts}
            </div>
          )}

          {/* Locked State */}
          {isLocked ? (
            <div className="text-center py-8">
              <Lock className="w-12 h-12 text-red-400/50 mx-auto mb-4" />
              <p className="text-white/50 text-sm">Too many attempts. Please try again later.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  ref={inputRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Enter password..."
                  className={`
                    w-full pl-12 pr-12 py-3.5 bg-white/10 border rounded-xl
                    text-white placeholder:text-white/30
                    focus:outline-none focus:ring-2 focus:ring-[#C8AA78]/50 focus:border-[#C8AA78]/50
                    transition-all duration-200
                    ${error ? 'border-red-500/50 ring-red-500/20' : 'border-white/20'}
                    ${shake ? 'animate-shake' : ''}
                  `}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  disabled={isLocked}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLocked}
                className={`
                  w-full py-3.5 rounded-xl font-medium tracking-widest uppercase text-sm
                  transition-all duration-200
                  ${isLocked 
                    ? 'bg-white/10 text-white/30 cursor-not-allowed' 
                    : 'bg-[#C8AA78] text-white hover:bg-[#B89A68] shadow-lg shadow-[#C8AA78]/20'
                  }
                `}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {isLocked ? 'Locked' : 'Unlock'}
              </motion.button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-white/20">
            Restricted Access • Authorized Personnel Only
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
        {SECTIONS.map(({ id, Skeleton }) => (
          <Skeleton key={id} />
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

      {SECTIONS.map(({ id, bg, Component, Skeleton }) => (
        <Section key={id} id={id} bg={bg}>
          <Suspense fallback={<Skeleton />}>
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
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem("acasa_auth");
    const authTime = localStorage.getItem("acasa_auth_time");
    
    if (auth === "true" && authTime) {
      const time = parseInt(authTime);
      const now = Date.now();
      const hour = 60 * 60 * 1000;
      
      if (now - time < hour) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("acasa_auth");
        localStorage.removeItem("acasa_auth_time");
      }
    }
    setChecking(false);
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0D1520] via-[#1A2F4A] to-[#0D1520]">
        <div className="w-12 h-12 border-2 border-[#C8AA78]/30 border-t-[#C8AA78] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordLockScreen onSuccess={handleAuthSuccess} />;
  }

  return <HomeContent />;
}