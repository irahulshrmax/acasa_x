// "use client";

// import { useEffect, useState, useRef, useCallback } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import { Quote, User, ChevronLeft, ChevronRight } from "lucide-react";
// import gsap from "gsap";

// interface Testimonial {
//   id: number;
//   name: string;
//   designation: string | null;
//   testimonial: string;
//   image_url: string | null;
// }

// function SkeletonLoader() {
//   return (
//     <div className="bg-[#F4EFEB] py-20">
//       <div className="mx-auto max-w-[1300px] px-5">
//         <div className="mb-10 text-center">
//           <div className="mx-auto mb-3 h-3 w-32 rounded-full bg-gray-200 animate-pulse" />
//           <div className="mx-auto mb-4 h-8 w-48 rounded-lg bg-gray-200 animate-pulse" />
//         </div>
//         <div className="mx-auto max-w-3xl">
//           <div className="rounded-2xl bg-white p-8 shadow-lg">
//             <div className="mb-6 h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
//             <div className="space-y-3">
//               <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
//               <div className="h-4 w-5/6 rounded bg-gray-200 animate-pulse" />
//               <div className="h-4 w-4/5 rounded bg-gray-200 animate-pulse" />
//             </div>
//             <div className="mt-6 flex items-center gap-4">
//               <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
//               <div className="flex-1">
//                 <div className="mb-2 h-4 w-24 rounded bg-gray-200 animate-pulse" />
//                 <div className="h-3 w-32 rounded bg-gray-100 animate-pulse" />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function TypewriterText({ text, isActive }: { text: string; isActive: boolean }) {
//   const [displayedText, setDisplayedText] = useState("");
//   const indexRef = useRef(0);

//   useEffect(() => {
//     if (!isActive) {
//       setDisplayedText("");
//       indexRef.current = 0;
//       return;
//     }
//     setDisplayedText("");
//     indexRef.current = 0;
//     const interval = setInterval(() => {
//       setDisplayedText((prev) => {
//         if (indexRef.current < text.length) {
//           indexRef.current += 1;
//           return text.substring(0, indexRef.current);
//         }
//         clearInterval(interval);
//         return prev;
//       });
//     }, 30);
//     return () => clearInterval(interval);
//   }, [text, isActive]);

//   return <span>{displayedText}</span>;
// }

// export default function TestimonialsSection() {
//   const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [autoPlay, setAutoPlay] = useState(true);
//   const intervalRef = useRef<NodeJS.Timeout | null>(null);
//   const cardRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const controller = new AbortController();
//     const checkImageExists = async (url: string) => {
//       try {
//         const res = await fetch(url, { method: "HEAD", signal: controller.signal });
//         return res.ok;
//       } catch {
//         return false;
//       }
//     };
//     const getValidImageUrl = async (imageName: string) => {
//       const extensions = [".jpg", ".jpeg", ".png", ".webp"];
//       const hasExtension = /\.[a-zA-Z0-9]+$/.test(imageName);
//       if (hasExtension) {
//         const directUrl = `/upload/testimonial/${imageName}`;
//         const exists = await checkImageExists(directUrl);
//         return exists ? directUrl : null;
//       }
//       for (const ext of extensions) {
//         const testUrl = `/upload/testimonial/${imageName}${ext}`;
//         const exists = await checkImageExists(testUrl);
//         if (exists) return testUrl;
//       }
//       return null;
//     };
//     const fetchTestimonials = async () => {
//       try {
//         const res = await fetch("/api/public/testimonials/featured", { signal: controller.signal });
//         if (!res.ok) throw new Error();
//         const data = await res.json();
//         if (data.success && Array.isArray(data.data)) {
//           const fixedData = await Promise.all(
//             data.data.map(async (t: any) => ({
//               ...t,
//               image_url: t.image ? await getValidImageUrl(t.image) : null,
//             }))
//           );
//           setTestimonials(fixedData);
//         }
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchTestimonials();
//     return () => controller.abort();
//   }, []);

//   useEffect(() => {
//     if (testimonials.length > 1 && autoPlay) {
//       intervalRef.current = setInterval(() => {
//         setCurrentIndex((prev) => (prev + 1) % testimonials.length);
//         setAutoPlay(true);
//       }, 6000);
//     }
//     return () => {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//     };
//   }, [testimonials.length, autoPlay]);

//   useEffect(() => {
//     if (cardRef.current) {
//       gsap.from(cardRef.current, { opacity: 0, y: 20, duration: 0.5, ease: "power2.out" });
//     }
//   }, [currentIndex]);

