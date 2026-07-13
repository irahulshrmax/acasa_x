"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiX, FiImage } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

type ProjectImage = {
  src: string;
  label: string;
};

type FeaturedProject = {
  id: number;
  eyebrow: string;
  title: string;
  slug: string;
  image: string;
  images: ProjectImage[];
  fullGallery: ProjectImage[]; // 🔥 Extended gallery for popup
};

const THEME = {
  primary: "#192334",
  accent: "#C8AA78",
};

// 🔥 EXTERNAL FALLBACK URL - agar internal page na ho toh
const EXTERNAL_BASE_URL = "https://www.acasa.ae/properties";

const PROJECTS: FeaturedProject[] = [
  {
    id: 1,
    eyebrow: "FEATURED PROJECT",
    title: "The Rings, Jumeirah 2",
    slug: "the-rings-jumeirah-2",
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&h=900&fit=crop&q=85",
    images: [
      {
        src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=500&h=360&fit=crop&q=80",
        label: "LIVING ROOM",
      },
      {
        src: "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=500&h=360&fit=crop&q=80",
        label: "AMENITIES AREA",
      },
    ],
    fullGallery: [
      {
        src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&h=1000&fit=crop&q=85",
        label: "EXTERIOR VIEW",
      },
      {
        src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&h=1000&fit=crop&q=85",
        label: "LIVING ROOM",
      },
      {
        src: "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=1600&h=1000&fit=crop&q=85",
        label: "AMENITIES AREA",
      },
      {
        src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=1000&fit=crop&q=85",
        label: "MASTER BEDROOM",
      },
      {
        src: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1600&h=1000&fit=crop&q=85",
        label: "KITCHEN",
      },
      {
        src: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1600&h=1000&fit=crop&q=85",
        label: "BATHROOM",
      },
      {
        src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&h=1000&fit=crop&q=85",
        label: "TERRACE",
      },
      {
        src: "https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=1600&h=1000&fit=crop&q=85",
        label: "POOL",
      },
    ],
  },
  {
    id: 2,
    eyebrow: "FEATURED PROJECT",
    title: "Palm Jumeirah Residences",
    slug: "palm-jumeirah-residences",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600&h=900&fit=crop&q=85",
    images: [
      {
        src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&h=360&fit=crop&q=80",
        label: "INTERIOR",
      },
      {
        src: "https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=500&h=360&fit=crop&q=80",
        label: "POOL AREA",
      },
    ],
    fullGallery: [
      {
        src: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600&h=1000&fit=crop&q=85",
        label: "FRONT VIEW",
      },
      {
        src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&h=1000&fit=crop&q=85",
        label: "INTERIOR",
      },
      {
        src: "https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=1600&h=1000&fit=crop&q=85",
        label: "POOL AREA",
      },
      {
        src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&h=1000&fit=crop&q=85",
        label: "LIVING SPACE",
      },
      {
        src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=1000&fit=crop&q=85",
        label: "BEDROOM",
      },
      {
        src: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1600&h=1000&fit=crop&q=85",
        label: "OCEAN VIEW",
      },
    ],
  },
  {
    id: 3,
    eyebrow: "FEATURED PROJECT",
    title: "Dubai Hills Mansion",
    slug: "dubai-hills-mansion",
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1600&h=900&fit=crop&q=85",
    images: [
      {
        src: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=500&h=360&fit=crop&q=80",
        label: "LOUNGE",
      },
      {
        src: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=500&h=360&fit=crop&q=80",
        label: "ENTRANCE",
      },
    ],
    fullGallery: [
      {
        src: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1600&h=1000&fit=crop&q=85",
        label: "EXTERIOR",
      },
      {
        src: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1600&h=1000&fit=crop&q=85",
        label: "LOUNGE",
      },
      {
        src: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=1600&h=1000&fit=crop&q=85",
        label: "ENTRANCE",
      },
      {
        src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=1000&fit=crop&q=85",
        label: "BEDROOM",
      },
      {
        src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&h=1000&fit=crop&q=85",
        label: "DINING AREA",
      },
      {
        src: "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=1600&h=1000&fit=crop&q=85",
        label: "GARDEN",
      },
    ],
  },
];

const SLIDE_DURATION = 6500;
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=900&fit=crop&q=85";

// ─── IMAGE COMPONENT ────────────────────────────────────────────────────

