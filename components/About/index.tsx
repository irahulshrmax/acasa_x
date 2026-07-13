"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineBuildingOffice2,
  HiOutlineArrowRight,
} from "react-icons/hi2";

const ABOUT_API_URL = "/api/v1/about";
const IMAGE_BASE_URL = "https://www.acasa.ae";

const THEME = {
  primary: "#0F1C2E",
  accent: "#C9A96E",
  accentLight: "#D4B888",
  muted: "#6B7A8D",
};

const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_HEADING = "'Playfair Display', Georgia, serif";

interface AboutImage {
  id: number;
  filename?: string;
  url: string;
  label: string;
}

interface AboutData {
  id: number;
  title: string;
  slug: string;
  heading: string | null;
  imageurl: string | null;
  descriptions: string | null;
  descriptions_other: string | null;
  seo_description: string | null;
  image_url?: string;
  image_variations?: string[];
  primary_image?: string;
  all_images?: AboutImage[];
}

function buildImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const clean = path.trim();
  if (!clean) return null;

  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  const normalized = clean.startsWith("/") ? clean : `/${clean}`;

  if (normalized.startsWith("/upload/")) {
    return `${IMAGE_BASE_URL}${normalized}`;
  }

  if (normalized.startsWith("/about/")) {
    return `${IMAGE_BASE_URL}/upload${normalized}`;
  }

  return `${IMAGE_BASE_URL}/upload${normalized}`;
}

function collectImageCandidates(about: AboutData | null): string[] {
  if (!about) return [];
  const candidates = new Set<string>();
  const add = (path?: string | null) => {
    const url = buildImageUrl(path);
    if (url) candidates.add(url);
  };

  add(about.image_url);
  add(about.imageurl);
  add(about.primary_image);
  about.image_variations?.forEach(add);
  about.all_images?.forEach((img) => add(img.url));

  return Array.from(candidates);
}

function SmartImage({
  candidates,
  alt,
  className,
}: {
  candidates: string[];
  alt: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setIndex(0);
    setFailed(false);
  }, [candidates]);

  const handleError = useCallback(() => {
    if (index < candidates.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      setFailed(true);
    }
  }, [index, candidates.length]);

  if (failed || candidates.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <HiOutlineBuildingOffice2 className="h-16 w-16 text-gray-300" />
      </div>
    );
  }

  return (
    <img
      key={candidates[index]}
      src={candidates[index]}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
      decoding="async"
    />
  );
}

function GoldenNavButton({
  href,
  children,
  loadingText = "LOADING",
  minWidth = "260px",
}: {
  href: string;
  children: React.ReactNode;
  loadingText?: string;
  minWidth?: string;
}) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [hover, setHover] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isNavigating) return;
    setIsNavigating(true);
    setTimeout(() => {
      window.location.href = href;
    }, 900);
  };

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={isNavigating}
      whileTap={{ scale: 0.97 }}
      className="group relative inline-flex items-center gap-3 overflow-hidden px-10 py-4 text-[10px] font-medium uppercase tracking-[0.22em] text-white transition-all disabled:cursor-wait"
      style={{
        backgroundColor: THEME.primary,
        fontFamily: FONT_BODY,
        boxShadow:
          hover && !isNavigating
            ? "0 12px 32px rgba(15,28,46,0.25)"
            : "0 4px 12px rgba(15,28,46,0.1)",
        transform: hover && !isNavigating ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
        minWidth,
        justifyContent: "center",
      }}
    >
      <span
        className="absolute inset-0 origin-left"
        style={{
          background: `linear-gradient(90deg, ${THEME.accent} 0%, ${THEME.accentLight} 100%)`,
          transform: hover && !isNavigating ? "scaleX(1)" : "scaleX(0)",
          transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
        }}
      />

      {isNavigating && (
        <motion.span
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(201,169,110,0.4), transparent)",
          }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
      )}

      <span
        className="relative z-10 transition-colors"
        style={{ color: hover && !isNavigating ? THEME.primary : "#fff" }}
      >
        {isNavigating ? loadingText : children}
      </span>

      <span
        className="relative z-10 flex items-center"
        style={{ color: hover && !isNavigating ? THEME.primary : "#fff" }}
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
            animate={hover ? { x: 6 } : { x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <HiOutlineArrowRight className="h-3.5 w-3.5" />
          </motion.div>
        )}
      </span>
    </motion.button>
  );
}

function stripHtml(html: string) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractParagraphs(html: string, limit = 3): string[] {
  if (!html) return [];
  const matches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  const paragraphs = matches
    .map((p) => stripHtml(p))
    .filter((text) => text.length > 20);
  return paragraphs.slice(0, limit);
}

export default function AboutSection() {
  const [about, setAbout] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(ABOUT_API_URL, { signal: controller.signal });
        const json = await res.json();
        if (!json?.success) throw new Error(json?.message || "Failed to load");
        setAbout(json.data);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("About fetch error:", err);
          setError((err as Error).message);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const imageCandidates = useMemo(() => collectImageCandidates(about), [about]);

  const paragraphs = useMemo(() => {
    const source = about?.descriptions_other || about?.descriptions || "";
    if (source) return extractParagraphs(source, 3);
    const fallback = about?.seo_description || "";
    return fallback ? [fallback] : [];
  }, [about]);

  const headingText =
    about?.heading?.trim() || about?.title?.trim() || "About ACASA";

  const totalImages = about?.all_images?.length || 0;

  if (loading) {
    return (
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-gray-200" />
            <div className="space-y-4">
              <div className="h-4 w-24 animate-pulse bg-gray-200" />
              <div className="h-10 w-3/4 animate-pulse bg-gray-200" />
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse bg-gray-200" />
                <div className="h-4 w-5/6 animate-pulse bg-gray-200" />
                <div className="h-4 w-4/6 animate-pulse bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error && !about) {
    return (
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10 text-center">
          <p className="text-sm text-gray-500">Unable to load content right now.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-gray-100 bg-white py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div
            className="relative w-full overflow-hidden rounded-2xl bg-gray-100 shadow-xl"
            style={{ aspectRatio: "4 / 3" }}
          >
            <SmartImage
              candidates={imageCandidates}
              alt={about?.title || "About ACASA"}
              className="absolute inset-0 h-full w-full object-cover"
            />

            {totalImages > 1 && (
              <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[9px] text-white backdrop-blur-sm">
                {totalImages} images
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <p
              className="text-[11px] tracking-widest"
              style={{ color: THEME.accent }}
            >
              ABOUT US
            </p>

            <h2
              className="mt-2 text-[32px] leading-tight md:text-[40px]"
              style={{ color: THEME.primary, fontFamily: FONT_HEADING }}
            >
              {headingText}
            </h2>

            <div
              className="mt-3 h-px w-12"
              style={{ backgroundColor: THEME.accent }}
            />

            {paragraphs.length > 0 && (
              <div className="mt-6 space-y-4">
                {paragraphs.map((para, idx) => (
                  <p
                    key={idx}
                    className="text-sm leading-relaxed text-[#4A5462]"
                  >
                    {para}
                  </p>
                ))}
              </div>
            )}

            <div className="mt-8">
              <GoldenNavButton
                href="/about-us"
                loadingText="LOADING ABOUT"
                minWidth="270px"
              >
                LEARN MORE ABOUT US
              </GoldenNavButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}