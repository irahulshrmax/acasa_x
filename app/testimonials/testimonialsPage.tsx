"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Quote, User, ChevronRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Testimonial {
  id: number;
  name: string;
  designation: string | null;
  testimonial: string;
  image: string | null;
  image_url: string | null;
  image_urls: string[];
}

const TESTIMONIAL_IMAGE_EXTENSIONS = ["jpg", "jpeg", "webp", "png"];

function buildTestimonialImageUrls(image: string | null | undefined) {
  if (!image) return [];

  const cleanImage = image.trim();
  if (!cleanImage) return [];

  const hasExtension = /\.(jpg|jpeg|webp|png)$/i.test(cleanImage);
  const withoutExtension = cleanImage.replace(/\.(jpg|jpeg|webp|png)$/i, "");

  const fallbackUrls = TESTIMONIAL_IMAGE_EXTENSIONS.map(
    (ext) => `/upload/testimonial/${withoutExtension}.${ext}`
  );

  if (hasExtension) {
    const directUrl = `/upload/testimonial/${cleanImage}`;

    return [
      directUrl,
      ...fallbackUrls.filter((url) => url !== directUrl),
    ];
  }

  return fallbackUrls;
}

function TestimonialAvatar({
  urls,
  name,
}: {
  urls: string[];
  name: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setFailed(false);
  }, [urls.join("|")]);

  if (!urls.length || failed) {
    return (
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#577C8E]/10">
        <User className="h-5 w-5 text-[#577C8E]" strokeWidth={1.5} />
      </div>
    );
  }

  const currentUrl = urls[currentIndex];

  return (
    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-[#f4efeb] ring-2 ring-[#577C8E]/10">
      <Image
        key={currentUrl}
        src={currentUrl}
        alt={name}
        fill
        className="object-cover"
        unoptimized
        quality={85}
        onError={() => {
          if (currentIndex < urls.length - 1) {
            setCurrentIndex((prev) => prev + 1);
          } else {
            setFailed(true);
          }
        }}
      />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#1a2233]/5 bg-white p-6 shadow-sm">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gray-100 animate-pulse" />

      <div className="mb-6 space-y-3">
        <div className="h-3 w-full rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
        <div className="h-3 w-5/6 rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
        <div className="h-3 w-4/5 rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
      </div>

      <div className="flex items-center gap-3 border-t border-[#1a2233]/5 pt-4">
        <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gray-200 animate-pulse" />
        <div className="min-w-0 flex-1">
          <div className="mb-2 h-3 w-24 rounded bg-gray-200 animate-pulse" />
          <div className="h-2.5 w-32 rounded bg-gray-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let index = 0;

    const timeout = setTimeout(() => {
      setDisplayedText("");

      interval = setInterval(() => {
        index += 1;
        setDisplayedText(text.substring(0, index));

        if (index >= text.length && interval) {
          clearInterval(interval);
        }
      }, 18);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [text, delay]);

  return <span>{displayedText}</span>;
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTestimonials = async () => {
      try {
        const res = await fetch("/api/public/testimonials", {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          const fixedData: Testimonial[] = data.data.map((t: any) => {
            const imageUrls = buildTestimonialImageUrls(t.image);

            return {
              id: t.id,
              name: t.name,
              designation: t.designation,
              testimonial: t.testimonial,
              image: t.image,
              image_url: imageUrls[0] || null,
              image_urls: imageUrls,
            };
          });

          setTestimonials(fixedData);
          setError(null);
        } else {
          throw new Error("Invalid API response");
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError("Failed to load testimonials");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!loading && gridRef.current && testimonials.length > 0) {
      const cards = cardsRef.current.filter(Boolean);

      gsap.from(cards, {
        opacity: 0,
        y: 35,
        duration: 0.6,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 75%",
          once: true,
        },
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [loading, testimonials]);

  if (loading) {
    return (
      <section className="min-h-screen bg-[#FBFAF8] py-10 md:py-14 lg:py-16">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center md:mb-10">
            <div className="mx-auto mb-3 h-3 w-40 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
            <div className="mx-auto mb-4 h-8 w-64 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
            <div className="mx-auto h-3 w-full max-w-md rounded bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#FBFAF8] py-10 md:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center md:mb-11">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[#577C8E]">
            What Our Clients Say
          </p>

          <h1 className="font-playfair text-[30px] font-medium uppercase leading-tight tracking-[-0.5px] text-[#1a2233] md:text-[42px]">
            Testimonials & Reviews
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-[13px] font-light leading-6 text-[#1a2233]/60">
            Real experiences from our valued clients. Discover why people choose
            Acasa for their real estate journey.
          </p>

          <div className="mx-auto mt-4 h-px w-12 bg-gradient-to-r from-transparent via-[#577C8E] to-transparent" />
        </div>

        {error ? (
          <div className="py-16 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
              <Quote className="h-8 w-8 text-gray-300" strokeWidth={1} />
            </div>
            <p className="text-[13px] font-light text-[#1a2233]/50">{error}</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
              <Quote className="h-8 w-8 text-[#577C8E]/40" strokeWidth={1.5} />
            </div>

            <h3 className="mt-4 font-playfair text-[22px] font-medium text-[#1a2233]">
              No testimonials yet
            </h3>

            <p className="mt-2 text-[13px] font-light text-[#1a2233]/50">
              Check back soon for reviews from our clients.
            </p>
          </div>
        ) : (
          <div
            ref={gridRef}
            className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {testimonials.map((testimonial, idx) => (
              <div
                key={testimonial.id}
                ref={(el) => {
                  cardsRef.current[idx] = el;
                }}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#1a2233]/7 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#577C8E]/20 hover:shadow-xl"
              >
                <div className="pointer-events-none absolute -right-5 -top-5 text-[#577C8E]/10 transition-transform duration-500 group-hover:scale-110">
                  <Quote className="h-24 w-24" strokeWidth={0.6} />
                </div>

                <div className="relative z-10 mb-5">
                  <Quote className="mb-4 h-7 w-7 text-[#577C8E]/35" />

                  <p className="text-[13px] font-light leading-7 text-[#1a2233]/72">
                    "
                    <TypewriterText
                      text={testimonial.testimonial}
                      delay={idx * 80}
                    />
                    "
                  </p>
                </div>

                <div className="relative z-10 mt-auto flex items-center gap-3 border-t border-[#1a2233]/7 pt-4">
                  <TestimonialAvatar
                    urls={testimonial.image_urls}
                    name={testimonial.name}
                  />

                  <div className="min-w-0 flex-1">
                    <h4 className="font-playfair text-[13px] font-semibold uppercase tracking-[0.03em] text-[#1a2233]">
                      {testimonial.name}
                    </h4>

                    {testimonial.designation && (
                      <p className="mt-0.5 truncate text-[10px] font-light tracking-[0.05em] text-[#1a2233]/50">
                        {testimonial.designation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {testimonials.length > 0 && (
          <div className="mt-12 text-center">
            <p className="mb-3 text-[12px] font-light text-[#1a2233]/50">
              {testimonials.length} verified testimonials from our clients
            </p>

            <div className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#577C8E]">
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
              More testimonials coming soon
            </div>
          </div>
        )}
      </div>
    </section>
  );
}