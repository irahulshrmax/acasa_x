"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";

interface Slide {
  line1: string;
  line2: string;
  label: string;
}

const HERO_IMAGE_DESKTOP = "/HEROSS.png";
const HERO_IMAGE_MOBILE = "/mobileHero.jpg";
const PHONE = "+971502590071";
const AUTOPLAY_DURATION = 6000;

const SLIDES: Slide[] = [
  {
    line1: "Add a touch of luxury with",
    line2: "refined exclusivity.",
    label: "EXCLUSIVE RESIDENCES",
  },
  {
    line1: "Discover residences that define",
    line2: "the art of fine living.",
    label: "MODERN ESTATES",
  },
  {
    line1: "Experience the pinnacle of",
    line2: "architectural brilliance.",
    label: "WATERFRONT HOMES",
  },
  {
    line1: "Your sanctuary of sophistication",
    line2: "awaits your arrival.",
    label: "PENTHOUSES",
  },
  {
    line1: "Crafting legacies through",
    line2: "exceptional properties.",
    label: "HERITAGE MANSIONS",
  },
];

type TypewriterPhase =
  | "typing1"
  | "typing2"
  | "pausing"
  | "deleting2"
  | "deleting1"
  | "waiting";

function useTypewriter(line1: string, line2: string, speed = 40) {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [phase, setPhase] = useState<TypewriterPhase>("typing1");
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setText1("");
    setText2("");
    setPhase("typing1");
    return () => {
      mounted.current = false;
    };
  }, [line1, line2]);

  useEffect(() => {
    if (timeout.current) clearTimeout(timeout.current);
    if (!mounted.current) return;

    const delay = (ms: number, fn: () => void) => {
      timeout.current = setTimeout(() => {
        if (mounted.current) fn();
      }, ms);
    };

    switch (phase) {
      case "typing1":
        if (text1.length < line1.length) {
          delay(speed, () => setText1(line1.slice(0, text1.length + 1)));
        } else {
          delay(150, () => setPhase("typing2"));
        }
        break;

      case "typing2":
        if (text2.length < line2.length) {
          delay(speed, () => setText2(line2.slice(0, text2.length + 1)));
        } else {
          delay(3000, () => setPhase("pausing"));
        }
        break;

      case "pausing":
        delay(100, () => setPhase("deleting2"));
        break;

      case "deleting2":
        if (text2.length > 0) {
          delay(20, () => setText2(text2.slice(0, -1)));
        } else {
          delay(60, () => setPhase("deleting1"));
        }
        break;

      case "deleting1":
        if (text1.length > 0) {
          delay(20, () => setText1(text1.slice(0, -1)));
        } else {
          delay(200, () => setPhase("waiting"));
        }
        break;

      case "waiting":
        delay(500, () => {
          setPhase("typing1");
          setText1("");
          setText2("");
        });
        break;
    }

    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, [phase, text1, text2, line1, line2, speed]);

  return {
    text1,
    text2,
    showCursor: phase !== "waiting",
    cursorOnLine1: phase === "typing1" || phase === "deleting1",
    cursorOnLine2:
      phase === "typing2" || phase === "deleting2" || phase === "pausing",
  };
}

