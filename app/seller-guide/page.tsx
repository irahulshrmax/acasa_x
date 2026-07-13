"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FiCheckCircle,
  FiDollarSign,
  FiHome,
  FiClipboard,
  FiUsers,
  FiArrowRight,
  FiSearch,
  FiCamera,
  FiStar,
  FiTrendingUp,
  FiShield,
} from "react-icons/fi";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    icon: FiSearch,
    title: "Property Valuation",
    desc: "Get a free, accurate valuation of your property from our expert team based on current market trends.",
  },
  {
    icon: FiCamera,
    title: "Professional Marketing",
    desc: "We create stunning photography, virtual tours, and targeted campaigns to showcase your property.",
  },
  {
    icon: FiUsers,
    title: "Viewings & Negotiations",
    desc: "Our agents handle all viewings and negotiate the best price on your behalf.",
  },
  {
    icon: FiClipboard,
    title: "Legal & Documentation",
    desc: "We manage all paperwork, contracts, and legal requirements for a smooth transaction.",
  },
  {
    icon: FiDollarSign,
    title: "Closing & Handover",
    desc: "Finalize the sale, transfer ownership, and hand over keys with complete peace of mind.",
  },
];

const TIPS = [
  "Price your property competitively based on market data",
  "Declutter and stage your home for viewings",
  "Make necessary repairs before listing",
  "Be flexible with viewing schedules",
  "Work with experienced real estate professionals",
];

const STATS = [
  { label: "Properties Sold", value: "2,500+", icon: FiHome },
  { label: "Happy Sellers", value: "3,200+", icon: FiUsers },
  { label: "Success Rate", value: "98%", icon: FiTrendingUp },
  { label: "Years Experience", value: "15+", icon: FiStar },
];

export default function SellerGuide() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".guide-hero h1",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );

      gsap.fromTo(".guide-hero p",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: "power3.out" }
      );

      gsap.fromTo(".stat-item",
        { opacity: 0, y: 20, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1,
          stagger: 0.1,
          duration: 0.6,
          ease: "back.out(1.4)",
          scrollTrigger: { trigger: ".stats-grid", start: "top 80%" }
        }
      );

      gsap.fromTo(".step-card",
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1,
          stagger: 0.08,
          duration: 0.6,
          ease: "back.out(1.4)",
          scrollTrigger: { trigger: ".steps-grid", start: "top 80%" }
        }
      );

      gsap.fromTo(".tip-item",
        { opacity: 0, x: -20 },
        {
          opacity: 1, x: 0,
          stagger: 0.08,
          duration: 0.5,
          scrollTrigger: { trigger: ".tips-list", start: "top 85%" }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={sectionRef} className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="guide-hero bg-[#0D1520] text-white pt-20 pb-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-medium tracking-widest text-white/70 mb-4">
            FOR PROPERTY OWNERS
          </span>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Seller's Guide
          </h1>
          <p className="text-white/60 text-sm max-w-xl mx-auto">
            Everything you need to know about selling your property in Dubai. We make the process seamless and profitable.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="stat-item text-center">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-[#0D1520]/5">
                    <Icon className="w-5 h-5 text-[#0D1520]" />
                  </div>
                  <p
                    className="text-2xl font-bold text-[#0D1520]"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block rounded-full bg-[#0D1520]/5 px-4 py-1.5 text-[11px] font-medium tracking-widest text-[#0D1520] mb-3">
              HOW IT WORKS
            </span>
            <h2
              className="text-3xl md:text-4xl text-[#0D1520]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Your Selling Journey
            </h2>
            <p className="text-gray-500 text-sm mt-2 max-w-lg mx-auto">
              We guide you through every step of the selling process
            </p>
          </div>

          <div className="steps-grid grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="step-card bg-white border border-gray-100 p-6 rounded-xl text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative inline-block">
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#0D1520] text-white text-[10px] flex items-center justify-center font-semibold">
                      {i + 1}
                    </div>
                    <div className="flex items-center justify-center w-14 h-14 mx-auto mb-3 rounded-full bg-[#0D1520]/5 group-hover:bg-[#0D1520]/10 transition-colors">
                      <Icon className="w-6 h-6 text-[#0D1520]" />
                    </div>
                  </div>
                  <h3
                    className="font-semibold text-[#0D1520] text-sm mb-2"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tips & CTA Section */}
      <section className="py-16 bg-[#F8F6F3]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Tips */}
            <div>
              <span className="inline-block rounded-full bg-[#0D1520]/5 px-4 py-1.5 text-[11px] font-medium tracking-widest text-[#0D1520] mb-3">
                EXPERT ADVICE
              </span>
              <h2
                className="text-2xl md:text-3xl text-[#0D1520] mb-6"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Tips for Sellers
              </h2>
              <div className="tips-list space-y-4">
                {TIPS.map((tip) => (
                  <div key={tip} className="tip-item flex items-start gap-3 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                    <FiCheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-700" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-[#0D1520] text-white p-8 md:p-10 rounded-2xl flex flex-col justify-center">
              <FiShield className="w-10 h-10 text-[#C2B3A2] mb-4" />
              <h3
                className="text-2xl md:text-3xl mb-3"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Ready to Sell?
              </h3>
              <p className="text-white/60 text-sm mb-6">
                Get a free property valuation and let our experts guide you through every step.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/sell-your-property"
                  className="inline-flex items-center justify-center gap-2 bg-[#C2B3A2] text-[#0D1520] px-8 py-3 text-xs font-semibold uppercase tracking-wider hover:bg-white transition-colors rounded-full"
                >
                  Start Selling
                  <FiArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 border border-white/20 text-white px-8 py-3 text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition-colors rounded-full"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-12 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h3
            className="text-xl md:text-2xl text-[#0D1520] mb-2"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Still have questions?
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Our team of experts is here to help you with any queries about selling your property.
          </p>
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 border border-[#0D1520] text-[#0D1520] px-8 py-3 text-xs font-semibold uppercase tracking-wider hover:bg-[#0D1520] hover:text-white transition-colors rounded-full"
          >
            View FAQ
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}