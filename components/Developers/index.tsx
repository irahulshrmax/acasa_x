"use client";

import type { ReactNode } from "react";
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineArrowRight,
  HiOutlineBuildingOffice2,
  HiArrowPath,
  HiOutlineExclamationCircle,
} from "react-icons/hi2";

const DEVELOPERS_API_URL = "/api/v1/developers";

const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME = {
  primary: "#0F1C2E",
  accent: "#C9A96E",
  accentLight: "#D4B888",
  muted: "#6B7A8D",
  border: "#E2E8F0",
  surface: "#F8FAFC",
};

interface Developer {
  id: number;
  name: string | null;
  image: string | null;
  image_url?: string;
  image_variations?: string[];
  website: string | null;
  email: string | null;
  mobile: string | null;
  address: string | null;
  country: string | null;
  year_established: string | null;
  informations: string | null;
  project_count: number;
  property_count: number;
  status: number;
  seo_title: string | null;
  seo_keywork: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

function isIndianDeveloper(developer: Developer): boolean {
  if (!developer) return false;

  const country = (developer.country || "").toLowerCase();
  if (country.includes("india") || country.includes("indian")) {
    return true;
  }

  const name = (developer.name || "").toLowerCase();
  const indianKeywords = [
    "india", "indian", "mumbai", "delhi", "bangalore", "hyderabad",
    "chennai", "kolkata", "pune", "ahmedabad", "noida", "gurgaon",
    "bengaluru", "kochi", "jaipur", "lucknow", "bhopal", "patna",
    "punjab", "rajasthan", "gujarat", "indore", "nagpur", "surat",
    "kerala", "tamil nadu", "karnataka", "maharashtra",
  ];

  for (const keyword of indianKeywords) {
    if (name.includes(keyword)) return true;
  }

  const address = (developer.address || "").toLowerCase();
  for (const keyword of indianKeywords.slice(0, 15)) {
    if (address.includes(keyword)) return true;
  }

  return false;
}

function getDeveloperImageUrls(developer: Developer): string[] {
  if (
    developer.image_url &&
    developer.image_url !== "h" &&
    !developer.image_url.includes("no-image")
  ) {
    return [developer.image_url];
  }

  if (developer.image_variations && developer.image_variations.length > 0) {
    const valid = developer.image_variations.filter(
      (url) => url && url !== "h" && !url.includes("no-image")
    );
    if (valid.length > 0) return valid;
  }

  if (developer.image) {
    const image = developer.image.trim();

    if (image) {
      if (image.startsWith("http://") || image.startsWith("https://")) {
        return [image];
      }

      if (image.startsWith("/")) {
        return [`https://acasa.ae${image}`];
      }

      if (image.startsWith("upload/")) {
        return [`https://acasa.ae/${image}`];
      }

      return [
        `https://acasa.ae/upload/developers/${image}`,
        `https://acasa.ae/upload/developer/${image}`,
        `https://acasa.ae/upload/media/${image}`,
      ];
    }
  }

  return [
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      developer.name || "Developer"
    )}&size=400&background=0F1C2E&color=fff&font-size=0.4&bold=true`,
  ];
}

function ImageWithFallback({
  src,
  alt,
  fallbacks = [],
  className,
  width,
  height,
  ...props
}: {
  src: string | null;
  alt: string;
  fallbacks?: string[];
  className?: string;
  width?: number;
  height?: number;
  [key: string]: any;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(false);

  const allUrls = useMemo(() => {
    const urls: string[] = [];
    if (src) urls.push(src);
    urls.push(...fallbacks);
    return urls.filter((url) => url && url.trim() !== "" && url !== "h");
  }, [src, fallbacks]);

  useEffect(() => {
    setCurrentIndex(0);
    setError(false);
  }, [src]);

  const currentSrc = allUrls[currentIndex] || null;

  const handleError = useCallback(() => {
    if (currentIndex < allUrls.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setError(true);
    }
  }, [currentIndex, allUrls.length]);

  if (error || !currentSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}
      >
        <HiOutlineBuildingOffice2 className="h-10 w-10 text-gray-300 md:h-14 md:w-14" />
      </div>
    );
  }

  if (width && height) {
    return (
      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={handleError}
        unoptimized
        quality={100}
        {...props}
      />
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      {...props}
    />
  );
}

function ClickLoaderOverlay({ roundedClass = "rounded-lg" }: { roundedClass?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center backdrop-blur-[3px] ${roundedClass}`}
      style={{ background: "rgba(15, 28, 46, 0.85)" }}
    >
      <div className="relative h-12 w-12">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{ borderTopColor: THEME.accent, borderRightColor: THEME.accent }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-transparent"
          style={{ borderBottomColor: "rgba(255,255,255,0.7)", borderLeftColor: "rgba(255,255,255,0.7)" }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <motion.p
        className="mt-3 text-[8px] uppercase text-white"
        style={{ fontFamily: FONT_BODY, letterSpacing: "0.25em", fontWeight: 500 }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        Opening
      </motion.p>
    </motion.div>
  );
}

