"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiX, FiImage } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

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
  fullGallery: ProjectImage[];
};

// API Response Types
type ApiPropertyImage = {
  id: number;
  url: string;
  title: string;
  description: string | null;
  featured: number;
};

type ApiProperty = {
  id: number;
  name: string;
  slug: string;
  listing_type: string;
  featured: boolean;
  featured_image: string;
  images: ApiPropertyImage[];
  gallery_urls: string[];
  gallery_preview: string[];
  video_url: string | null;
  developer: {
    id: number;
    name: string;
    logo_url: string;
  } | null;
  location: {
    community: string | null;
    city: string;
  };
  price: {
    display: string;
    amount: number | null;
  };
  bedrooms: string;
  bathrooms: string;
  area: {
    display: string;
    value: number | null;
  };
};

type ApiResponse = {
  success: boolean;
  data: ApiProperty[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const THEME = {
  primary: "#192334",
  accent: "#C8AA78",
};

const API_URL = "http://localhost:5173/api/v1/properties";
const SLIDE_DURATION = 6500;
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=900&fit=crop&q=85";

// ─── IMAGE COMPONENT ────────────────────────────────────────────────────

function ImageWithFallback({
  src,
  alt,
  className = "",
  onClick,
  isClickable = false,
}: {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  isClickable?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setLoaded(false);
    setImgSrc(src);
  }, [src]);

  return (
    <div 
      className={`relative h-full w-full overflow-hidden bg-[#101827] ${
        isClickable ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
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

// ─── GOLDEN BUTTON ─────────────────────────────────────────────────────

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
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isProcessing?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const isSolid = variant === "solid";

  return (
    <motion.button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isProcessing) return;
        onClick(e);
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

// ─── PHOTO GALLERY POPUP ──────────────────────────────────────────────

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

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(startIndex);
      setImgLoading(true);
    }
  }, [isOpen, startIndex]);

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
          onClick={onClose}
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
              <span className="text-[11px] font-medium tracking-widest text-white/70">
                {String(currentIndex + 1).padStart(2, "0")} /{" "}
                {String(images.length).padStart(2, "0")}
              </span>

              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
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
          <div 
            className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-6 md:px-16"
            onClick={(e) => e.stopPropagation()}
          >
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

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 backdrop-blur-sm">
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-white">
                {images[currentIndex]?.label}
              </p>
            </div>

            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              whileTap={{ scale: 0.9 }}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center border border-white/25 bg-black/40 text-white backdrop-blur-sm transition-all hover:border-[#C8AA78] hover:bg-[#C8AA78] hover:text-[#192334] md:h-14 md:w-14"
              aria-label="Previous image"
            >
              <FiArrowLeft size={20} />
            </motion.button>

            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
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

// ─── LOADING COMPONENT ─────────────────────────────────────────────────

function LoadingState() {
  return (
    <section className="bg-white py-10 md:py-16">
      <div className="mx-auto max-w-[1320px] px-4 md:px-6">
        <div
          className="relative overflow-hidden bg-[#101827]"
          style={{
            minHeight: "420px",
            height: "min(72vw, 620px)",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-16 w-16">
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-transparent"
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
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── ERROR COMPONENT ───────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <section className="bg-white py-10 md:py-16">
      <div className="mx-auto max-w-[1320px] px-4 md:px-6">
        <div
          className="relative overflow-hidden bg-[#101827]"
          style={{
            minHeight: "420px",
            height: "min(72vw, 620px)",
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <p className="text-lg font-medium text-[#C8AA78]">{message}</p>
            <p className="mt-2 text-sm text-white/60">
              Please check back later for updates
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────

export default function FeaturedProjectSection() {
  const router = useRouter();

  // ─── ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS ──────

  const [projects, setProjects] = useState<FeaturedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── FETCH PROPERTIES FROM API ──────────────────────────────────────

  useEffect(() => {
    async function fetchFeaturedProperties() {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}?limit=50`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: ApiResponse = await response.json();

        if (!result.success) {
          throw new Error("API returned unsuccessful response");
        }

        console.log("Total properties from API:", result.data.length);

        // 🔥 MORE FLEXIBLE FILTERING - Get ANY properties that have images
        const validProperties = result.data.filter((property) => {
          // Check if name is valid (not "Null" or empty)
          const hasValidName = 
            property.name && 
            property.name.trim() !== "" && 
            property.name.toLowerCase() !== "null";

          // Check if has featured image OR any images
          const hasFeaturedImage = 
            property.featured_image && 
            property.featured_image.length > 0;

          // Check if has any gallery images
          const hasGalleryImages = 
            property.gallery_urls && 
            property.gallery_urls.length > 0;

          // Check if has images array with at least one image
          const hasImages = 
            property.images && 
            property.images.length > 0;

          // 🔥 LESS STRICT - Don't require featured flag, just require images
          return hasValidName && (hasFeaturedImage || hasGalleryImages || hasImages);
        });

        console.log("Valid properties after filtering:", validProperties.length);

        if (validProperties.length === 0) {
          // If no valid properties found, try with even less strict filtering
          const fallbackProperties = result.data.filter((property) => {
            return property.gallery_urls && property.gallery_urls.length > 0;
          });
          
          console.log("Fallback properties (any with gallery):", fallbackProperties.length);
          
          if (fallbackProperties.length === 0) {
            setError("No properties with images found in the API");
            setProjects([]);
            setLoading(false);
            return;
          }
          
          // Use fallback
          const topThree = fallbackProperties.slice(0, 3);
          const transformed = transformProperties(topThree);
          setProjects(transformed);
          setError(null);
          setLoading(false);
          return;
        }

        // Take first 3 valid properties
        const topThree = validProperties.slice(0, 3);
        const transformed = transformProperties(topThree);
        setProjects(transformed);
        setError(null);
      } catch (err) {
        console.error("Error fetching featured properties:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load properties"
        );
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }

    // Helper function to transform properties
    function transformProperties(properties: ApiProperty[]): FeaturedProject[] {
      return properties.map((property) => {
        // Get all gallery images from various sources
        let allImages: string[] = [];
        
        // Priority: gallery_urls > images array > featured_image
        if (property.gallery_urls && property.gallery_urls.length > 0) {
          allImages = property.gallery_urls;
        } else if (property.images && property.images.length > 0) {
          allImages = property.images.map(img => img.url);
        } else if (property.featured_image) {
          allImages = [property.featured_image];
        }

        // If no images at all, use fallback
        if (allImages.length === 0) {
          allImages = [FALLBACK_IMG];
        }

        // Create ProjectImage array
        const galleryImages: ProjectImage[] = allImages.map((url, index) => ({
          src: url,
          label: `${property.name || "Property"} - Image ${index + 1}`,
        }));

        // First 2 images for thumbnails
        const thumbnailImages = galleryImages.slice(0, 2);

        // Featured image (use first image if no featured_image)
        const featuredImage = property.featured_image || allImages[0] || FALLBACK_IMG;

        return {
          id: property.id,
          eyebrow: property.listing_type || "FEATURED PROJECT",
          title: property.name || "Property",
          slug: property.slug || `property-${property.id}`,
          image: featuredImage,
          images: thumbnailImages,
          fullGallery: galleryImages,
        };
      });
    }

    fetchFeaturedProperties();
  }, []);

  // ─── AUTO-SLIDE ──────────────────────────────────────────────────────

  const next = useCallback(() => {
    if (projects.length === 0) return;
    setActive((prev) => (prev + 1) % projects.length);
  }, [projects.length]);

  const prev = useCallback(() => {
    if (projects.length === 0) return;
    setActive((prev) => (prev - 1 + projects.length) % projects.length);
  }, [projects.length]);

  useEffect(() => {
    if (projects.length === 0) return;
    if (isHovered || galleryOpen) return;

    timerRef.current = setTimeout(() => {
      next();
    }, SLIDE_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, isHovered, galleryOpen, next, projects.length]);

  // ─── DEFINE currentProject BEFORE useCallback THAT USE IT ──────────

  const currentProject = projects[active] || projects[0] || null;

  // ─── NAVIGATION HANDLERS ────────────────────────────────────────────

  // Navigate to individual property page (slug page)
  const navigateToProperty = useCallback((slug: string) => {
    router.push(`/featured-explore-properties/${slug}`);
  }, [router]);

  // Navigate to featured-explore-properties page
  const navigateToFeaturedExplore = useCallback(() => {
    router.push('/featured-explore-properties');
  }, [router]);

  const handleDiscoverMore = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (discoverLoading || !currentProject) return;
    setDiscoverLoading(true);

    setTimeout(() => {
      navigateToFeaturedExplore();
      setDiscoverLoading(false);
    }, 500);
  }, [discoverLoading, currentProject, navigateToFeaturedExplore]);

  const handleImageClick = useCallback((slug: string) => {
    navigateToProperty(slug);
  }, [navigateToProperty]);

  const handleViewAllPhotos = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, startIdx: number = 0) => {
      e.stopPropagation();
      if (photosLoading || projects.length === 0) return;
      setPhotosLoading(true);

      setTimeout(() => {
        setGalleryStartIndex(startIdx);
        setGalleryOpen(true);
        setPhotosLoading(false);
      }, 500);
    },
    [photosLoading, projects.length]
  );

  // ─── useMemo HOOKS ───────────────────────────────────────────────────

  const thumbnails = useMemo(() => {
    if (!currentProject) return [];
    return currentProject.images.slice(0, 2);
  }, [currentProject]);

  const allGalleryImages = useMemo(() => {
    if (!currentProject) return [];
    const combined = [
      { src: currentProject.image, label: currentProject.title.toUpperCase() },
      ...currentProject.images,
      ...currentProject.fullGallery,
    ];

    const seen = new Set<string>();
    return combined.filter((img) => {
      if (seen.has(img.src)) return false;
      seen.add(img.src);
      return true;
    });
  }, [currentProject]);

  // ─── CONDITIONAL RETURNS ────────────────────────────────────────────

  if (loading) {
    return <LoadingState />;
  }

  if (error || projects.length === 0 || !currentProject) {
    return <ErrorState message={error || "No featured properties available"} />;
  }

  // ─── RENDER CONTENT ──────────────────────────────────────────────────

  const project = currentProject;

  return (
    <>
      <section className="bg-white py-10 md:py-16">
        <div className="mx-auto max-w-[1320px] px-4 md:px-6">
          {/* MAIN BANNER CONTAINER - FULL CLICKABLE */}
          <div
            className="relative overflow-hidden bg-[#101827] cursor-pointer"
            style={{
              minHeight: "420px",
              height: "min(72vw, 620px)",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => handleImageClick(project.slug)}
          >
            {/* Background Image */}
            <ImageWithFallback
              key={project.id}
              src={project.image}
              alt={project.title}
              className="absolute inset-0 transition-transform duration-700 hover:scale-105"
              isClickable={false}
            />

            {/* Dark overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />

            {/* Top decorative line */}
            <div className="absolute left-6 right-6 top-10 hidden h-px bg-gradient-to-r from-white/15 via-white/45 to-white/15 md:block" />

            {/* Arrows - with stopPropagation */}
            <div className="absolute right-6 top-8 z-20 flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous project"
                className="flex h-10 w-12 items-center justify-center border border-white/35 text-white/80 transition-all hover:border-[#C8AA78] hover:bg-[#C8AA78] hover:text-[#192334]"
              >
                <FiArrowLeft size={15} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next project"
                className="-ml-px flex h-10 w-12 items-center justify-center border border-white/35 text-white/80 transition-all hover:border-[#C8AA78] hover:bg-[#C8AA78] hover:text-[#192334]"
              >
                <FiArrowRight size={15} />
              </button>
            </div>

            {/* Content - with stopPropagation on buttons */}
            <div className="absolute bottom-8 left-6 z-20 max-w-[520px] md:bottom-16 md:left-16">
              <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.24em] text-white/60">
                {project.eyebrow}
              </p>

              <h2
                className="text-[28px] leading-tight text-white md:text-[38px] cursor-pointer hover:text-[#C8AA78] transition-colors"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  textShadow: "0 3px 18px rgba(0,0,0,0.45)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageClick(project.slug);
                }}
              >
                {project.title}
              </h2>

              <div className="mt-8 flex flex-wrap items-center gap-2">
                <GoldenProjectButton
                  loadingText="Loading..."
                  variant="solid"
                  onClick={handleDiscoverMore}
                  isProcessing={discoverLoading}
                >
                  Discover More
                </GoldenProjectButton>

                <GoldenProjectButton
                  loadingText="Loading..."
                  variant="outline"
                  onClick={(e) => handleViewAllPhotos(e, 0)}
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
                  onClick={(e) => handleViewAllPhotos(e, thumbIdx + 1)}
                  whileHover={{ y: -3 }}
                  className="group/thumb block w-[150px] cursor-pointer"
                >
                  <div className="relative h-[105px] overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={img.src}
                      alt={img.label}
                      className="transition-transform duration-500 group-hover/thumb:scale-105"
                    />
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
              {projects.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActive(idx);
                  }}
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

      {/* Photo Gallery Popup */}
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