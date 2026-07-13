"use client";

import { useEffect, useState, lazy, Suspense, memo } from "react";
import { motion, type Variants } from "framer-motion";

const Navbar = lazy(() => import("@/components/Navbar"));
const Hero = lazy(() => import("@/components/Hero"));
const PropertyShowcase = lazy(() => import("@/components/PropertyShowcase"));
const FeaturedProperties = lazy(() => import("@/components/FeaturesProperties"));
const FeaturedProjects = lazy(() => import("@/components/FeaturedProjectSection"));
const Neighborhoods = lazy(() => import("@/components/Neighborhoods"));
const Lifestyle = lazy(() => import("@/components/LifestyleSection"));
const Developers = lazy(() => import("@/components/Developers"));
const About = lazy(() => import("@/components/About"));
const Blogs = lazy(() => import("@/components/Blogs"));
const Footer = lazy(() => import("@/components/Footer"));

const SECTION_BG = {
  white: "bg-white",
  cream: "bg-[#F8F6F3]",
  offwhite: "bg-[#FAFAFA]",
  dark: "bg-[#0D1520]",
} as const;

type SectionBg = keyof typeof SECTION_BG;

const SectionSkeleton = memo(function SectionSkeleton({
  bg = "white",
  height = "h-64",
  cols = 3,
}: {
  bg?: SectionBg;
  height?: string;
  cols?: 2 | 3 | 4;
}) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  }[cols];

  return (
    <div className={`py-8 ${SECTION_BG[bg]}`}>
      <div className="max-w-[1200px] mx-auto px-4">
        <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
          {Array.from({ length: cols }).map((_, i) => (
            <div
              key={i}
              className={`bg-gray-100 rounded-xl ${height} animate-pulse`}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

const NavbarSkeleton = memo(function NavbarSkeleton() {
  return (
    <div className="h-16 bg-white/90 backdrop-blur-sm border-b border-[#E8E6E1] animate-pulse">
      <div className="max-w-[1200px] mx-auto px-4 h-full flex items-center justify-between">
        <div className="w-32 h-8 bg-gray-200 rounded" />
        <div className="hidden md:flex gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-16 h-4 bg-gray-200 rounded" />
          ))}
        </div>
        <div className="w-20 h-8 bg-gray-200 rounded" />
      </div>
    </div>
  );
});

const HeroSkeleton = memo(function HeroSkeleton() {
  return (
    <div className="h-[600px] bg-gradient-to-b from-[#0D1520] to-[#1A2F4A] animate-pulse" />
  );
});

const FooterSkeleton = memo(function FooterSkeleton() {
  return <div className="h-64 bg-[#0D1520] animate-pulse" />;
});

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const Section = memo(function Section({
  children,
  id,
  bg = "white",
}: {
  children: React.ReactNode;
  id?: string;
  bg?: SectionBg;
}) {
  return (
    <motion.section
      id={id}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className={`relative ${SECTION_BG[bg]}`}
    >
      {children}
    </motion.section>
  );
});

type SectionConfig = {
  id: string;
  bg: SectionBg;
  Component: React.LazyExoticComponent<React.ComponentType>;
  Skeleton: React.ComponentType;
};

const SECTIONS: SectionConfig[] = [
  {
    id: "property-showcase",
    bg: "white",
    Component: PropertyShowcase,
    Skeleton: () => <SectionSkeleton bg="white" height="h-80" cols={3} />,
  },
  {
    id: "featured-properties",
    bg: "cream",
    Component: FeaturedProperties,
    Skeleton: () => <SectionSkeleton bg="cream" height="h-80" cols={3} />,
  },
  {
    id: "featured-projects",
    bg: "white",
    Component: FeaturedProjects,
    Skeleton: () => <SectionSkeleton bg="white" height="h-64" cols={2} />,
  },
  {
    id: "neighborhoods",
    bg: "offwhite",
    Component: Neighborhoods,
    Skeleton: () => <SectionSkeleton bg="offwhite" height="h-64" cols={3} />,
  },
  {
    id: "lifestyle",
    bg: "white",
    Component: Lifestyle,
    Skeleton: () => <SectionSkeleton bg="white" height="h-64" cols={2} />,
  },
  {
    id: "developers",
    bg: "cream",
    Component: Developers,
    Skeleton: () => <SectionSkeleton bg="cream" height="h-32" cols={4} />,
  },
  {
    id: "about",
    bg: "cream",
    Component: About,
    Skeleton: () => <SectionSkeleton bg="cream" height="h-32" cols={4} />,
  },
  {
    id: "blogs",
    bg: "white",
    Component: Blogs,
    Skeleton: () => <SectionSkeleton bg="white" height="h-64" cols={3} />,
  },
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-white">
        <NavbarSkeleton />
        <HeroSkeleton />
        {SECTIONS.map(({ id, Skeleton }) => (
          <Skeleton key={id} />
        ))}
        <FooterSkeleton />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <div className="relative z-50">
        <Suspense fallback={<NavbarSkeleton />}>
          <Navbar />
        </Suspense>
      </div>

      <div className="relative">
        <Suspense fallback={<HeroSkeleton />}>
          <Hero />
        </Suspense>
      </div>

      {SECTIONS.map(({ id, bg, Component, Skeleton }) => (
        <Section key={id} id={id} bg={bg}>
          <Suspense fallback={<Skeleton />}>
            <Component />
          </Suspense>
        </Section>
      ))}

      <div className="relative z-10">
        <Suspense fallback={<FooterSkeleton />}>
          <Footer />
        </Suspense>
      </div>
    </main>
  );
}