function GoldenNavButton({
  href,
  children,
  loadingText = "LOADING",
  minWidth = "260px",
}: {
  href: string;
  children: ReactNode;
  loadingText?: string;
  minWidth?: string;
}) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (isNavigating) return;
      setIsNavigating(true);
      setTimeout(() => {
        window.location.href = href;
      }, 900);
    },
    [href, isNavigating]
  );

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setButtonHover(true)}
      onMouseLeave={() => setButtonHover(false)}
      disabled={isNavigating}
      whileTap={{ scale: 0.97 }}
      className="group relative inline-flex items-center gap-3 overflow-hidden px-10 py-4 text-[10px] font-medium uppercase tracking-[0.22em] text-white transition-all disabled:cursor-wait"
      style={{
        backgroundColor: THEME.primary,
        fontFamily: FONT_BODY,
        boxShadow: buttonHover && !isNavigating
          ? "0 12px 32px rgba(15,28,46,0.25)"
          : "0 4px 12px rgba(15,28,46,0.1)",
        transform: buttonHover && !isNavigating ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
        minWidth,
        justifyContent: "center",
      }}
    >
      <span
        className="absolute inset-0 origin-left"
        style={{
          background: `linear-gradient(90deg, ${THEME.accent} 0%, ${THEME.accentLight} 100%)`,
          transform: buttonHover && !isNavigating ? "scaleX(1)" : "scaleX(0)",
          transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
        }}
      />

      {isNavigating && (
        <motion.span
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.4), transparent)" }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
      )}

      <span
        className="relative z-10 transition-colors"
        style={{ color: buttonHover && !isNavigating ? THEME.primary : "#fff" }}
      >
        {isNavigating ? loadingText : children}
      </span>

      <span
        className="relative z-10 flex items-center"
        style={{ color: buttonHover && !isNavigating ? THEME.primary : "#fff" }}
      >
        {isNavigating ? (
          <motion.svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="30 60"
              strokeLinecap="round"
            />
          </motion.svg>
        ) : (
          <motion.div
            animate={buttonHover ? { x: 6 } : { x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <HiOutlineArrowRight className="h-3.5 w-3.5" />
          </motion.div>
        )}
      </span>
    </motion.button>
  );
}

const SkeletonLogo = memo(function SkeletonLogo() {
  return (
    <div className="flex-shrink-0 px-4 md:px-8">
      <div className="h-20 w-32 animate-pulse rounded-lg bg-gray-100 md:h-24 md:w-40" />
    </div>
  );
});

const LoadingState = memo(function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonLogo key={i} />
        ))}
      </div>
      <div className="flex justify-center">
        <div className="flex items-center gap-2 text-[11px] tracking-widest text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#0F1C2E]" />
          LOADING DEVELOPERS
        </div>
      </div>
    </div>
  );
});

const ErrorState = memo(function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <HiOutlineExclamationCircle className="mx-auto mb-3 h-12 w-12 text-red-500" />
      <h3 className="mb-2 text-xl text-red-700" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
        Unable to Load Developers
      </h3>
      <p className="mb-4 text-sm text-red-600">{error}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-[11px] tracking-widest text-white transition-colors hover:bg-red-700"
      >
        <HiArrowPath className="h-3.5 w-3.5" />
        RETRY
      </button>
    </div>
  );
});

const EmptyState = memo(function EmptyState() {
  return (
    <div className="py-12 text-center">
      <HiOutlineBuildingOffice2 className="mx-auto mb-3 h-12 w-12 text-gray-300" />
      <p className="text-[11px] tracking-widest text-gray-400">NO DEVELOPERS FOUND</p>
    </div>
  );
});