function ImageWithFallback({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setLoaded(false);
    setImgSrc(src);
  }, [src]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#101827]">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-800 to-slate-900" />
      )}

      <img
        src={imgSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className={`h-full w-full object-cover transition-opacity duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setImgSrc(FALLBACK_IMG);
          setLoaded(true);
        }}
      />
    </div>
  );
}

// ─── BUTTON SPINNER ─────────────────────────────────────────────────────

function ButtonSpinner() {
  return (
    <motion.svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{
        duration: 0.9,
        repeat: Infinity,
        ease: "linear",
      }}
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
  );
}

// ─── GOLDEN BUTTON (UPDATED WITH onClick) ───────────────────────────────

function GoldenProjectButton({
  children,
  loadingText,
  variant = "outline",
  onClick,
  isProcessing = false,
}: {
  children: string;
  loadingText: string;
  variant?: "outline" | "solid";
  onClick: () => void;
  isProcessing?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const isSolid = variant === "solid";

  return (
    <motion.button
      onClick={(e) => {
        e.preventDefault();
        if (isProcessing) return;
        onClick();
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      whileTap={{ scale: 0.97 }}
      disabled={isProcessing}
      className="relative inline-flex min-w-[132px] cursor-pointer items-center justify-center gap-2 overflow-hidden px-5 py-3 text-[9px] font-medium uppercase tracking-[0.18em] transition-all disabled:cursor-wait"
      style={{
        color: hover && !isProcessing ? THEME.primary : "#fff",
        border: `1px solid ${
          isSolid ? "rgba(200,170,120,0.65)" : "rgba(255,255,255,0.45)"
        }`,
        backgroundColor: isSolid ? "rgba(25,35,52,0.75)" : "transparent",
        boxShadow:
          hover && !isProcessing
            ? "0 12px 30px rgba(200,170,120,0.22)"
            : "0 4px 18px rgba(0,0,0,0.16)",
        transform: hover && !isProcessing ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      <span
        className="absolute inset-0 origin-left"
        style={{
          background: `linear-gradient(90deg, ${THEME.accent} 0%, #D4B888 100%)`,
          transform: hover && !isProcessing ? "scaleX(1)" : "scaleX(0)",
          transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
        }}
      />

      {isProcessing && (
        <motion.span
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(200,170,120,0.4), transparent)",
          }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}

      <span className="relative z-10">
        {isProcessing ? loadingText : children}
      </span>

      <span className="relative z-10 inline-flex items-center">
        {isProcessing ? (
          <ButtonSpinner />
        ) : (
          <motion.span
            animate={hover ? { x: 4 } : { x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children === "View All Photos" ? <FiImage size={13} /> : "→"}
          </motion.span>
        )}
      </span>
    </motion.button>
  );
}

// ─── 🔥 PHOTO GALLERY POPUP (Premium Full-Screen) ───────────────────────