//   const handlePrev = useCallback(() => {
//     setAutoPlay(false);
//     setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
//   }, [testimonials.length]);

//   const handleNext = useCallback(() => {
//     setAutoPlay(false);
//     setCurrentIndex((prev) => (prev + 1) % testimonials.length);
//   }, [testimonials.length]);

//   if (loading) return <SkeletonLoader />;
//   if (testimonials.length === 0) return null;

//   const current = testimonials[currentIndex];

//   return (
//     <section className="bg-[#F4EFEB] py-20">
//       <div className="mx-auto max-w-[1300px] px-5">
//         <div className="mb-12 text-center">
//           <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-[#577C8E]">
//             Client Testimonials
//           </p>
//           <h2 className="font-playfair text-[32px] font-medium uppercase tracking-[-0.5px] text-[#1a2233] md:text-[42px]">
//             What Our Clients Say
//           </h2>
//           <div className="mx-auto mt-4 h-px w-12 bg-gradient-to-r from-transparent via-[#577C8E] to-transparent" />
//         </div>

//         <div className="relative mx-auto max-w-3xl">
//           <div ref={cardRef} className="rounded-2xl bg-white p-8 shadow-lg md:p-10">
//             <Quote className="mb-5 h-9 w-9 text-[#577C8E]/30" />
//             <p className="min-h-[100px] text-[15px] leading-relaxed text-[#1a2233]/70">
//               "<TypewriterText text={current.testimonial} isActive={true} />"
//             </p>
//             <div className="mt-6 flex items-center gap-4">
//               {current.image_url ? (
//                 <div className="relative h-12 w-12 overflow-hidden rounded-full">
//                   <Image
//                     src={current.image_url}
//                     alt={current.name}
//                     fill
//                     className="object-cover"
//                     unoptimized
//                   />
//                 </div>
//               ) : (
//                 <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#577C8E]/10">
//                   <User className="h-5 w-5 text-[#577C8E]" />
//                 </div>
//               )}
//               <div>
//                 <h4 className="font-playfair text-[14px] font-semibold uppercase text-[#1a2233]">
//                   {current.name}
//                 </h4>
//                 {current.designation && (
//                   <p className="mt-0.5 text-[10px] text-[#1a2233]/50">
//                     {current.designation}
//                   </p>
//                 )}
//               </div>
//             </div>
//           </div>

//           {testimonials.length > 1 && (
//             <div className="mt-6 flex items-center justify-center gap-3">
//               <button
//                 onClick={handlePrev}
//                 className="rounded-full border border-[#1a2233]/20 p-2 text-[#1a2233] transition-all hover:border-[#1a2233] hover:bg-[#1a2233] hover:text-white"
//               >
//                 <ChevronLeft className="h-4 w-4" />
//               </button>
//               <div className="flex gap-1.5">
//                 {testimonials.map((_, idx) => (
//                   <button
//                     key={idx}
//                     onClick={() => {
//                       setAutoPlay(false);
//                       setCurrentIndex(idx);
//                     }}
//                     className={`rounded-full transition-all ${
//                       idx === currentIndex
//                         ? "h-2 w-6 bg-[#577C8E]"
//                         : "h-2 w-2 bg-[#1a2233]/20 hover:bg-[#1a2233]/40"
//                     }`}
//                   />
//                 ))}
//               </div>
//               <button
//                 onClick={handleNext}
//                 className="rounded-full border border-[#1a2233]/20 p-2 text-[#1a2233] transition-all hover:border-[#1a2233] hover:bg-[#1a2233] hover:text-white"
//               >
//                 <ChevronRight className="h-4 w-4" />
//               </button>
//             </div>
//           )}
//         </div>

//         <div className="mt-10 text-center">
//           <Link
//             href="/testimonials"
//             className="inline-flex items-center gap-2 border border-[#1a2233]/40 px-6 py-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#1a2233] transition-all hover:border-[#1a2233] hover:bg-[#1a2233] hover:text-white"
//           >
//             Read All Reviews
//             <ChevronRight className="h-3.5 w-3.5" />
//           </Link>
//         </div>
//       </div>
//     </section>
//   );
// }

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";
import gsap from "gsap";

