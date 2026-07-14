"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import { ChevronLeft, ChevronRight, Play, Pause, Sparkles, ArrowRight } from "lucide-react";

interface Slide {
  line1: string;
  line2: string;
  label: string;
  tag?: string;
  ctaText?: string;
  ctaLink?: string;
}

interface HeroProps {
  autoplay?: boolean;
  autoplayDelay?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  className?: string;
}

const HERO_SLIDES: Slide[] = [
  {
    line1: "Add a touch of luxury with",
    line2: "refined exclusivity.",
    label: "EXCLUSIVE RESIDENCES",
    tag: "Premium Collection",
    ctaText: "Explore Properties",
    ctaLink: "/properties",
  },
  {
    line1: "Discover residences that define",
    line2: "the art of fine living.",
    label: "MODERN ESTATES",
    tag: "Contemporary Design",
    ctaText: "View Estates",
    ctaLink: "/properties",
  },
  {
    line1: "Experience the pinnacle of",
    line2: "architectural brilliance.",
    label: "WATERFRONT HOMES",
    tag: "Coastal Luxury",
    ctaText: "Discover Waterfront",
    ctaLink: "/properties",
  },
  {
    line1: "Your sanctuary of sophistication",
    line2: "awaits your arrival.",
    label: "PENTHOUSES",
    tag: "Sky Living",
    ctaText: "View Penthouses",
    ctaLink: "/properties",
  },
  {
    line1: "Crafting legacies through",
    line2: "exceptional properties.",
    label: "HERITAGE MANSIONS",
    tag: "Timeless Elegance",
    ctaText: "Explore Mansions",
    ctaLink: "/properties",
  },
];

const HERO_IMAGE = "/Hero.png";
const DEFAULT_SLIDE_DURATION = 6000;

// ============================================
// TYPEWRITER HOOK
// ============================================
function useTypewriter(line1: string, line2: string, speed: number = 40) {
  const [displayText1, setDisplayText1] = useState<string>("");
  const [displayText2, setDisplayText2] = useState<string>("");
  const [phase, setPhase] = useState<"typing1" | "typing2" | "pausing" | "deleting2" | "deleting1" | "waiting">("typing1");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    setDisplayText1("");
    setDisplayText2("");
    setPhase("typing1");
    return () => { isMountedRef.current = false; };
  }, [line1, line2]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!isMountedRef.current) return;

    switch (phase) {
      case "typing1":
        if (displayText1.length < line1.length) {
          timeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) setDisplayText1(line1.slice(0, displayText1.length + 1));
          }, speed);
        } else {
          timeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) setPhase("typing2");
          }, 150);
        }
        break;
      case "typing2":
        if (displayText2.length < line2.length) {
          timeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) setDisplayText2(line2.slice(0, displayText2.length + 1));
          }, speed);
        } else {
          timeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) setPhase("pausing");
          }, 3000);
        }
        break;
      case "pausing":
        timeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) setPhase("deleting2");
        }, 100);
        break;
      case "deleting2":
        if (displayText2.length > 0) {
          timeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) setDisplayText2(displayText2.slice(0, -1));
          }, 20);
        } else {
          timeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) setPhase("deleting1");
          }, 60);
        }
        break;
      case "deleting1":
        if (displayText1.length > 0) {
          timeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) setDisplayText1(displayText1.slice(0, -1));
          }, 20);
        } else {
          timeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) setPhase("waiting");
          }, 200);
        }
        break;
      case "waiting":
        timeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setPhase("typing1");
            setDisplayText1("");
            setDisplayText2("");
          }
        }, 500);
        break;
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [phase, displayText1, displayText2, line1, line2, speed]);

  const showCursor = phase !== "waiting";
  const onLine1 = phase === "typing1" || phase === "deleting1";
  const onLine2 = phase === "typing2" || phase === "deleting2" || phase === "pausing";

  return { displayText1, displayText2, showCursor, onLine1, onLine2 };
}

function useProgressBar(duration: number, isActive: boolean) {
  const [progress, setProgress] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) { setProgress(0); return; }
    setProgress(0);
    startTimeRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - startTimeRef.current) / duration;
      const p = Math.min(elapsed, 1);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [duration, isActive]);

  return progress;
}