const DeveloperLogoItem = memo(function DeveloperLogoItem({ dev }: { dev: Developer }) {
  const [isOpening, setIsOpening] = useState(false);
  const imageUrls = useMemo(() => getDeveloperImageUrls(dev), [dev]);
  const href = `/developers/${dev.id}`;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      if (isOpening) return;
      setIsOpening(true);
      setTimeout(() => {
        window.location.href = href;
      }, 700);
    },
    [href, isOpening]
  );

  return (
    <a
      href={href}
      onClick={handleClick}
      className="developer-item group"
      aria-label={dev.name || "Developer"}
      title={dev.name || "Developer"}
    >
      <div className="developer-card">
        <div className="developer-image-wrapper">
          <ImageWithFallback
            src={imageUrls[0] || null}
            fallbacks={imageUrls.slice(1)}
            alt={dev.name || "Developer"}
            className="developer-image"
            width={200}
            height={120}
          />
          <AnimatePresence>
            {isOpening && <ClickLoaderOverlay roundedClass="rounded-lg" />}
          </AnimatePresence>
        </div>
        <div className="developer-name">
          <span>{dev.name}</span>
        </div>
      </div>
    </a>
  );
});

const MobileDeveloperCard = memo(function MobileDeveloperCard({ dev }: { dev: Developer }) {
  const [isOpening, setIsOpening] = useState(false);
  const imageUrls = useMemo(() => getDeveloperImageUrls(dev), [dev]);
  const href = `/developers/${dev.id}`;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      if (isOpening) return;
      setIsOpening(true);
      setTimeout(() => {
        window.location.href = href;
      }, 700);
    },
    [href, isOpening]
  );

  return (
    <a
      href={href}
      onClick={handleClick}
      className="developer-mobile-item group"
      aria-label={dev.name || "Developer"}
      title={dev.name || "Developer"}
    >
      <div className="developer-mobile-card">
        <div className="developer-mobile-image-wrapper">
          <ImageWithFallback
            src={imageUrls[0] || null}
            fallbacks={imageUrls.slice(1)}
            alt={dev.name || "Developer"}
            className="developer-mobile-image"
            width={160}
            height={100}
          />
          <AnimatePresence>
            {isOpening && <ClickLoaderOverlay roundedClass="rounded-lg" />}
          </AnimatePresence>
        </div>
        <div className="developer-mobile-name">
          <span>{dev.name}</span>
        </div>
      </div>
    </a>
  );
});