interface Testimonial {
  id: number;
  name: string;
  designation: string;
  testimonial: string;
  image_url: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sara Khan",
    designation: "Homeowner, Lahore",
    testimonial:
      "Acasa completely transformed our home into a place that feels elegant, peaceful, and truly luxurious. Their team handled every detail with great care, from the initial concept to the final finishing touches. The entire process was smooth, professional, and inspiring. What impressed us most was how beautifully they balanced comfort with sophistication. Every room now reflects class, warmth, and personality. We are genuinely thankful to Acasa for creating a home that exceeds our expectations.",
    image_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    name: "Ahmed Raza",
    designation: "Apartment Owner, Islamabad",
    testimonial:
      "Choosing Acasa was one of the best decisions we made for our apartment. Their design sense is exceptional, and they know exactly how to turn ideas into a polished and functional living space. From colors and textures to lighting and furniture placement, everything was handled with remarkable precision. The final result feels modern, stylish, and highly comfortable. Acasa did not just design our apartment — they elevated our everyday living experience in the most beautiful way.",
    image_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    name: "Hina Malik",
    designation: "Client, Karachi",
    testimonial:
      "Our experience with Acasa was outstanding from start to finish. Their team listened carefully, understood our vision, and then delivered something even better than what we imagined. The attention to detail, creativity, and professionalism were visible in every step of the project. The interiors now feel timeless, refined, and perfectly suited to our lifestyle. If anyone is looking for premium interior design with true dedication and quality, Acasa is a name I would confidently recommend.",
    image_url:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=900&q=80",
  },
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  useEffect(() => {
    if (isPaused || testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    }
  }, [currentIndex]);

  const current = testimonials[currentIndex];

  return (
    <section className="bg-[#F4EFEB] py-20">
      <div className="mx-auto max-w-[1300px] px-5">
        <div className="mb-12 text-center">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-[#577C8E]">
            Client Testimonials
          </p>
          <h2 className="font-playfair text-[32px] font-medium uppercase tracking-[-0.5px] text-[#1a2233] md:text-[42px]">
            What Our Clients Say
          </h2>
          <div className="mx-auto mt-4 h-px w-14 bg-gradient-to-r from-transparent via-[#577C8E] to-transparent" />
        </div>

        <div
          className="relative mx-auto max-w-5xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            ref={cardRef}
            className="overflow-hidden rounded-[28px] bg-white shadow-[0_20px_80px_rgba(26,34,51,0.08)]"
          >
            <div className="grid items-center md:grid-cols-[300px_1fr]">
              <div className="relative h-[280px] w-full md:h-full md:min-h-[380px]">
                <img
                  src={current.image_url}
                  alt={current.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a2233]/55 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1a2233] backdrop-blur-sm">
                  Verified Client
                </div>
              </div>

              <div className="p-8 md:p-10 lg:p-12">
                <div className="mb-4 flex items-center gap-1 text-[#D4A437]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>

                <Quote className="mb-5 h-10 w-10 text-[#577C8E]/25" />

                <p className="text-[15px] leading-8 text-[#1a2233]/75 md:text-[17px]">
                  “{current.testimonial}”
                </p>

                <div className="mt-8 border-t border-[#1a2233]/10 pt-5">
                  <h4 className="font-playfair text-[22px] font-semibold text-[#1a2233]">
                    {current.name}
                  </h4>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#577C8E]">
                    {current.designation}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 flex items-center justify-center gap-4">
            <button
              onClick={handlePrev}
              aria-label="Previous testimonial"
              className="rounded-full border border-[#1a2233]/20 p-2.5 text-[#1a2233] transition-all hover:border-[#1a2233] hover:bg-[#1a2233] hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to testimonial ${idx + 1}`}
                  className="group"
                >
                  <span
                    className={`block h-2 rounded-full transition-all duration-300 ${
                      idx === currentIndex
                        ? "w-12 bg-[#577C8E]"
                        : "w-3 bg-[#1a2233]/20 group-hover:w-8 group-hover:bg-[#1a2233]/35"
                    }`}
                  />
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              aria-label="Next testimonial"
              className="rounded-full border border-[#1a2233]/20 p-2.5 text-[#1a2233] transition-all hover:border-[#1a2233] hover:bg-[#1a2233] hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-3 text-center text-[11px] uppercase tracking-[0.16em] text-[#1a2233]/45">
            {currentIndex + 1} / {testimonials.length}
          </p>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/testimonials"
            className="inline-flex items-center gap-2 border border-[#1a2233]/40 px-6 py-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#1a2233] transition-all hover:border-[#1a2233] hover:bg-[#1a2233] hover:text-white"
          >
            Read All Reviews
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}