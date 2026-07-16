"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  PinterestIcon,
  InstagramIcon,
  YouTubeIcon,
  LinkedInIcon,
} from "@/components/icon/footerIcon";

type LinkItem = {
  label: string;
  href: string;
};

type SocialLink = {
  Icon: ComponentType;
  href: string;
  label: string;
};

const EXPLORE_LINKS: LinkItem[] = [
  { label: "Properties For Sale", href: "/properties-for-sale-dubai" },
  { label: "Properties For Rent", href: "/properties-for-rent-dubai" },
  { label: "Apartments For Sale", href: "/apartments-for-sale-in-dubai" },
  { label: "Off Plan Properties", href: "/off-plan-properties-in-dubai" },
  { label: "New Projects", href: "/new-projects-in-dubai" },
  { label: "Developers", href: "/developers" },
  { label: "Neighborhood Guide", href: "/neighborhood-guide" },
];

const COMPANY_LINKS: LinkItem[] = [
  { label: "About Us", href: "/about-us" },
  { label: "Sell Your Property", href: "/sell-your-property-in-dubai" },
  { label: "Seller's Guide", href: "/seller-guide" },
  { label: "Journal", href: "/blog" },
  { label: "Archive Properties", href: "/archive-properties" },
  { label: "Archive Projects", href: "/archive-projects" },
  { label: "Careers", href: "/careers" },
  { label: "Contact Us", href: "/contact-us" },
];

const BOTTOM_LINKS: LinkItem[] = [
  { label: "Journal", href: "/blog" },
  { label: "Reviews", href: "/reviews" },
  { label: "Press", href: "/press" },
  { label: "FAQ's", href: "/faqs" },
];

const SOCIAL_LINKS: SocialLink[] = [
  { Icon: LinkedInIcon, href: "https://linkedin.com", label: "LinkedIn" },
  { Icon: YouTubeIcon, href: "https://youtube.com", label: "YouTube" },
  { Icon: InstagramIcon, href: "https://instagram.com", label: "Instagram" },
  { Icon: PinterestIcon, href: "https://pinterest.com", label: "Pinterest" },
];

const LoadingSpinner = () => (
  <div className="footer-loader">
    <div className="footer-loader-ring"></div>
    <div className="footer-loader-ring"></div>
    <div className="footer-loader-ring"></div>
  </div>
);

const FooterTextLink = ({ href, label }: LinkItem) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push(href);
    }, 600);
  };

  return (
    <div className="footer-link-wrapper">
      <Link
        href={href}
        className={`footer-link ${isLoading ? "footer-link-loading" : ""}`}
        onClick={handleClick}
      >
        {isLoading ? (
          <>
            <span className="footer-link-text-loading">{label}</span>
            <LoadingSpinner />
          </>
        ) : (
          label
        )}
      </Link>
    </div>
  );
};

const FooterBottomLink = ({ href, label }: LinkItem) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push(href);
    }, 600);
  };

  return (
    <Link
      href={href}
      className={`footer-bottom-link ${isLoading ? "footer-bottom-link-loading" : ""}`}
      onClick={handleClick}
    >
      {isLoading ? (
        <>
          <span className="footer-link-text-loading">{label}</span>
          <LoadingSpinner />
        </>
      ) : (
        label
      )}
    </Link>
  );
};

const FooterLogo = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push("/");
    }, 600);
  };

  return (
    <Link href="/" className="inline-block w-fit" onClick={handleClick}>
      {isLoading ? (
        <div className="flex items-center gap-3">
          <Image
            src="/acasa.png"
            alt="Acasa"
            width={192}
            height={48}
            priority
            className="h-auto w-auto opacity-50"
            style={{ maxWidth: "192px", maxHeight: "48px" }}
          />
          <LoadingSpinner />
        </div>
      ) : (
        <Image
          src="/acasa.png"
          alt="Acasa"
          width={192}
          height={48}
          priority
          className="h-auto w-auto"
          style={{ maxWidth: "192px", maxHeight: "48px" }}
        />
      )}
    </Link>
  );
};

const SocialIcon = ({ Icon, href, label }: SocialLink) => {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
      className="footer-social"
    >
      <Icon />
    </a>
  );
};

