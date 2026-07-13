"use client";

import {
  MessageCircle,
  Phone,
  Sparkles,
  X,
  Send,
  Clock,
  ShieldCheck,
  Building2,
  Users,
  Award,
  ChevronRight,
  Heart,
  Home,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";

const WHATSAPP_NUMBER = "971502590071";
const PHONE_NUMBER = "+971502590071";
const COMPANY_NAME = "ACASA";
const COMPANY_TAGLINE = "Premium Real Estate Dubai";
const MESSAGE = "Hi! I'm interested in your properties. Can you help me?";

type ActionLoading = "chat" | "call" | null;

const THEME = {
  primary: "#0F1C2E",
  secondary: "#1A2F4A",
  accent: "#C9A96E",
  accentLight: "#D4B888",
  muted: "#6B7A8D",
  border: "#E2E8F0",
  surface: "#F8FAFC",
};

function ButtonSpinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="30 60"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [actionLoading, setActionLoading] = useState<ActionLoading>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);

      if (buttonRef.current) {
        gsap.fromTo(
          buttonRef.current,
          { opacity: 0, scale: 0.75, y: 18 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.65,
            ease: "back.out(1.7)",
          }
        );
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!buttonRef.current) return;

    gsap.killTweensOf(buttonRef.current);

    if (isVisible && !isOpen) {
      gsap.to(buttonRef.current, {
        y: -6,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    } else {
      gsap.to(buttonRef.current, {
        y: 0,
        duration: 0.25,
        ease: "power2.out",
      });
    }

    return () => {
      if (buttonRef.current) gsap.killTweensOf(buttonRef.current);
    };
  }, [isVisible, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { y: 22, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.42,
          ease: "power3.out",
        }
      );
    }

    if (modalContentRef.current?.children) {
      gsap.fromTo(
        modalContentRef.current.children,
        { y: 12, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.055,
          duration: 0.32,
          ease: "power2.out",
        }
      );
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        toggleModal();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  const closeModal = useCallback(() => {
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        y: 20,
        opacity: 0,
        scale: 0.98,
        duration: 0.28,
        ease: "power2.in",
        onComplete: () => setIsOpen(false),
      });
    } else {
      setIsOpen(false);
    }
  }, []);

  const toggleModal = useCallback(() => {
    if (isOpen) {
      closeModal();
    } else {
      setIsOpen(true);
    }
  }, [isOpen, closeModal]);

  const handleChat = useCallback(() => {
    if (actionLoading) return;

    setActionLoading("chat");

    const encodedMessage = encodeURIComponent(MESSAGE);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.94,
        yoyo: true,
        repeat: 1,
        duration: 0.12,
        ease: "power2.out",
      });
    }

    setTimeout(() => {
      const opened = window.open(url, "_blank", "noopener,noreferrer");

      if (!opened) {
        window.location.href = url;
      }

      setActionLoading(null);
      setIsOpen(false);
    }, 650);
  }, [actionLoading]);

  const handleCall = useCallback(() => {
    if (actionLoading) return;

    setActionLoading("call");

    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.94,
        yoyo: true,
        repeat: 1,
        duration: 0.12,
        ease: "power2.out",
      });
    }

    setTimeout(() => {
      window.location.href = `tel:${PHONE_NUMBER}`;
      setActionLoading(null);
      setIsOpen(false);
    }, 650);
  }, [actionLoading]);

  if (!isVisible) return null;

  return (
    <>
      <style jsx global>{`
        /* ─── Floating Button ───────────────────────────────────── */
        .acasa-wa-float {
          background: ${THEME.primary};
          border: 1px solid rgba(201, 169, 110, 0.4);
          box-shadow: 0 8px 32px rgba(15, 28, 46, 0.3);
        }

        .acasa-wa-float::before {
          content: "";
          position: absolute;
          inset: 0;
          background: ${THEME.accent};
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 0;
          border-radius: 16px;
        }

        .acasa-wa-float:hover::before {
          transform: scaleX(1);
        }

        .acasa-wa-float:hover {
          border-color: ${THEME.accent};
          box-shadow: 0 12px 40px rgba(201, 169, 110, 0.25);
          color: ${THEME.primary};
        }

        .acasa-wa-icon-wrap {
          position: relative;
          z-index: 3;
        }

        .acasa-wa-halo {
          position: absolute;
          inset: -14px;
          border-radius: 22px;
          border: 1px solid rgba(201, 169, 110, 0.3);
          opacity: 0.75;
          animation: acasaHalo 2.2s ease-in-out infinite;
        }

        @keyframes acasaHalo {
          0% {
            transform: scale(0.9);
            opacity: 0.65;
          }
          70% {
            transform: scale(1.18);
            opacity: 0;
          }
          100% {
            transform: scale(1.18);
            opacity: 0;
          }
        }

        /* ─── Modal ──────────────────────────────────────────────── */
        .acasa-contact-modal {
          background: #ffffff;
          border: 1px solid ${THEME.border};
          box-shadow: 0 24px 64px rgba(15, 28, 46, 0.15);
        }

        .acasa-contact-modal-header {
          background: ${THEME.primary};
        }

        .acasa-contact-modal-header::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, ${THEME.accent}, ${THEME.accentLight}, ${THEME.accent});
        }

        /* ─── Action Buttons ────────────────────────────────────── */
        .acasa-contact-action {
          border: 1px solid ${THEME.border};
          background: ${THEME.surface};
          color: ${THEME.primary};
          transition: all 0.3s ease;
        }

        .acasa-contact-action:hover {
          border-color: ${THEME.accent};
          background: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(201, 169, 110, 0.12);
        }

        .acasa-contact-action:active {
          transform: scale(0.98);
        }

        .acasa-contact-action .action-icon {
          background: ${THEME.primary};
          color: white;
          transition: all 0.3s ease;
        }

        .acasa-contact-action:hover .action-icon {
          background: ${THEME.accent};
          color: ${THEME.primary};
        }

        .acasa-contact-action .action-arrow {
          color: ${THEME.muted};
          transition: all 0.3s ease;
        }

        .acasa-contact-action:hover .action-arrow {
          color: ${THEME.accent};
          transform: translateX(2px);
        }

        .acasa-whatsapp-action .action-icon {
          background: #25D366;
          color: white;
        }

        .acasa-whatsapp-action:hover .action-icon {
          background: #1ebe5d;
        }

        .acasa-call-action .action-icon {
          background: ${THEME.primary};
          color: white;
        }

        .acasa-call-action:hover .action-icon {
          background: ${THEME.accent};
          color: ${THEME.primary};
        }

        /* ─── Status Badge ──────────────────────────────────────── */
        .acasa-status-dot {
          background: #25D366;
          box-shadow: 0 0 12px rgba(37, 211, 102, 0.4);
        }

        /* ─── Mobile Responsive ──────────────────────────────────── */
        @media (max-width: 480px) {
          .acasa-contact-modal {
            right: 16px !important;
            left: 16px !important;
            width: auto !important;
            bottom: 88px !important;
          }
        }
      `}</style>

      {/* ─── Floating Button ────────────────────────────────────────── */}
      <button
        ref={buttonRef}
        onClick={toggleModal}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="acasa-wa-float fixed bottom-6 right-6 z-50 flex h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-2xl text-white transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40 focus:ring-offset-2"
        style={{
          transform: hovered ? "translateY(-2px)" : undefined,
        }}
        aria-label="Contact ACASA"
      >
        <span className="acasa-wa-halo" />

        <div className="acasa-wa-icon-wrap">
          {isOpen ? (
            <X size={28} className="relative z-10" />
          ) : (
            <>
              <MessageCircle size={28} className="relative z-10 fill-current" />
              <span className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366] text-[9px] font-bold text-white shadow-lg ring-2 ring-white">
                1
              </span>
              <span className="absolute -bottom-1 -left-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[#C9A96E] text-[#0F1C2E] shadow-lg">
                <Sparkles className="h-3 w-3" />
              </span>
            </>
          )}
        </div>
      </button>

      {/* ─── Modal ──────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="acasa-contact-modal fixed bottom-24 right-6 z-50 w-[380px] sm:w-[400px]">
          <div
            ref={modalRef}
            className="overflow-hidden rounded-2xl border shadow-xl"
            style={{ borderColor: THEME.border }}
          >
            <div ref={modalContentRef}>
              {/* ─── Header ────────────────────────────────────────── */}
              <div className="acasa-contact-modal-header relative px-6 py-5 text-white">
                <div className="absolute inset-0 opacity-[0.04]">
                  <div className="absolute -left-16 -top-16 h-36 w-36 rounded-full bg-[#C9A96E]" />
                  <div className="absolute -bottom-20 -right-16 h-44 w-44 rounded-full bg-[#D4B888]" />
                </div>

                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A96E]/40 to-transparent" />

                <div className="relative flex items-center gap-4">
                  <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl border border-[#C9A96E]/30 bg-white/10 text-[#C9A96E] shadow-lg backdrop-blur-sm">
                    <MessageCircle className="h-6 w-6" />
                  </div>

                  <div className="flex-1">
                    <h3
                      className="text-lg font-normal tracking-wide"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                      {COMPANY_NAME}
                    </h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#C9A96E]/70">
                      {COMPANY_TAGLINE}
                    </p>
                  </div>

                  <button
                    onClick={toggleModal}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-all hover:border-[#C9A96E]/50 hover:bg-[#C9A96E]/20 hover:text-white"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* ─── Quick Info ───────────────────────────────────── */}
              <div className="border-b px-6 py-4" style={{ borderColor: THEME.border }}>
                <p className="text-sm leading-relaxed text-[#4A5462]">
                  Our team is ready to assist you with all your real estate needs.
                  <span className="font-medium text-[#0F1C2E]"> Connect instantly</span>
                  via WhatsApp or call us directly.
                </p>
              </div>

              {/* ─── Stats ────────────────────────────────────────── */}
              <div className="grid grid-cols-3 gap-2 border-b px-4 py-3" style={{ borderColor: THEME.border }}>
                <div className="text-center">
                  <p className="text-xs font-semibold text-[#0F1C2E]">24/7</p>
                  <p className="text-[9px] uppercase tracking-[0.12em] text-[#6B7A8D]">Support</p>
                </div>

                <div className="border-x text-center" style={{ borderColor: THEME.border }}>
                  <p className="text-xs font-semibold text-[#0F1C2E]">&lt; 2 min</p>
                  <p className="text-[9px] uppercase tracking-[0.12em] text-[#6B7A8D]">Response</p>
                </div>

                <div className="text-center">
                  <p className="text-xs font-semibold text-[#0F1C2E]">100%</p>
                  <p className="text-[9px] uppercase tracking-[0.12em] text-[#6B7A8D]">Private</p>
                </div>
              </div>

              {/* ─── Actions ───────────────────────────────────────── */}
              <div className="space-y-3 p-4">
                {/* WhatsApp Button */}
                <button
                  onClick={handleChat}
                  disabled={actionLoading === "chat"}
                  className="acasa-contact-action acasa-whatsapp-action group relative flex w-full items-center gap-4 rounded-xl p-3.5 text-left transition-all disabled:cursor-wait"
                >
                  <div className="action-icon flex h-10 w-10 items-center justify-center rounded-xl transition-all">
                    {actionLoading === "chat" ? (
                      <span className="inline-flex animate-spin">
                        <ButtonSpinner />
                      </span>
                    ) : (
                      <MessageCircle className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#0F1C2E]">
                      {actionLoading === "chat" ? "Opening WhatsApp..." : "Chat on WhatsApp"}
                    </p>
                    <p className="text-xs text-[#6B7A8D]">
                      {actionLoading === "chat" ? "Please wait" : "Get instant reply"}
                    </p>
                  </div>

                  <ChevronRight className="action-arrow h-4 w-4" />
                </button>

                {/* Divider */}
                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: THEME.border }} />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-[#6B7A8D]">or</span>
                  </div>
                </div>

                {/* Call Button */}
                <button
                  onClick={handleCall}
                  disabled={actionLoading === "call"}
                  className="acasa-contact-action acasa-call-action group relative flex w-full items-center gap-4 rounded-xl p-3.5 text-left transition-all disabled:cursor-wait"
                >
                  <div className="action-icon flex h-10 w-10 items-center justify-center rounded-xl transition-all">
                    {actionLoading === "call" ? (
                      <span className="inline-flex animate-spin">
                        <ButtonSpinner />
                      </span>
                    ) : (
                      <Phone className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#0F1C2E]">
                      {actionLoading === "call" ? "Calling..." : "Call Us Now"}
                    </p>
                    <p className="text-xs text-[#6B7A8D]">
                      {actionLoading === "call" ? "Connecting" : "Speak with our experts"}
                    </p>
                  </div>

                  <ChevronRight className="action-arrow h-4 w-4" />
                </button>
              </div>

              {/* ─── Footer ────────────────────────────────────────── */}
              <div className="border-t bg-[#F8FAFC] px-6 py-3" style={{ borderColor: THEME.border }}>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#C9A96E]" />
                    <span className="text-[10px] text-[#6B7A8D]">Secure</span>
                  </div>

                  <div className="h-4 w-px" style={{ backgroundColor: THEME.border }} />

                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#C9A96E]" />
                    <span className="text-[10px] text-[#6B7A8D]">24/7</span>
                  </div>

                  <div className="h-4 w-px" style={{ backgroundColor: THEME.border }} />

                  <div className="flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 text-[#C9A96E]" />
                    <span className="text-[10px] text-[#6B7A8D]">Trusted</span>
                  </div>
                </div>

                <p className="mt-1.5 text-center text-[9px] text-[#6B7A8D]/50">
                  Your conversation is secure and confidential
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}