function PhotoGalleryPopup({
  isOpen,
  onClose,
  images,
  projectTitle,
  startIndex = 0,
}: {
  isOpen: boolean;
  onClose: () => void;
  images: ProjectImage[];
  projectTitle: string;
  startIndex?: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [imgLoading, setImgLoading] = useState(true);

  // Reset to startIndex when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(startIndex);
      setImgLoading(true);
    }
  }, [isOpen, startIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")
        setCurrentIndex((p) => (p - 1 + images.length) % images.length);
      if (e.key === "ArrowRight")
        setCurrentIndex((p) => (p + 1) % images.length);
    };

    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, images.length, onClose]);

  const handleNext = useCallback(() => {
    setImgLoading(true);
    setCurrentIndex((p) => (p + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setImgLoading(true);
    setCurrentIndex((p) => (p - 1 + images.length) % images.length);
  }, [images.length]);

  const handleThumbClick = useCallback((idx: number) => {
    setImgLoading(true);
    setCurrentIndex(idx);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[999] flex flex-col bg-black/97 backdrop-blur-md"
        >
          {/* HEADER BAR */}
          <div className="flex items-center justify-between border-b border-white/10 bg-black/50 px-4 py-4 md:px-8 md:py-5">
            <div className="flex flex-col">
              <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-[#C8AA78]">
                Photo Gallery
              </p>
              <h3
                className="mt-0.5 text-[15px] text-white md:text-[18px]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {projectTitle}
              </h3>
            </div>

            <div className="flex items-center gap-4">
              {/* Counter */}
              <span className="text-[11px] font-medium tracking-widest text-white/70">
                {String(currentIndex + 1).padStart(2, "0")} /{" "}
                {String(images.length).padStart(2, "0")}
              </span>

              {/* Close */}
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.9 }}
                whileHover={{ rotate: 90 }}
                className="flex h-10 w-10 items-center justify-center border border-white/25 text-white transition-colors hover:border-[#C8AA78] hover:bg-[#C8AA78] hover:text-[#192334]"
                aria-label="Close gallery"
              >
                <FiX size={18} />
              </motion.button>
            </div>
          </div>

          {/* MAIN IMAGE AREA */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-6 md:px-16">
            {/* Loader overlay */}
            <AnimatePresence>
              {imgLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-center justify-center"
                >
                  <div className="relative h-16 w-16">
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-transparent"
                      style={{
                        borderTopColor: THEME.accent,
                        borderRightColor: THEME.accent,
                      }}
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image */}
            <motion.img
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: imgLoading ? 0.3 : 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              src={images[currentIndex]?.src}
              alt={images[currentIndex]?.label}
              onLoad={() => setImgLoading(false)}
              onError={() => setImgLoading(false)}
              className="max-h-full max-w-full object-contain shadow-2xl"
              style={{ maxHeight: "calc(100vh - 260px)" }}
            />

            {/* Image label */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 backdrop-blur-sm">
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-white">
                {images[currentIndex]?.label}
              </p>
            </div>

            {/* Prev button */}
            <motion.button
              onClick={handlePrev}
              whileTap={{ scale: 0.9 }}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center border border-white/25 bg-black/40 text-white backdrop-blur-sm transition-all hover:border-[#C8AA78] hover:bg-[#C8AA78] hover:text-[#192334] md:h-14 md:w-14"
              aria-label="Previous image"
            >
              <FiArrowLeft size={20} />
            </motion.button>

            {/* Next button */}
            <motion.button
              onClick={handleNext}
              whileTap={{ scale: 0.9 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center border border-white/25 bg-black/40 text-white backdrop-blur-sm transition-all hover:border-[#C8AA78] hover:bg-[#C8AA78] hover:text-[#192334] md:h-14 md:w-14"
              aria-label="Next image"
            >
              <FiArrowRight size={20} />
            </motion.button>
          </div>

          {/* THUMBNAIL STRIP */}
          <div className="border-t border-white/10 bg-black/50 px-4 py-4 md:px-8">
            <div className="scrollbar-hide flex gap-2 overflow-x-auto md:gap-3">
              {images.map((img, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleThumbClick(idx)}
                  whileHover={{ y: -3 }}
                  className={`relative shrink-0 overflow-hidden border-2 transition-all ${
                    idx === currentIndex
                      ? "border-[#C8AA78] opacity-100"
                      : "border-transparent opacity-50 hover:opacity-90"
                  }`}
                  style={{ width: "82px", height: "58px" }}
                >
                  <img
                    src={img.src}
                    alt={img.label}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMG;
                    }}
                  />
                  {idx === currentIndex && (
                    <div className="absolute inset-0 border-2 border-[#C8AA78]" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Bottom instruction bar */}
          <div className="hidden border-t border-white/10 bg-black/70 px-8 py-2 md:block">
            <p className="text-center text-[9px] tracking-[0.24em] text-white/40">
              USE ARROW KEYS TO NAVIGATE • PRESS ESC TO CLOSE
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────

export default function FeaturedProjectSection() {
  const [active, setActive] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const project = PROJECTS[active];

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % PROJECTS.length);
  }, []);

  const prev = useCallback(() => {
    setActive((prev) => (prev - 1 + PROJECTS.length) % PROJECTS.length);
  }, []);

  useEffect(() => {
    if (isHovered || galleryOpen) return;

    timerRef.current = setTimeout(() => {
      next();
    }, SLIDE_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, isHovered, galleryOpen, next]);

  // 🔥 DISCOVER MORE HANDLER — ✅ Updated to /new-projects-in-dubai
  const handleDiscoverMore = useCallback(() => {
    if (discoverLoading) return;
    setDiscoverLoading(true);

    setTimeout(() => {
      // ✅ Updated: Changed from /buy-properties to /new-projects-in-dubai
      window.location.href = "/new-projects-in-dubai";
    }, 900);
  }, [discoverLoading]);

  // 🔥 VIEW ALL PHOTOS HANDLER — Open Gallery Popup
  const handleViewAllPhotos = useCallback(
    (startIdx: number = 0) => {
      if (photosLoading) return;
      setPhotosLoading(true);

      // Small delay for loader UX
      setTimeout(() => {
        setGalleryStartIndex(startIdx);
        setGalleryOpen(true);
        setPhotosLoading(false);
      }, 500);
    },
    [photosLoading]
  );

  const thumbnails = useMemo(() => project.images.slice(0, 2), [project]);

  // Get all images for gallery
  const allGalleryImages = useMemo(() => {
    // Combine main + thumbnails + full gallery, remove duplicates
    const combined = [
      { src: project.image, label: project.title.toUpperCase() },
      ...project.images,
      ...project.fullGallery,
    ];

    const seen = new Set<string>();
    return combined.filter((img) => {
      if (seen.has(img.src)) return false;
      seen.add(img.src);
      return true;
    });
  }, [project]);

  return (
    <>
      <section className="bg-white py-10 md:py-16">
        <div className="mx-auto max-w-[1320px] px-4 md:px-6">
          <div
            className="relative overflow-hidden bg-[#101827]"
            style={{
              minHeight: "420px",
              height: "min(72vw, 620px)",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Background */}
            <ImageWithFallback
              key={project.id}
              src={project.image}
              alt={project.title}
              className="absolute inset-0"
            />

            {/* Dark overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />

            {/* Top decorative line */}
            <div className="absolute left-6 right-6 top-10 hidden h-px bg-gradient-to-r from-white/15 via-white/45 to-white/15 md:block" />

            {/* Arrows */}
            <div className="absolute right-6 top-8 z-20 flex items-center">
              <button
                onClick={prev}
                aria-label="Previous project"
                className="flex h-10 w-12 items-center justify-center border border-white/35 text-white/80 transition-all hover:border-[#C8AA78] hover:bg-[#C8AA78] hover:text-[#192334]"
              >
                <FiArrowLeft size={15} />
              </button>
              <button
                onClick={next}
                aria-label="Next project"
                className="-ml-px flex h-10 w-12 items-center justify-center border border-white/35 text-white/80 transition-all hover:border-[#C8AA78] hover:bg-[#C8AA78] hover:text-[#192334]"
              >
                <FiArrowRight size={15} />
              </button>
            </div>

            {/* Content */}
            <div className="absolute bottom-8 left-6 z-20 max-w-[520px] md:bottom-16 md:left-16">
              <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.24em] text-white/60">
                {project.eyebrow}
              </p>

              <h2
                className="text-[28px] leading-tight text-white md:text-[38px]"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  textShadow: "0 3px 18px rgba(0,0,0,0.45)",
                }}
              >
                {project.title}
              </h2>

              <div className="mt-8 flex flex-wrap items-center gap-2">
                <GoldenProjectButton
                  loadingText="Opening"
                  variant="solid"
                  onClick={handleDiscoverMore}
                  isProcessing={discoverLoading}
                >
                  Discover More
                </GoldenProjectButton>

                <GoldenProjectButton
                  loadingText="Loading"
                  variant="outline"
                  onClick={() => handleViewAllPhotos(0)}
                  isProcessing={photosLoading}
                >
                  View All Photos
                </GoldenProjectButton>
              </div>
            </div>

            {/* Thumbnails desktop — clickable to open gallery */}
            <div className="absolute bottom-10 right-10 z-20 hidden bg-white p-2 shadow-2xl md:flex">
              {thumbnails.map((img, thumbIdx) => (
                <motion.button
                  key={img.label}
                  onClick={() => handleViewAllPhotos(thumbIdx + 1)}
                  whileHover={{ y: -3 }}
                  className="group/thumb block w-[150px] cursor-pointer"
                >
                  <div className="relative h-[105px] overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={img.src}
                      alt={img.label}
                      className="transition-transform duration-500 group-hover/thumb:scale-105"
                    />
                    {/* Hover overlay with icon */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover/thumb:bg-black/40 group-hover/thumb:opacity-100">
                      <FiImage size={22} className="text-white" />
                    </div>
                  </div>
                  <p className="mt-2 px-1 text-left text-[8px] font-medium uppercase tracking-[0.14em] text-[#192334]">
                    {img.label}
                  </p>
                </motion.button>
              ))}
            </div>

            {/* Dots mobile */}
            <div className="absolute bottom-4 right-5 z-20 flex items-center gap-2 md:hidden">
              {PROJECTS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActive(idx)}
                  aria-label={`Go to project ${idx + 1}`}
                  className="h-[3px] rounded-full transition-all"
                  style={{
                    width: idx === active ? 26 : 7,
                    background:
                      idx === active ? "#C8AA78" : "rgba(255,255,255,0.35)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 🔥 PHOTO GALLERY POPUP */}
      <PhotoGalleryPopup
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        images={allGalleryImages}
        projectTitle={project.title}
        startIndex={galleryStartIndex}
      />
    </>
  );
}