const NewsletterForm = ({ className = "" }: { className?: string }) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    setMessage("");

    setTimeout(() => {
      setMessage("Thank you for subscribing!");
      setEmail("");
      setIsSubmitting(false);
      setTimeout(() => setMessage(""), 3000);
    }, 800);
  };

  return (
    <div className={className}>
      <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.24em] text-[#C8AA78]/80">
        Stay Updated and Join the List
      </p>

      <form
        onSubmit={handleSubmit}
        className="newsletter-form flex flex-col gap-4 border-b border-white/15 pb-4 sm:flex-row sm:items-center sm:gap-3"
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-w-0 flex-1 bg-transparent py-1 text-[13px] text-white placeholder:text-white/35 outline-none"
          required
          aria-label="Email"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="footer-subscribe-btn inline-flex shrink-0 items-center justify-center gap-2 px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.2em] disabled:cursor-wait"
        >
          {isSubmitting && <span className="footer-subscribe-shimmer" />}

          <span className="footer-subscribe-text">
            {isSubmitting ? "Subscribing" : "Subscribe"}
          </span>

          <span className="footer-subscribe-icon">
            {isSubmitting ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
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
            ) : (
              "→"
            )}
          </span>
        </button>
      </form>

      {message && (
        <p className="mt-3 text-[10px] font-medium tracking-wide text-[#C8AA78]">
          {message}
        </p>
      )}
    </div>
  );
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#0D1520] text-white">
      <style jsx global>{`
        .footer-link-wrapper {
          display: inline-block;
        }

        .footer-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          color: rgba(255, 255, 255, 0.64);
          transition: color 0.3s ease, transform 0.3s ease;
        }

        .footer-link::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -3px;
          width: 0;
          height: 1px;
          background: #c8aa78;
          transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .footer-link:hover {
          color: #c8aa78;
          transform: translateX(3px);
        }

        .footer-link:hover::after {
          width: 100%;
        }

        .footer-link-loading {
          color: #c8aa78 !important;
          cursor: wait;
        }

        .footer-link-loading::after {
          width: 100% !important;
        }

        .footer-link-text-loading {
          opacity: 0.5;
        }

        .footer-bottom-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: rgba(255, 255, 255, 0.35);
          transition: color 0.3s ease;
        }

        .footer-bottom-link:hover {
          color: #c8aa78;
        }

        .footer-bottom-link-loading {
          color: #c8aa78 !important;
          cursor: wait;
        }

        .footer-loader {
          display: inline-flex;
          gap: 3px;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
        }

        .footer-loader-ring {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #c8aa78;
          animation: footerLoaderBounce 1.2s ease-in-out infinite;
        }

        .footer-loader-ring:nth-child(2) {
          animation-delay: 0.2s;
        }
        .footer-loader-ring:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes footerLoaderBounce {
          0%,
          80%,
          100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        .footer-social {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #c8aa78;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .footer-social:hover {
          color: #ffffff;
          transform: translateY(-2px);
          filter: drop-shadow(0 8px 18px rgba(200, 170, 120, 0.28));
        }

        .newsletter-form:focus-within {
          border-color: rgba(200, 170, 120, 0.55);
        }

        .footer-subscribe-btn {
          position: relative;
          overflow: hidden;
          color: #ffffff;
          border: 1px solid rgba(200, 170, 120, 0.58);
          background: transparent;
          transition: all 0.45s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.035),
            0 4px 18px rgba(0, 0, 0, 0.14);
        }

        .footer-subscribe-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          background: linear-gradient(90deg, #c8aa78 0%, #d4b888 50%, #c8aa78 100%);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .footer-subscribe-btn::after {
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

        .footer-subscribe-btn:hover::before {
          transform: scaleX(1);
        }
        .footer-subscribe-btn:hover::after {
          transform: translateX(120%);
        }

        .footer-subscribe-btn:hover {
          color: #192334;
          border-color: #c8aa78;
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(200, 170, 120, 0.2),
            0 4px 16px rgba(0, 0, 0, 0.18);
        }

        .footer-subscribe-btn:disabled {
          border-color: rgba(200, 170, 120, 0.72);
          color: #ffffff;
          opacity: 1;
          transform: translateY(0);
        }

        .footer-subscribe-text,
        .footer-subscribe-icon {
          position: relative;
          z-index: 2;
          transition: color 0.3s ease;
        }

        .footer-subscribe-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }

        .footer-subscribe-btn:hover .footer-subscribe-icon {
          transform: translateX(4px);
        }

        .footer-subscribe-btn:disabled .footer-subscribe-icon {
          animation: footerSpin 0.9s linear infinite;
          transform: none;
        }

        .footer-subscribe-shimmer {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(200, 170, 120, 0.35),
            transparent
          );
          animation: footerShimmer 1.2s linear infinite;
        }

        @keyframes footerSpin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes footerShimmer {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(120%);
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#C8AA78]/[0.07] blur-[100px]" />
        <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-[#5B7FBF]/[0.06] blur-[110px]" />
        <div className="absolute bottom-0 left-1/2 h-64 w-[620px] -translate-x-1/2 rounded-full bg-[#C8AA78]/[0.035] blur-[110px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C8AA78]/45 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-16">
        <div className="py-10 lg:hidden">
          <div className="mb-10">
            <FooterLogo />
          </div>

          <div className="mb-10">
            <NewsletterForm />
          </div>

          <div className="mb-10 grid grid-cols-2 gap-8">
            <div>
              <h4 className="mb-4 text-[10px] font-medium uppercase tracking-[0.24em] text-[#C8AA78]">
                Explore
              </h4>
              <ul className="space-y-2.5 text-[12px]">
                {EXPLORE_LINKS.map((link) => (
                  <li key={link.label}>
                    <FooterTextLink href={link.href} label={link.label} />
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-[10px] font-medium uppercase tracking-[0.24em] text-[#C8AA78]">
                Company
              </h4>
              <ul className="space-y-2.5 text-[12px]">
                {COMPANY_LINKS.map((link) => (
                  <li key={link.label}>
                    <FooterTextLink href={link.href} label={link.label} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mb-5 border-t border-white/10 pt-5">
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[10px]">
              {BOTTOM_LINKS.map((link) => (
                <div key={link.label}>
                  <FooterBottomLink href={link.href} label={link.label} />
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6 text-[10px]">
            <FooterBottomLink href="/privacy-policy" label="Privacy Policy" />
          </div>

          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map((social) => (
              <SocialIcon key={social.label} {...social} />
            ))}
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="grid grid-cols-[1.4fr_1fr] gap-12 py-16">
            <div className="flex flex-col justify-between gap-16">
              <div>
                <FooterLogo />
              </div>
              <div>
                <NewsletterForm className="max-w-[520px]" />
              </div>
            </div>

            <div className="ml-auto grid grid-cols-2 gap-16">
              <div>
                <h4 className="mb-5 text-[10px] font-medium uppercase tracking-[0.24em] text-[#C8AA78]">
                  Explore
                </h4>
                <ul className="space-y-3 text-[12px]">
                  {EXPLORE_LINKS.map((link) => (
                    <li key={link.label}>
                      <FooterTextLink href={link.href} label={link.label} />
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-5 text-[10px] font-medium uppercase tracking-[0.24em] text-[#C8AA78]">
                  Company
                </h4>
                <ul className="space-y-3 text-[12px]">
                  {COMPANY_LINKS.map((link) => (
                    <li key={link.label}>
                      <FooterTextLink href={link.href} label={link.label} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-5 border-t border-white/10 py-6">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px]">
              {BOTTOM_LINKS.map((link) => (
                <div key={link.label}>
                  <FooterBottomLink href={link.href} label={link.label} />
                </div>
              ))}
              <div>
                <FooterBottomLink href="/privacy-policy" label="Privacy Policy" />
              </div>
            </div>

            <div className="flex items-center gap-5">
              {SOCIAL_LINKS.map((social) => (
                <SocialIcon key={social.label} {...social} />
              ))}
            </div>
          </div>

          <div className="py-4 text-center text-[10px] text-white/30">
            {currentYear} Acasa. All rights reserved.
          </div>
        </div>

        <div className="mt-6 pb-6 text-center text-[9px] text-white/30 lg:hidden">
          {currentYear} Acasa. All rights reserved.
        </div>
      </div>
    </footer>
  );
}