function Cursor() {
  return (
    <span
      className="inline-block w-[2px] bg-[#C9A96E] ml-[1px]"
      style={{
        height: "0.85em",
        verticalAlign: "text-bottom",
        animation: "blink 1s step-end infinite",
      }}
    />
  );
}

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const autoplayTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStart = useRef(0);

  const slide = SLIDES[currentIndex];
  const { text1, text2, showCursor, cursorOnLine1, cursorOnLine2 } =
    useTypewriter(slide.line1, slide.line2);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    autoplayTimer.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, AUTOPLAY_DURATION);
    return () => {
      if (autoplayTimer.current) clearTimeout(autoplayTimer.current);
    };
  }, [currentIndex]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const delta = touchStart.current - e.changedTouches[0].clientX;
      if (Math.abs(delta) > 60) {
        delta > 0 ? nextSlide() : prevSlide();
      }
    },
    [nextSlide, prevSlide]
  );

  const lineHeight = isMobile ? 34 : 64;
  const fontSize = isMobile
    ? "clamp(20px, 6.2vw, 28px)"
    : "clamp(40px, 3.8vw, 56px)";

  return (
    <>
      <style jsx global>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>

      <section
        className="relative w-full overflow-visible"
        style={{
          height: "100svh",
          minHeight: isMobile ? "580px" : "620px",
          maxHeight: isMobile ? "820px" : "800px",
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={isMobile ? HERO_IMAGE_MOBILE : HERO_IMAGE_DESKTOP}
            alt="Luxury real estate property in Dubai"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: isMobile ? "center 55%" : "center 40%" }}
            loading="eager"
            decoding="sync"
            fetchPriority="high"
          />
          <div
            className="absolute inset-0"
            style={{
              background: isMobile
                ? "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.10) 30%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.90) 100%)"
                : "linear-gradient(135deg, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.30) 100%)",
            }}
          />
        </div>

        {/* Content */}
        <div
          className={`relative z-10 h-full w-full flex flex-col ${
            isMobile ? "justify-end pb-28" : "justify-center"
          } px-5 md:px-12 lg:pl-[8%]`}
        >
          <div className="max-w-[700px]">
            <p className="text-white/50 text-[10px] md:text-[11px] tracking-[0.35em] uppercase mb-3 md:mb-4 border-l-2 border-[#C9A96E]/50 pl-3">
              {slide.label}
            </p>

            <h1
              className="text-white font-serif mb-5 md:mb-7"
              style={{
                fontSize,
                letterSpacing: "-0.01em",
                lineHeight: `${lineHeight}px`,
              }}
            >
              <span
                className="block w-full"
                style={{
                  minHeight: lineHeight,
                  whiteSpace: isMobile ? "nowrap" : "normal",
                  overflow: isMobile ? "hidden" : "visible",
                  textOverflow: isMobile ? "ellipsis" : "clip",
                  wordBreak: isMobile ? "normal" : "break-word",
                }}
              >
                {text1}
                {showCursor && cursorOnLine1 && <Cursor />}
              </span>
              <span
                className="block w-full"
                style={{
                  minHeight: lineHeight,
                  whiteSpace: isMobile ? "nowrap" : "normal",
                  overflow: isMobile ? "hidden" : "visible",
                  textOverflow: isMobile ? "ellipsis" : "clip",
                  wordBreak: isMobile ? "normal" : "break-word",
                }}
              >
                {text2}
                {showCursor && cursorOnLine2 && <Cursor />}
              </span>
            </h1>

            <div className="w-14 h-[2px] bg-[#C9A96E]/60 mb-6 md:mb-8" />

            <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-6">
              <Link
                href="/featured-explore-properties"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-white border border-[#C9A96E]/60 bg-[#C9A96E]/10 hover:bg-[#C9A96E] hover:text-black transition-colors duration-300"
              >
                Explore Properties
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/contact-us"
                className="inline-flex items-center px-6 py-3.5 text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-white/60 border border-white/15 hover:border-white/40 hover:text-white transition-colors duration-300"
              >
                Schedule Viewing
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[10px] md:text-[11px] uppercase tracking-[0.15em]">
              <Link
                href="/about-us"
                className="text-white/40 hover:text-[#C9A96E] transition-colors"
              >
                About Us
              </Link>
              <span className="w-[1px] h-3 bg-white/15" />
              <Link
                href="/featured-explore-properties?view=map"
                className="text-white/40 hover:text-[#C9A96E] transition-colors"
              >
                Locations
              </Link>
              <span className="w-[1px] h-3 bg-white/15" />
              <a
                href={`tel:${PHONE}`}
                className="text-white/40 hover:text-[#C9A96E] transition-colors"
              >
                {PHONE}
              </a>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div
          className="absolute bottom-0 left-1/2 z-40 w-full max-w-[1000px] flex justify-center px-4"
          style={{
            transform: isMobile
              ? "translate(-50%, 55%)"
              : "translate(-50%, 65%)",
          }}
        >
          <div className="w-full">
            <SearchBar />
          </div>
        </div>
      </section>

      <div
        style={{ height: isMobile ? 180 : 120 }}
        className="bg-white"
      />
    </>
  );
}