function LogoTrack({ developers }: { developers: Developer[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const posRef = useRef(0);
  const speedRef = useRef(0.5);
  const isPaused = useRef(false);
  const halfWidth = useRef(0);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    halfWidth.current = el.scrollWidth / 2;
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, developers]);

  useEffect(() => {
    const tick = () => {
      if (!isPaused.current && halfWidth.current > 0) {
        posRef.current -= speedRef.current;
        if (Math.abs(posRef.current) >= halfWidth.current) {
          posRef.current += halfWidth.current;
        }
        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${posRef.current}px,0,0)`;
        }
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const onEnter = useCallback(() => { isPaused.current = true; }, []);
  const onLeave = useCallback(() => { isPaused.current = false; }, []);

  const items = useMemo(() => [...developers, ...developers], [developers]);

  return (
    <div
      className="logo-track-js"
      ref={trackRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {items.map((dev, idx) => (
        <DeveloperLogoItem key={`${dev.id}-${idx}`} dev={dev} />
      ))}
    </div>
  );
}

export default function DevelopersSection() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchDevelopersData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${DEVELOPERS_API_URL}?limit=50&sort_by=name_asc&status=1&show_all=true`
      );
      const data = await response.json();
      if (data?.success) {
        const allDevelopers = data.data || [];
        const internationalDevelopers = allDevelopers.filter(
          (dev: Developer) => !isIndianDeveloper(dev)
        );
        setDevelopers(internationalDevelopers);
      } else {
        throw new Error(data?.message || "Failed to fetch developers");
      }
    } catch (err: any) {
      console.error("Developers fetch error:", err);
      setError(err.message || "Failed to load developers");
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched) {
      fetchDevelopersData();
    }
  }, [hasFetched, fetchDevelopersData]);

  const hasDevelopers = developers.length > 0;
  const showLoading = loading && !hasDevelopers;
  const showError = error && !hasDevelopers && !loading;
  const showEmpty = !loading && !hasDevelopers && !error;

  const handleRetry = useCallback(() => {
    fetchDevelopersData();
  }, [fetchDevelopersData]);

  return (
    <section className="bg-gradient-to-b from-white via-gray-50/30 to-white py-16 md:py-24">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-10 px-6 text-center md:mb-16 lg:px-10">
          <p className="text-[11px] tracking-widest text-[#C9A96E]">
            OUR TRUSTED PARTNERS
          </p>
          <h2
            className="mt-2 text-[32px] leading-tight text-[#0F1C2E] md:text-[40px]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Our International Developers
          </h2>
          <div className="mx-auto mt-3 h-px w-12 bg-[#C9A96E]" />
          <p className="mx-auto mt-4 max-w-xl text-sm text-[#6B7A8D]">
            We collaborate with the most trusted international developers in the region.
          </p>
        </div>

        <div className="relative">
          {showLoading && <LoadingState />}
          {showError && <ErrorState error={error!} onRetry={handleRetry} />}
          {showEmpty && <EmptyState />}

          {hasDevelopers && !showLoading && (
            <>
              <div className="relative hidden md:block">
                <div className="logo-fade-left" />
                <div className="logo-fade-right" />
                <div className="logo-wrapper overflow-hidden py-6">
                  <LogoTrack developers={developers} />
                </div>
              </div>

              <div className="px-3 md:hidden">
                <div className="developer-mobile-scroll">
                  {developers.map((dev) => (
                    <MobileDeveloperCard key={dev.id} dev={dev} />
                  ))}
                </div>
                <div className="mt-3 text-center">
                  <span className="inline-block text-[10px] tracking-widest text-gray-400">
                    ← SCROLL →
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {hasDevelopers && !showLoading && (
          <div className="mt-12 px-6 text-center md:mt-16 lg:px-10">
            <GoldenNavButton href="/developers" loadingText="LOADING DEVELOPERS" minWidth="270px">
              VIEW ALL DEVELOPERS
            </GoldenNavButton>
          </div>
        )}
      </div>

      <style jsx global>{`
        .logo-fade-left {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 10;
          width: 100px;
          pointer-events: none;
          background: linear-gradient(to right, #ffffff, transparent);
        }
        .logo-fade-right {
          position: absolute;
          top: 0;
          bottom: 0;
          right: 0;
          z-index: 10;
          width: 100px;
          pointer-events: none;
          background: linear-gradient(to left, #ffffff, transparent);
        }
        @media (min-width: 768px) {
          .logo-fade-left, .logo-fade-right { width: 150px; }
        }

        .logo-wrapper {
          mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
        }

        .logo-track-js {
          display: flex;
          align-items: center;
          width: max-content;
          will-change: transform;
        }

        .developer-item {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 15px;
          cursor: pointer;
        }
        @media (min-width: 768px) {
          .developer-item { padding: 0 25px; }
        }

        .developer-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .developer-item:hover .developer-card { transform: translateY(-4px); }

        .developer-image-wrapper {
          position: relative;
          width: 160px;
          height: 90px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        @media (min-width: 768px) {
          .developer-image-wrapper { width: 200px; height: 110px; padding: 16px; }
        }
        .developer-item:hover .developer-image-wrapper {
          border-color: #C9A96E;
          box-shadow: 0 8px 24px rgba(201,169,110,0.15);
        }

        .developer-image {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          filter: grayscale(20%);
          opacity: 0.8;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .developer-item:hover .developer-image {
          filter: grayscale(0%);
          opacity: 1;
          transform: scale(1.05);
        }

        .developer-name {
          font-size: 11px;
          font-weight: 500;
          color: #0F1C2E;
          text-align: center;
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: 0.3px;
          transition: color 0.3s ease;
        }
        @media (min-width: 768px) {
          .developer-name { font-size: 12px; max-width: 200px; }
        }
        .developer-item:hover .developer-name { color: #C9A96E; }

        .developer-mobile-scroll {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 12px 4px;
          scrollbar-width: none;
          cursor: grab;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .developer-mobile-scroll:active { cursor: grabbing; }
        .developer-mobile-scroll::-webkit-scrollbar { display: none; }
        .developer-mobile-item { flex: 0 0 auto; scroll-snap-align: center; }
        .developer-mobile-card { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .developer-mobile-image-wrapper {
          position: relative;
          width: 120px;
          height: 70px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .developer-mobile-item:active .developer-mobile-image-wrapper {
          transform: scale(0.95);
          border-color: #C9A96E;
        }
        .developer-mobile-image {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          transition: transform 0.3s ease;
        }
        .developer-mobile-item:active .developer-mobile-image { transform: scale(1.05); }
        .developer-mobile-name {
          font-size: 10px;
          font-weight: 500;
          color: #0F1C2E;
          text-align: center;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: 0.2px;
        }
      `}</style>
    </section>
  );
}