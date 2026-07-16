"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiX, FiImage } from "react-icons/fi";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

type ProjectImage = { src: string; label: string };
type FeaturedProject = {
  id: number;
  eyebrow: string;
  title: string;
  slug: string;
  image: string;
  images: ProjectImage[];
  fullGallery: ProjectImage[];
};

type ApiProperty = {
  id: number;
  name: string;
  slug: string;
  featured_image: string;
  images: { url: string; width?: number; height?: number; size?: number }[];
  gallery_urls: string[];
};

type ApiResponse = {
  success: boolean;
  data: ApiProperty[];
};

const SLIDE_DURATION = 6500;

function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (
    trimmed === "" ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined"
  ) {
    return false;
  }
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

function isHighQualityImageUrl(url: string): boolean {
  if (!isValidImageUrl(url)) return false;
  const lower = url.toLowerCase();

  const lowQualityPatterns = [
    "thumb",
    "thumbnail",
    "-small",
    "_small",
    "-mini",
    "_mini",
    "-tiny",
    "_tiny",
    "-low",
    "_low",
    "placeholder",
    "blurred",
    "preview",
    "icon",
    "150x",
    "100x",
    "200x",
    "300x",
  ];
  if (lowQualityPatterns.some((p) => lower.includes(p))) return false;

  if (lower.endsWith(".svg") || lower.endsWith(".gif")) return false;

  return true;
}

