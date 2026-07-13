"use client";

import { useState, useCallback } from "react";
import type { MouseEvent, KeyboardEvent } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineArrowRight } from "react-icons/hi2";
import { FiHeart, FiShare2, FiEye } from "react-icons/fi";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type Lifestyle = {
  id: number;
  title: string;
  slug: string;
  image: string;
  location: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  area: string;
  type: "Villa" | "Apartment" | "Penthouse" | "Townhouse";
  isFeatured?: boolean;
  isNew?: boolean;
};

const THEME = {
  primary: "#192334",
  accent: "#C8AA78",
  accentLight: "#E8D5B5",
  text: "#1a2233",
  textLight: "#6B7A8A",
};

const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const LIFESTYLE_DATA: Lifestyle[] = [
  {
    id: 1,
    title: "Ocean Pearl Villa",
    slug: "ocean-pearl-villa",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80",
    location: "Palm Jumeirah, Dubai",
    price: "AED 12,500,000",
    bedrooms: 5,
    bathrooms: 6,
    area: "8,500 sqft",
    type: "Villa",
    isFeatured: true,
  },
  {
    id: 2,
    title: "Downtown Sky Residences",
    slug: "downtown-sky-residences",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=80",
    location: "Downtown Dubai",
    price: "AED 8,200,000",
    bedrooms: 3,
    bathrooms: 4,
    area: "3,200 sqft",
    type: "Apartment",
    isNew: true,
  },
  {
    id: 3,
    title: "Canal View Penthouse",
    slug: "canal-view-penthouse",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80",
    location: "Business Bay, Dubai",
    price: "AED 15,800,000",
    bedrooms: 4,
    bathrooms: 5,
    area: "5,200 sqft",
    type: "Penthouse",
    isFeatured: true,
  },
  {
    id: 4,
    title: "Emirates Hills Estate",
    slug: "emirates-hills-estate",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
    location: "Emirates Hills, Dubai",
    price: "AED 22,500,000",
    bedrooms: 6,
    bathrooms: 7,
    area: "12,000 sqft",
    type: "Villa",
  },
  {
    id: 5,
    title: "Marina Heights Tower",
    slug: "marina-heights-tower",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1400&q=80",
    location: "Dubai Marina",
    price: "AED 6,750,000",
    bedrooms: 2,
    bathrooms: 3,
    area: "2,100 sqft",
    type: "Apartment",
    isNew: true,
  },
  {
    id: 6,
    title: "Al Barari Oasis",
    slug: "al-barari-oasis",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80",
    location: "Al Barari, Dubai",
    price: "AED 18,900,000",
    bedrooms: 5,
    bathrooms: 6,
    area: "9,800 sqft",
    type: "Townhouse",
  },
];

