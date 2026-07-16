"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

type Developer = {
  id: number;
  name: string | null;
  seo_slug: string | null;
  image: string | null;
  image_url?: string | null;
};

export default function DeveloperCarousel() {
  const router = useRouter();
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDevelopers() {
      try {
        const res = await fetch(`/api/v1/developers?page=1&limit=20&sort_by=name_asc`);
        const result = await res.json();
        
        if (result.success) {
          // Filter valid logos
          const valid = result.data.filter((d: Developer) => {
            const img = d.image_url || d.image;
            return d.name && img && (img.startsWith('http://') || img.startsWith('https://'));
          });
          setDevelopers(valid);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDevelopers();
  }, []);

  const navigateToDeveloper = (slug: string | null | undefined) => {
    if (slug) router.push(`/developers/${slug}`);
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="text-center mb-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400">Developers</p>
        </div>
        <div className="flex justify-center gap-12 opacity-30">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="h-12 w-32 bg-neutral-200 animate-pulse rounded" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20 bg-white overflow-hidden">
      <div className="mx-auto max-w-[1320px] px-4 md:px-6 mb-10">
        <p className="text-center text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500 mb-3">
          Developers
        </p>
        <h2 
          className="text-center text-3xl md:text-4xl text-neutral-900 font-normal"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Our Trusted Partners
        </h2>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full">
        {/* Left fade */}
        <div className="absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* Scrolling Track */}
        <motion.div
          className="flex gap-16 md:gap-24 items-center"
          animate={{
            x: ["0%", "-50%"]
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 30,
              ease: "linear",
            },
          }}
        >
          {/* Original set */}
          {developers.map((dev) => (
            <div
              key={dev.id}
              onClick={() => navigateToDeveloper(dev.seo_slug)}
              className="flex-shrink-0 cursor-pointer group flex flex-col items-center gap-3"
            >
              <div className="h-16 md:h-20 w-40 md:w-48 flex items-center justify-center transition-transform duration-300 hover:scale-110">
                <img
                  src={dev.image_url || dev.image || ""}
                  alt={dev.name || "Developer"}
                  className="max-h-full max-w-full object-contain"
                  draggable={false}
                />
              </div>
              <p className="text-xs text-neutral-400 font-medium tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {dev.name}
              </p>
            </div>
          ))}
          
          {/* Duplicate set for seamless loop (agar bohot kam items hain toh yeh zaroori hai) */}
          {developers.map((dev) => (
            <div
              key={`dup-${dev.id}`}
              onClick={() => navigateToDeveloper(dev.seo_slug)}
              className="flex-shrink-0 cursor-pointer group flex flex-col items-center gap-3"
            >
              <div className="h-16 md:h-20 w-40 md:w-48 flex items-center justify-center transition-transform duration-300 hover:scale-110">
                <img
                  src={dev.image_url || dev.image || ""}
                  alt={dev.name || "Developer"}
                  className="max-h-full max-w-full object-contain"
                  draggable={false}
                />
              </div>
              <p className="text-xs text-neutral-400 font-medium tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {dev.name}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Agar bohot kam developers hain (jaise 3-4) aur "do do" nahi chahiye, toh neeche wala code use karo upar ke jagah: */}
      
      {/* ALTERNATIVE: Back-and-forth animation (no duplication) */}
      {/* 
      <motion.div
        className="flex gap-16 md:gap-24 items-center justify-center"
        animate={{
          x: [0, -100, 0]
        }}
        transition={{
          x: {
            repeat: Infinity,
            duration: 20,
            ease: "easeInOut",
          },
        }}
      >
        {developers.map((dev) => (
          <div
            key={dev.id}
            onClick={() => navigateToDeveloper(dev.seo_slug)}
            className="flex-shrink-0 cursor-pointer group flex flex-col items-center gap-3"
          >
            <div className="h-16 md:h-20 w-40 md:w-48 flex items-center justify-center transition-transform duration-300 hover:scale-110">
              <img
                src={dev.image_url || dev.image || ""}
                alt={dev.name || "Developer"}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        ))}
      </motion.div>
      */}
    </section>
  );
}