// ============================================
// SUB COMPONENTS
// ============================================
const BlinkingCursor: React.FC = () => (
  <span
    className="inline-block w-[2px] bg-[#C9A96E] ml-[1px]"
    style={{
      height: "0.85em",
      verticalAlign: "text-bottom",
      animation: "blink 1s step-end infinite",
    }}
  />
);

const ProgressIndicator: React.FC<{
  total: number;
  current: number;
  duration: number;
  isActive: boolean;
  onDotClick?: (index: number) => void;
}> = ({ total, current, duration, isActive, onDotClick }) => {
  const progress = useProgressBar(duration, isActive);
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onDotClick?.(i)}
          className="relative overflow-hidden rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50"
          style={{
            width: i === current ? "32px" : "8px",
            height: "3px",
            background: i < current ? "rgba(201,169,110,0.6)" : "rgba(255,255,255,0.2)",
          }}
          aria-label={`Go to slide ${i + 1}`}
        >
          {i === current && (
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
              style={{ width: `${progress * 100}%`, background: "#C9A96E" }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

const NavigationControls: React.FC<{
  onPrevious: () => void;
  onNext: () => void;
  onToggleAutoplay?: () => void;
  isAutoplay?: boolean;
  className?: string;
}> = ({ onPrevious, onNext, onToggleAutoplay, isAutoplay, className = "" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <button
      onClick={onPrevious}
      className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-[#C9A96E]/30 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50"
      aria-label="Previous slide"
    >
      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
    </button>
    {onToggleAutoplay && (
      <button
        onClick={onToggleAutoplay}
        className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-[#C9A96E]/30 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50"
        aria-label={isAutoplay ? "Pause slideshow" : "Play slideshow"}
      >
        {isAutoplay ? <Pause className="w-3 h-3 sm:w-4 sm:h-4 text-white" /> : <Play className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
      </button>
    )}
    <button
      onClick={onNext}
      className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-[#C9A96E]/30 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50"
      aria-label="Next slide"
    >
      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
    </button>
  </div>
);

const HeroBackground: React.FC<{ mobile: boolean }> = ({ mobile }) => (
  <div className="absolute inset-0 z-0 overflow-hidden bg-[#0D1520]">
    <Image
      src={HERO_IMAGE}
      alt="Luxury Property"
      fill
      priority
      quality={100}
      sizes="100vw"
      className="object-cover transition-transform duration-10000 hover:scale-105"
      style={{ objectPosition: mobile ? "center 60%" : "center 40%" }}
    />
    <div
      className="absolute inset-0 z-[3]"
      style={{
        background: mobile
          ? "linear-gradient(to bottom, rgba(13,21,32,0.4) 0%, rgba(13,21,32,0.2) 30%, rgba(13,21,32,0.3) 50%, rgba(13,21,32,0.75) 75%, rgba(13,21,32,0.95) 100%)"
          : "linear-gradient(135deg, rgba(13,21,32,0.6) 0%, rgba(13,21,32,0.2) 40%, rgba(13,21,32,0.1) 60%, rgba(13,21,32,0.4) 100%)",
      }}
    />
    {!mobile && (
      <div
        className="absolute inset-0 z-[4] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(13,21,32,0.3) 100%)" }}
      />
    )}
  </div>
);

// ============================================
// MAIN HERO COMPONENT - UNIFIED UI
// ============================================
export default function Hero({
  autoplay = true,
  autoplayDelay = DEFAULT_SLIDE_DURATION,
  showControls = true,
  showIndicators = true,
  className = "",
}: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAutoplay, setIsAutoplay] = useState<boolean>(autoplay);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = HERO_SLIDES[currentIndex];
  const { displayText1, displayText2, showCursor, onLine1, onLine2 } = useTypewriter(
    currentSlide.line1,
    currentSlide.line2
  );

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const goToSlide = useCallback((index: number) => {
    if (index === currentIndex) return;
    setCurrentIndex(index);
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    goToSlide((currentIndex + 1) % HERO_SLIDES.length);
  }, [currentIndex, goToSlide]);

  const goToPrevious = useCallback(() => {
    goToSlide((currentIndex - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, [currentIndex, goToSlide]);

  const toggleAutoplay = useCallback(() => setIsAutoplay((prev) => !prev), []);

  useEffect(() => {
    if (!isAutoplay || isHovered) {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = setTimeout(goToNext, autoplayDelay);
    return () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };
  }, [isAutoplay, isHovered, autoplayDelay, goToNext, currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); goToNext(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goToPrevious(); }
      else if (e.key === " ") { e.preventDefault(); toggleAutoplay(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrevious, toggleAutoplay]);

  const renderTypewriter = useCallback((
    lineHeight: number,
    fontSize: string,
    shadow: string
  ) => (
    <h1
      className="text-white font-playfair"
      style={{
        fontSize,
        letterSpacing: "-0.02em",
        textShadow: shadow,
        fontWeight: 400,
        minHeight: `${lineHeight * 2}px`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <span className="block whitespace-nowrap" style={{ height: `${lineHeight}px`, lineHeight: `${lineHeight}px` }}>
        {displayText1}
        {showCursor && onLine1 && <BlinkingCursor />}
      </span>
      <span className="block whitespace-nowrap" style={{ height: `${lineHeight}px`, lineHeight: `${lineHeight}px` }}>
        {displayText2}
        {showCursor && onLine2 && <BlinkingCursor />}
      </span>
    </h1>
  ), [displayText1, displayText2, showCursor, onLine1, onLine2]);

  const slideNumber = useMemo(() => String(currentIndex + 1).padStart(2, "0"), [currentIndex]);
  const totalSlides = useMemo(() => String(HERO_SLIDES.length).padStart(2, "0"), []);

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600;700&display=swap");

        .font-playfair { font-family: "Playfair Display", serif; font-weight: 400; }
        .font-inter { font-family: "Inter", sans-serif; font-weight: 400; }

        .search-container-unified {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translate(-50%, 55%);
          z-index: 40;
          width: 100%;
          max-width: 1000px;
          display: flex;
          justify-content: center;
          padding: 0 16px;
          pointer-events: none;
        }
        .search-container-unified > * { pointer-events: auto; width: 100%; }
        @media (min-width: 1024px) {
          .search-container-unified { transform: translate(-50%, 65%); }
        }

        .enquire-btn {
          background: transparent;
          color: #fff;
          border: 1px solid rgba(201, 169, 110, 0.55);
          transition: all 0.45s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          backdrop-filter: blur(6px);
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03), 0 4px 18px rgba(0,0,0,0.12);
        }
        .enquire-btn::before {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(90deg, #C9A96E 0%, #D4B888 50%, #C9A96E 100%);
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); z-index: 0;
        }
        .enquire-btn::after {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transform: translateX(-120%); transition: transform 0.7s ease; z-index: 0;
        }
        .enquire-btn:hover::before { transform: scaleX(1); }
        .enquire-btn:hover::after { transform: translateX(120%); }
        .enquire-btn:hover {
          color: #0D1520; border-color: #C9A96E;
          box-shadow: 0 12px 32px rgba(201,169,110,0.22), 0 4px 16px rgba(0,0,0,0.18);
          transform: translateY(-2px);
        }
        .enquire-btn span { position: relative; z-index: 1; }

        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tabnum { font-variant-numeric: tabular-nums; }
      `}</style>

      {/* UNIFIED HERO SECTION - Same UI for Mobile & Desktop */}
      <section
        className={`relative w-full overflow-visible bg-[#0D1520] ${className}`}
        style={{
          height: "100svh",
          minHeight: isMobile ? "560px" : "600px",
          maxHeight: isMobile ? "800px" : "780px",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <HeroBackground mobile={isMobile} />

        {/* Main Content - Unified Layout */}
        <div
          className={`relative z-10 h-full w-full flex flex-col ${
            isMobile ? "justify-end pb-32" : "justify-center"
          } px-5 md:px-12 lg:pl-[8%]`}
        >
          <div className="max-w-[700px]">
            {/* Tag */}
            {currentSlide.tag && (
              <div className="flex items-center gap-2 mb-3 md:mb-4 animate-[fadeInUp_0.6s_ease-out]">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-[#C9A96E]" />
                <span className="text-[#C9A96E]/80 text-[9px] md:text-xs tracking-[0.2em] font-inter uppercase">
                  {currentSlide.tag}
                </span>
              </div>
            )}

            {/* Label */}
            <div className="mb-3 md:mb-5 animate-[fadeInUp_0.6s_ease-out_0.1s]">
              <span
                key={`label-${currentIndex}`}
                className="text-white/45 text-[9px] md:text-[10px] tracking-[0.35em] font-inter uppercase border-l-2 border-[#C9A96E]/50 pl-2 md:pl-3"
              >
                {currentSlide.label}
              </span>
            </div>

            {/* Typewriter Heading */}
            <div className="mb-4 md:mb-5 animate-[fadeInUp_0.6s_ease-out_0.2s]">
              {renderTypewriter(
                isMobile ? 46 : 62,
                isMobile ? "clamp(26px, 7.5vw, 36px)" : "clamp(34px, 3.5vw, 54px)",
                "0 2px 20px rgba(0,0,0,0.3)"
              )}
            </div>

            {/* Divider */}
            <div className="w-12 md:w-16 h-[1px] bg-gradient-to-r from-[#C9A96E]/60 to-transparent mb-4 md:mb-6 animate-[fadeInUp_0.6s_ease-out_0.3s]" />

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-6 md:mb-0 animate-[fadeInUp_0.6s_ease-out_0.4s]">
              <Link
                href={currentSlide.ctaLink || "/properties"}
                className="enquire-btn inline-flex items-center justify-center font-inter uppercase group"
                style={{
                  fontSize: isMobile ? "9px" : "10px",
                  letterSpacing: "0.22em",
                  padding: isMobile ? "12px 24px" : "14px 32px",
                }}
              >
                <span className="flex items-center gap-2">
                  {currentSlide.ctaText || "Enquire Now"}
                  <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
              <Link
                href="/about"
                className="text-white/60 hover:text-[#C9A96E] transition-colors duration-300 font-inter text-[10px] md:text-xs tracking-[0.15em] uppercase border-b border-transparent hover:border-[#C9A96E]/30 pb-1"
              >
                Learn More
              </Link>
            </div>

            {/* Mobile Indicator & Controls */}
            {isMobile && (
              <div className="flex items-center justify-between animate-[fadeInUp_0.6s_ease-out_0.5s]">
                <ProgressIndicator
                  total={HERO_SLIDES.length}
                  current={currentIndex}
                  duration={autoplayDelay}
                  isActive={isAutoplay && !isHovered}
                  onDotClick={goToSlide}
                />
                <div className="flex items-center gap-3">
                  <NavigationControls
                    onPrevious={goToPrevious}
                    onNext={goToNext}
                    onToggleAutoplay={toggleAutoplay}
                    isAutoplay={isAutoplay}
                  />
                  <div className="flex items-center gap-2">
                    <span className="font-inter text-white/70 tabnum text-[10px] tracking-[0.1em] font-medium">
                      {slideNumber}
                    </span>
                    <div className="w-4 h-[1px] bg-white/30" />
                    <span className="font-inter text-white/35 tabnum text-[10px] tracking-[0.1em]">
                      {totalSlides}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Right Side Controls */}
        {!isMobile && (
          <div className="absolute right-[5%] top-1/2 -translate-y-1/2 z-10 hidden lg:flex flex-col items-end gap-4">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-inter text-white/90 tabnum text-[11px] tracking-[0.1em] font-medium">
                {slideNumber}
              </span>
              <div className="w-6 h-[1px] bg-white/40" />
              <span className="font-inter text-white/40 tabnum text-[11px] tracking-[0.1em]">
                {totalSlides}
              </span>
            </div>
            <div className="flex flex-col gap-2 items-end">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className="group bg-transparent border-none outline-none cursor-pointer p-0 transition-all duration-300"
                  aria-label={`Go to slide ${i + 1}`}
                >
                  <div
                    className="rounded-full transition-all duration-500 group-hover:scale-110"
                    style={{
                      width: i === currentIndex ? "28px" : "6px",
                      height: "3px",
                      background: i === currentIndex ? "#C9A96E" : "rgba(255,255,255,0.3)",
                    }}
                  />
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-col items-end gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-[1px] bg-white/30" />
                <span className="font-inter text-white/50 text-[9px] tracking-[0.25em] font-medium">
                  EXCLUSIVE PROPERTIES
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-[1px] bg-white/30" />
                <span className="font-inter text-white/50 text-[9px] tracking-[0.25em] font-medium">
                  PREMIUM SERVICE
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Unified SearchBar - Same position on both */}
        <div className="search-container-unified">
          <SearchBar />
        </div>
      </section>

      {/* Spacer for search bar overlap */}
      <div style={{ height: isMobile ? "180px" : "120px" }} className="bg-white" />
    </>
  );
}