function LifestyleImage({ src, alt }: { src: string; alt: string }) {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const fallbackImage = `https://source.unsplash.com/1400x1050/?${encodeURIComponent(
    alt
  )},dubai,luxury,real-estate`;
  const finalSrc = imgError ? fallbackImage : src;

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-100">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
      )}
      <img
        src={finalSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className={`h-full w-full object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setImgError(true);
          setLoaded(true);
        }}
      />
    </div>
  );
}

function CardLoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-[3px]"
      style={{ background: "rgba(25, 35, 52, 0.75)" }}
    >
      <div className="relative h-14 w-14">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{ borderTopColor: THEME.accent, borderRightColor: THEME.accent }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-transparent"
          style={{
            borderBottomColor: "rgba(255,255,255,0.7)",
            borderLeftColor: "rgba(255,255,255,0.7)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <motion.p
        className="mt-4 text-[9px] uppercase text-white"
        style={{ fontFamily: FONT_BODY, letterSpacing: "0.3em", fontWeight: 500 }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        Opening
      </motion.p>
    </motion.div>
  );
}

function LifestyleCard({ item, index }: { item: Lifestyle; index: number }) {
  const [isOpening, setIsOpening] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const goToLifestyle = useCallback(() => {
    if (isOpening) return;
    setIsOpening(true);
    setTimeout(() => {
      window.location.href = `/lifestyle/${item.slug}`;
    }, 700);
  }, [isOpening, item.slug]);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    goToLifestyle();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") goToLifestyle();
  };

  const handleLike = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleShare = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    // Share functionality
    navigator.share?.({
      title: item.title,
      text: `Check out ${item.title} in ${item.location}`,
      url: window.location.href,
    });
  };

  const handleQuickView = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    goToLifestyle();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.25) }}
      className="group block cursor-pointer"
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-[12px] bg-gray-100 shadow-sm transition-shadow duration-300 hover:shadow-xl">
        <div style={{ aspectRatio: "4/3" }}>
          <LifestyleImage src={item.image} alt={item.title} />
        </div>

        <AnimatePresence>{isOpening && <CardLoadingOverlay />}</AnimatePresence>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {item.isFeatured && (
            <span className="rounded-full bg-[#C8AA78] px-3 py-1 text-[8px] font-semibold uppercase tracking-[0.15em] text-white shadow-lg">
              Featured
            </span>
          )}
          {item.isNew && (
            <span className="rounded-full bg-[#192334] px-3 py-1 text-[8px] font-semibold uppercase tracking-[0.15em] text-white shadow-lg">
              New
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1 : 0.8,
            }}
            transition={{ duration: 0.2, delay: 0.05 }}
            onClick={handleLike}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl"
          >
            <FiHeart
              className={`h-4 w-4 transition-colors ${
                isLiked ? "fill-[#C8AA78] text-[#C8AA78]" : "text-[#192334]"
              }`}
            />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1 : 0.8,
            }}
            transition={{ duration: 0.2, delay: 0.1 }}
            onClick={handleShare}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl"
          >
            <FiShare2 className="h-4 w-4 text-[#192334]" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1 : 0.8,
            }}
            transition={{ duration: 0.2, delay: 0.15 }}
            onClick={handleQuickView}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl"
          >
            <FiEye className="h-4 w-4 text-[#192334]" />
          </motion.button>
        </div>

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {/* Content */}
      <div className="mt-3.5 px-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-[#1a2233] transition-colors group-hover:text-[#C8AA78]">
              {item.title}
            </h3>
            <p className="mt-1 text-xs text-[#6B7A8A]">{item.location}</p>
          </div>
          <span className="text-sm font-semibold text-[#1a2233]">{item.price}</span>
        </div>

        <div className="mt-2.5 flex items-center gap-4 text-xs text-[#6B7A8A]">
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 12h8M12 8v8M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {item.bedrooms} Beds
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3v18M3 12h18M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {item.bathrooms} Baths
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M3 15h18" />
            </svg>
            {item.area}
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#C8AA78]">
            {item.type}
          </span>
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[#192334] transition-colors hover:text-[#C8AA78]"
          >
            View Details
            <HiOutlineArrowRight className="h-3 w-3" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function LifestyleSection() {
  const [lifestyles] = useState<Lifestyle[]>(LIFESTYLE_DATA);
  const [isNavigating, setIsNavigating] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);

  // ✅ UPDATED: Button text and URL changed
  const handleViewAllClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (isNavigating) return;
      setIsNavigating(true);
      setTimeout(() => {
        window.location.href = "/dubai-lifestyle-properties";
      }, 900);
    },
    [isNavigating]
  );

  return (
    <section className={`${inter.className} bg-white py-12 md:py-16 lg:py-20`}>
      <div className="mx-auto max-w-[1320px] px-6">
        <div className="mb-10 text-center md:mb-12">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#577C8E]"
          >
            Signature Lifestyle With Finest Residences
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className={`${playfair.className} text-[32px] font-medium leading-[1.1] text-[#1a2233] md:text-[44px]`}
          >
            Luxury Properties for Elite
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-3 max-w-2xl text-sm text-[#6B7A8A] md:text-base"
          >
            Discover our curated collection of exceptional properties designed
            for the discerning few
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {lifestyles.slice(0, 6).map((item, index) => (
            <LifestyleCard key={`${item.id}-${item.slug}`} item={item} index={index} />
          ))}
        </div>

        <div className="mt-12 flex justify-center md:mt-16">
          <motion.button
            onClick={handleViewAllClick}
            onMouseEnter={() => setButtonHover(true)}
            onMouseLeave={() => setButtonHover(false)}
            disabled={isNavigating}
            whileTap={{ scale: 0.97 }}
            className="group relative inline-flex items-center gap-3 overflow-hidden px-10 py-4 text-[10px] font-medium uppercase tracking-[0.22em] text-white transition-all disabled:cursor-wait"
            style={{
              backgroundColor: THEME.primary,
              fontFamily: FONT_BODY,
              boxShadow:
                buttonHover && !isNavigating
                  ? "0 12px 32px rgba(25,35,52,0.25)"
                  : "0 4px 12px rgba(25,35,52,0.1)",
              transform:
                buttonHover && !isNavigating ? "translateY(-2px)" : "translateY(0)",
              transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
              minWidth: "250px",
              justifyContent: "center",
            }}
          >
            <span
              className="absolute inset-0 origin-left"
              style={{
                background: `linear-gradient(90deg, ${THEME.accent} 0%, #D4B888 100%)`,
                transform:
                  buttonHover && !isNavigating ? "scaleX(1)" : "scaleX(0)",
                transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
            {isNavigating && (
              <motion.span
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(200,170,120,0.4), transparent)",
                }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              />
            )}
            <span
              className="relative z-10 transition-colors"
              style={{
                color: buttonHover && !isNavigating ? THEME.primary : "#fff",
              }}
            >
              {/* ✅ UPDATED: "View All Properties" → "View All Lifestyle" */}
              {isNavigating ? "Loading Lifestyles" : "View All Lifestyle"}
            </span>
            <span
              className="relative z-10 flex items-center"
              style={{
                color: buttonHover && !isNavigating ? THEME.primary : "#fff",
              }}
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
        </div>
      </div>
    </section>
  );
}