"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import { useRouter } from "next/navigation";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type Developer = {
  id: number;
  name: string | null;
  slug: string | null;
  seo_slug: string | null;
  image: string | null;
  image_url?: string | null;
};

const FETCH_LIMIT = 30;

const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed === "" || trimmed === "null" || trimmed === "undefined") return false;
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
};

const getDeveloperLogo = (dev: Developer): string => {
  const candidates = [dev.image_url, dev.image];
  for (const url of candidates) {
    if (isValidImageUrl(url)) return url!;
  }
  return "";
};

export default function DeveloperCarousel() {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [developerPool, setDeveloperPool] = useState<Developer[]>([]);
  const [failedIds, setFailedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const controls = useAnimation();

  const fetchDevelopers = useCallback(async () => {
    try {
      setLoading(true);
      setFailedIds(new Set());

      const res = await fetch(
        `/api/v1/developers?page=1&limit=${FETCH_LIMIT}&sort_by=name_asc`
      );
      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        const valid = result.data.filter((d: Developer) => {
          const hasName = typeof d.name === "string" && d.name.trim().length > 0;
          const hasLogo = getDeveloperLogo(d) !== "";
          return hasName && hasLogo;
        });
        setDeveloperPool(valid);
      }
    } catch (error) {
      console.error("Error fetching developers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevelopers();
  }, [fetchDevelopers]);

  const developers = useMemo(() => {
    return developerPool.filter((dev) => !failedIds.has(dev.id));
  }, [developerPool, failedIds]);

  const handleLogoError = useCallback((devId: number) => {
    setFailedIds((prev) => {
      if (prev.has(devId)) return prev;
      const next = new Set(prev);
      next.add(devId);
      return next;
    });
  }, []);

  const navigateToDeveloper = useCallback(
    (slug: string | null | undefined) => {
      if (slug) {
        router.push(`/developers/${slug}`);
      } else {
        console.warn("No slug available for developer");
      }
    },
    [router]
  );

  // Check scroll position for arrows
  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", checkScrollPosition);
    // Initial check
    setTimeout(checkScrollPosition, 100);

    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
    };
  }, [checkScrollPosition, developers]);

  const scroll = useCallback((direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    const targetScroll =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  }, []);

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-neutral-50">
        <div className="text-center mb-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400">
            Developers
          </p>
          <h2
            className="mt-3 text-3xl md:text-4xl lg:text-5xl text-neutral-900 font-normal tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Our Trusted Partners
          </h2>
        </div>

        <div className="flex justify-center gap-6 md:gap-8 px-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-32 w-52 md:h-36 md:w-60 rounded-2xl border border-neutral-200 bg-white animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (developers.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-neutral-50 overflow-hidden">
      <div className="mx-auto max-w-[1320px] px-4 md:px-6 mb-12 md:mb-16">
        <p className="text-center text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500 mb-3">
          Developers
        </p>
        <h2
          className="text-center text-3xl md:text-4xl lg:text-5xl text-neutral-900 font-normal tracking-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Our Trusted Partners
        </h2>
        <p className="text-center text-sm md:text-base text-neutral-500 mt-4 max-w-2xl mx-auto">
          Partnering with leading developers to bring exceptional properties and trusted opportunities.
        </p>
      </div>

      <div className="relative w-full max-w-[1320px] mx-auto px-4 md:px-6">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 md:p-3 border border-neutral-200 transition-all duration-300 hover:shadow-xl"
            aria-label="Scroll left"
          >
            <FiChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-neutral-700" />
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 md:p-3 border border-neutral-200 transition-all duration-300 hover:shadow-xl"
            aria-label="Scroll right"
          >
            <FiChevronRight className="w-5 h-5 md:w-6 md:h-6 text-neutral-700" />
          </button>
        )}

        {/* Gradient Fade - Left */}
        <div className="absolute left-0 top-0 h-full w-16 md:w-24 bg-gradient-to-r from-neutral-50 to-transparent z-10 pointer-events-none" />
        
        {/* Gradient Fade - Right */}
        <div className="absolute right-0 top-0 h-full w-16 md:w-24 bg-gradient-to-l from-neutral-50 to-transparent z-10 pointer-events-none" />

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 md:gap-8 overflow-x-auto scroll-smooth pb-4 hide-scrollbar"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {developers.map((dev) => {
            const logoUrl = getDeveloperLogo(dev);
            const slug = dev.slug || dev.seo_slug;

            return (
              <motion.div
                key={dev.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                onClick={() => navigateToDeveloper(slug)}
                className="group flex-shrink-0 cursor-pointer"
                whileHover={{ y: -4 }}
              >
                <div className="min-w-[200px] md:min-w-[240px] rounded-2xl border border-neutral-200 bg-white px-6 py-5 md:px-8 md:py-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-neutral-300">
                  <div className="h-20 md:h-24 w-full flex items-center justify-center">
                    <img
                      src={logoUrl}
                      alt={dev.name || "Developer"}
                      className="max-h-full max-w-full object-contain opacity-95 transition-all duration-500 ease-out group-hover:scale-105"
                      draggable={false}
                      onError={() => handleLogoError(dev.id)}
                      loading="lazy"
                    />
                  </div>

                  <p className="mt-4 text-center text-xs md:text-sm font-medium tracking-wide text-neutral-700 group-hover:text-neutral-900 transition-colors duration-300">
                    {dev.name}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}