function upgradeImageQuality(url: string): string {
  if (!url) return url;

  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    if (/\/upload\/[a-z0-9_,]*q_/i.test(url)) return url;
    return url.replace("/upload/", "/upload/q_auto:best,f_auto,w_1920/");
  }

  if (url.includes("ik.imagekit.io")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}tr=q-90,w-1920`;
  }

  try {
    const u = new URL(url);
    if (u.searchParams.has("w")) u.searchParams.set("w", "1920");
    if (u.searchParams.has("width")) u.searchParams.set("width", "1920");
    if (u.searchParams.has("q")) u.searchParams.set("q", "90");
    if (u.searchParams.has("quality")) u.searchParams.set("quality", "90");
    return u.toString();
  } catch {
    return url;
  }
}

function scoreImage(img: {
  url: string;
  width?: number;
  height?: number;
  size?: number;
}): number {
  let score = 0;
  if (img.width) score += img.width;
  if (img.height) score += img.height;
  if (img.size) score += img.size / 1000;
  return score;
}

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
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0A0F1A]">
      {!loaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-800/50 to-slate-900/50" />
      )}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`h-full w-full object-cover transition-opacity duration-700 ${
            loaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          onLoad={() => setLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}

function ButtonSpinner() {
  return (
    <motion.svg
      width="13"
      height="13"
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
  );
}

function FigmaButton({
  children,
  onClick,
  isProcessing = false,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  isProcessing?: boolean;
}) {
  const [hover, setHover] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      whileTap={{ scale: 0.97 }}
      disabled={isProcessing}
      className="relative inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden px-5 py-2.5 text-[9px] font-medium uppercase tracking-[0.2em] transition-all disabled:cursor-wait md:px-6 md:py-3 md:text-[10px]"
      style={{
        color: "#FFFFFF",
        border: "1px solid rgba(255,255,255,0.3)",
        backgroundColor: "transparent",
      }}
    >
      <span
        className="absolute inset-0 origin-left"
        style={{
          background: "#FFFFFF",
          transform: hover && !isProcessing ? "scaleX(1)" : "scaleX(0)",
          transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
      <span
        className="relative z-10"
        style={{ color: hover && !isProcessing ? "#0F172A" : "#FFFFFF" }}
      >
        {children}
      </span>
      {isProcessing && (
        <span
          className="relative z-10 inline-flex items-center"
          style={{ color: hover ? "#0F172A" : "#FFFFFF" }}
        >
          <ButtonSpinner />
        </span>
      )}
    </motion.button>
  );
}

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
        setCurrentIndex((p: number) => (p - 1 + images.length) % images.length);
      if (e.key === "ArrowRight")
        setCurrentIndex((p: number) => (p + 1) % images.length);
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, images.length, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col bg-black/98 backdrop-blur-lg"
      onClick={onClose}
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-black/80 px-3 py-3 md:px-8 md:py-5">
        <div className="flex flex-col">
          <p className="text-[8px] font-medium uppercase tracking-[0.24em] text-white/60 md:text-[9px]">
            Photo Gallery
          </p>
          <h3
            className="mt-0.5 text-[14px] text-white md:text-[18px]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {projectTitle}
          </h3>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <span className="text-[10px] font-medium tracking-widest text-white/60 md:text-[11px]">
            {String(currentIndex + 1).padStart(2, "0")} /{" "}
            {String(images.length).padStart(2, "0")}
          </span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center border border-white/20 text-white hover:border-white hover:bg-white hover:text-[#0F172A] md:h-10 md:w-10"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-2 py-4 md:px-16 md:py-6"
        onClick={(e) => e.stopPropagation()}
      >
        {imgLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="relative h-12 w-12 md:h-16 md:w-16">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-transparent"
                style={{
                  borderTopColor: "#FFFFFF",
                  borderRightColor: "#FFFFFF",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>
        )}
        <img
          key={currentIndex}
          src={images[currentIndex]?.src}
          alt={images[currentIndex]?.label}
          onLoad={() => setImgLoading(false)}
          onError={() => setImgLoading(false)}
          className="max-h-full max-w-full object-contain shadow-2xl"
          style={{
            maxHeight: "calc(100vh - 200px)",
            opacity: imgLoading ? 0.3 : 1,
          }}
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-1.5 backdrop-blur-sm md:bottom-6 md:px-4 md:py-2">
          <p className="text-[8px] font-medium uppercase tracking-[0.24em] text-white md:text-[10px]">
            {images[currentIndex]?.label}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex(
              (p: number) => (p - 1 + images.length) % images.length
            );
            setImgLoading(true);
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center border border-white/20 bg-black/60 text-white hover:border-white hover:bg-white hover:text-[#0F172A] md:left-4 md:h-12 md:w-12"
        >
          <FiArrowLeft size={18} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex((p: number) => (p + 1) % images.length);
            setImgLoading(true);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center border border-white/20 bg-black/60 text-white hover:border-white hover:bg-white hover:text-[#0F172A] md:right-4 md:h-12 md:w-12"
        >
          <FiArrowRight size={18} />
        </button>
      </div>
      <div className="border-t border-white/10 bg-black/80 px-3 py-3 md:px-8 md:py-4">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto md:gap-3">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setImgLoading(true);
              }}
              className={`relative shrink-0 overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? "border-white opacity-100"
                  : "border-transparent opacity-40 hover:opacity-80"
              }`}
              style={{ width: "60px", height: "42px" }}
            >
              <img
                src={img.src}
                alt={img.label}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <section className="bg-[#0F172A] py-10 md:py-16">
      <div className="mx-auto max-w-[100%] px-0">
        <div
          className="relative overflow-hidden bg-[#0A0F1A]"
          style={{ minHeight: "380px", height: "min(70vw, 600px)" }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-14 w-14 md:h-16 md:w-16">
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-transparent"
                style={{
                  borderTopColor: "#FFFFFF",
                  borderRightColor: "#FFFFFF",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function FeaturedProjectSection() {
  const router = useRouter();
  const [projects, setProjects] = useState<FeaturedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("/api/v1/properties?action=featured&limit=10");
        if (!res.ok) throw new Error("Failed to fetch");
        const result: ApiResponse = await res.json();

        if (!result.success || !result.data.length) {
          setProjects([]);
          setLoading(false);
          return;
        }

        const collectImages = (p: ApiProperty): string[] => {
          const seen = new Set<string>();
          const collected: { url: string; score: number }[] = [];

          if (isHighQualityImageUrl(p.featured_image)) {
            const upgraded = upgradeImageQuality(p.featured_image);
            if (!seen.has(upgraded)) {
              seen.add(upgraded);
              collected.push({ url: upgraded, score: 999999 });
            }
          }

          if (p.images?.length) {
            const sorted = [...p.images]
              .filter((i) => isHighQualityImageUrl(i.url))
              .sort((a, b) => scoreImage(b) - scoreImage(a));

            sorted.forEach((i) => {
              const upgraded = upgradeImageQuality(i.url);
              if (!seen.has(upgraded)) {
                seen.add(upgraded);
                collected.push({ url: upgraded, score: scoreImage(i) });
              }
            });
          }

          if (p.gallery_urls?.length) {
            p.gallery_urls.forEach((u) => {
              if (isHighQualityImageUrl(u)) {
                const upgraded = upgradeImageQuality(u);
                if (!seen.has(upgraded)) {
                  seen.add(upgraded);
                  collected.push({ url: upgraded, score: 0 });
                }
              }
            });
          }

          return collected.sort((a, b) => b.score - a.score).map((c) => c.url);
        };

        const valid = result.data.filter((p) => {
          if (!p.name || p.name.trim() === "") return false;
          const imgs = collectImages(p);
          return imgs.length >= 3;
        });

        if (valid.length === 0) {
          setProjects([]);
          setLoading(false);
          return;
        }

        const topThree = valid.slice(0, 3);
        const labels = [
          "MAIN VIEW",
          "LIVING ROOM",
          "AMENITIES AREA",
          "BEDROOM",
          "BATHROOM",
          "KITCHEN",
        ];

        const transformed: FeaturedProject[] = topThree.map((property) => {
          const images = collectImages(property);
          const gallery: ProjectImage[] = images.map((url, i) => ({
            src: url,
            label: labels[i % labels.length],
          }));

          return {
            id: property.id,
            eyebrow: "FEATURED PROJECT",
            title: property.name,
            slug: property.slug || `property-${property.id}`,
            image: images[0] || "",
            images: gallery.slice(1, 3),
            fullGallery: gallery,
          };
        });

        setProjects(transformed);
      } catch {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const next = useCallback(
    () => setActive((p: number) => (p + 1) % projects.length),
    [projects.length]
  );
  const prev = useCallback(
    () =>
      setActive((p: number) => (p - 1 + projects.length) % projects.length),
    [projects.length]
  );

  useEffect(() => {
    if (projects.length === 0 || isHovered || galleryOpen) return;
    timerRef.current = setTimeout(next, SLIDE_DURATION);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, isHovered, galleryOpen, next, projects.length]);

  const project = projects[active] || projects[0];

  const navigateToProperty = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button") || target.closest(".interactive")) {
        return;
      }
      if (project) {
        router.push(`/featured-explore-properties/${project.slug}`);
      }
    },
    [project, router]
  );

  if (loading) return <LoadingState />;
  if (!project || projects.length === 0) return null;

  return (
    <>
      <section className="bg-[#0F172A] py-0">
        <div className="mx-auto max-w-[100%] px-0">
          <div
            className="relative overflow-hidden bg-[#0A0F1A] cursor-pointer"
            style={{ minHeight: "380px", height: "min(70vw, 600px)" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={navigateToProperty}
          >
            <ImageWithFallback
              src={project.image}
              alt={project.title}
              className="absolute inset-0 transition-transform duration-700 hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            <div className="absolute right-4 top-4 z-20 flex items-center gap-0 md:right-10 md:top-10 interactive">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="flex h-9 w-11 items-center justify-center border border-white/30 bg-transparent text-white transition-all hover:border-white hover:bg-white hover:text-[#0F172A] md:h-11 md:w-14"
              >
                <FiArrowLeft size={14} strokeWidth={1.5} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="-ml-px flex h-9 w-11 items-center justify-center border border-white/30 bg-transparent text-white transition-all hover:border-white hover:bg-white hover:text-[#0F172A] md:h-11 md:w-14"
              >
                <FiArrowRight size={14} strokeWidth={1.5} />
              </button>
            </div>

            <div className="absolute bottom-8 left-4 z-20 max-w-[90%] md:bottom-14 md:left-14 md:max-w-[520px]">
              <p className="mb-2 text-[8px] font-medium uppercase tracking-[0.28em] text-white/60 md:mb-3 md:text-[10px]">
                {project.eyebrow}
              </p>

              <h2
                className="text-[24px] leading-tight text-white hover:text-white/80 transition-colors md:text-[42px]"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: 400,
                }}
              >
                {project.title}
              </h2>

              <div className="mt-4 flex flex-wrap items-center gap-2 md:mt-7 md:gap-3 interactive">
                <FigmaButton
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    router.push(
                      `/featured-explore-properties/${project.slug}`
                    );
                  }}
                >
                  Discover More
                </FigmaButton>

                <FigmaButton
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setGalleryStartIndex(0);
                    setGalleryOpen(true);
                  }}
                >
                  View All Photos
                </FigmaButton>
              </div>
            </div>

            {project.images.length >= 2 && (
              <div className="absolute bottom-8 right-4 z-20 hidden md:bottom-10 md:right-10 md:flex interactive">
                <div className="flex bg-white p-1.5 shadow-2xl">
                  {project.images.map((img, idx) => (
                    <motion.button
                      key={idx}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setGalleryStartIndex(idx + 1);
                        setGalleryOpen(true);
                      }}
                      whileHover={{ scale: 1.02 }}
                      className={`group relative block cursor-pointer overflow-hidden ${
                        idx > 0 ? "ml-1.5" : ""
                      }`}
                      style={{ width: "180px" }}
                    >
                      <div className="relative h-[120px] overflow-hidden bg-gray-800">
                        <ImageWithFallback
                          src={img.src}
                          alt={img.label}
                          className="transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100">
                          <FiImage size={22} className="text-white" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                          <p className="text-left text-[8px] font-medium uppercase tracking-[0.2em] text-white">
                            {img.label}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 md:hidden interactive">
              {projects.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActive(idx);
                  }}
                  className="h-[2px] rounded-full transition-all"
                  style={{
                    width: idx === active ? 22 : 6,
                    background:
                      idx === active ? "#FFFFFF" : "rgba(255,255,255,0.25)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <PhotoGalleryPopup
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        images={project.fullGallery}
        projectTitle={project.title}
        startIndex={galleryStartIndex}
      />
    </>
  );
}