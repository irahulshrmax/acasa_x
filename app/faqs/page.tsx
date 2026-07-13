"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PopularLinksSection from "@/components/PopularLinksSection";

type FAQItem = {
  id: number;
  question: string;
  answer: string;
  order_no: number;
};

type FAQData = {
  title: string;
  faqs: FAQItem[];
};

const THEME = {
  primary: "#192334",
  dark: "#0D1520",
  gold: "#C8AA78",
  goldLight: "#D4B888",
  muted: "#8A94A3",
  border: "#E8E6E1",
};

function FAQSkeleton() {
  return (
    <main className="min-h-screen bg-white pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-3 h-10 w-72 animate-pulse rounded bg-gray-200" />
          <div className="mx-auto h-0.5 w-12 bg-[#C8AA78]" />
          <div className="mx-auto mt-5 h-4 w-full max-w-xl animate-pulse rounded bg-gray-200" />
          <div className="mx-auto mt-2 h-4 w-2/3 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-[#E8E6E1] bg-white"
            >
              <div className="flex items-center justify-between px-6 py-5">
                <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function EmptyFAQState() {
  return (
    <main className="min-h-screen bg-white pt-28 pb-16">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-[#C8AA78]">
          FAQ
        </p>

        <h1
          className="text-3xl leading-tight text-[#192334] md:text-4xl"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          FAQs Coming Soon
        </h1>

        <div className="mx-auto mt-4 h-px w-12 bg-[#192334]" />

        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-gray-500">
          We are adding frequently asked questions. Please check back soon for
          helpful answers about properties, payment plans, and our services.
        </p>
      </div>
    </main>
  );
}

function ErrorFAQState({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <main className="min-h-screen bg-white pt-28 pb-16">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-[#C8AA78]">
          Something went wrong
        </p>

        <h1
          className="text-3xl leading-tight text-[#192334] md:text-4xl"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Unable to Load FAQs
        </h1>

        <div className="mx-auto mt-4 h-px w-12 bg-[#192334]" />

        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-gray-500">
          We could not load the frequently asked questions at the moment.
        </p>

        <button
          onClick={onRetry}
          className="faq-golden-btn mt-8 inline-flex items-center justify-center gap-3 px-8 py-3.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white"
        >
          <span>Retry</span>
          <span>→</span>
        </button>
      </div>
    </main>
  );
}

function FAQAccordionItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: FAQItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border transition-all duration-300 ${
        isOpen
          ? "border-[#C8AA78]/60 shadow-[0_14px_34px_rgba(25,35,52,0.08)]"
          : "border-[#E8E6E1] hover:border-[#C8AA78]/40"
      }`}
    >
      <button
        onClick={onToggle}
        className={`group flex w-full items-center justify-between gap-5 px-5 py-5 text-left transition-all duration-300 md:px-6 ${
          isOpen ? "bg-[#192334] text-white" : "bg-white hover:bg-[#FAF8F5]"
        }`}
      >
        <div className="flex items-start gap-4">
          <span
            className={`mt-1 hidden h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium tracking-wider transition-all sm:flex ${
              isOpen
                ? "bg-[#C8AA78] text-[#192334]"
                : "bg-[#F3EEE9] text-[#C8AA78] group-hover:bg-[#C8AA78] group-hover:text-[#192334]"
            }`}
          >
            {String(index + 1).padStart(2, "0")}
          </span>

          <span
            className={`text-[15px] font-medium leading-relaxed md:text-[17px] ${
              isOpen ? "text-white" : "text-[#192334]"
            }`}
          >
            {faq.question}
          </span>
        </div>

        <span
          className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
            isOpen
              ? "border-[#C8AA78]/50 bg-[#C8AA78] text-[#192334]"
              : "border-[#E8E6E1] text-[#192334] group-hover:border-[#C8AA78] group-hover:text-[#C8AA78]"
          }`}
        >
          <svg
            className={`h-4 w-4 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      <div
        className={`grid transition-all duration-500 ease-in-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[#E8E6E1] bg-white px-5 py-5 md:px-6">
            <p className="text-[14px] leading-[1.85] text-gray-600">
              {faq.answer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [data, setData] = useState<FAQData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    setHasError(false);

    try {
      const res = await fetch("/api/faqs", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const json = await res.json();

      if (json.success) {
        const sortedFaqs = [...(json.data?.faqs || [])].sort(
          (a: FAQItem, b: FAQItem) => (a.order_no || 0) - (b.order_no || 0)
        );

        setData({
          title: json.data?.title || "Frequently Asked Questions",
          faqs: sortedFaqs,
        });

        setOpenIndex(sortedFaqs.length > 0 ? 0 : null);
      } else {
        throw new Error(json.message || "Failed to fetch FAQs");
      }
    } catch (error) {
      console.error(error);
      setHasError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  return (
    <>
      <style jsx global>{`
        .faq-golden-btn {
          position: relative;
          overflow: hidden;
          background: #192334;
          border: 1px solid rgba(200, 170, 120, 0.55);
          transition: all 0.45s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.03),
            0 4px 18px rgba(0, 0, 0, 0.12);
        }

        .faq-golden-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          background: linear-gradient(
            90deg,
            #c8aa78 0%,
            #d4b888 50%,
            #c8aa78 100%
          );
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .faq-golden-btn::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.25),
            transparent
          );
          transform: translateX(-120%);
          transition: transform 0.7s ease;
        }

        .faq-golden-btn:hover::before {
          transform: scaleX(1);
        }

        .faq-golden-btn:hover::after {
          transform: translateX(120%);
        }

        .faq-golden-btn:hover {
          color: #192334;
          border-color: #c8aa78;
          transform: translateY(-2px);
          box-shadow:
            0 12px 32px rgba(200, 170, 120, 0.2),
            0 4px 16px rgba(0, 0, 0, 0.18);
        }

        .faq-golden-btn span {
          position: relative;
          z-index: 1;
        }
      `}</style>

      <Navbar />

      {loading ? (
        <FAQSkeleton />
      ) : hasError ? (
        <ErrorFAQState onRetry={fetchFaqs} />
      ) : !data || data.faqs.length === 0 ? (
        <EmptyFAQState />
      ) : (
        <main className="min-h-screen bg-white pt-24 pb-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-12 text-center">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-[#C8AA78]">
                Help Center
              </p>

              <h1
                className="text-3xl leading-tight text-[#192334] md:text-5xl"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {data.title}
              </h1>

              <div className="mx-auto mt-4 h-px w-14 bg-[#192334]" />

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-gray-500">
                Find answers to common questions about our properties, payment
                plans, and real estate services.
              </p>
            </div>

            {/* FAQ Accordion */}
            <div className="space-y-4">
              {data.faqs.map((faq, index) => (
                <FAQAccordionItem
                  key={faq.id}
                  faq={faq}
                  index={index}
                  isOpen={openIndex === index}
                  onToggle={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                />
              ))}
            </div>
          </div>
        </main>
      )}

      {/* Footer se upar */}
      <PopularLinksSection />

      <Footer />
    </>
  );
}