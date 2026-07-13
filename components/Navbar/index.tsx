// components/Navbar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Search,
  Building2,
  Users,
  Mail,
  Home,
  Building,
  Landmark,
  Briefcase,
  MapPin,
  Map,
  User,
  LayoutDashboard,
  Heart,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  ChevronRight,
  Globe,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

// ════════════════════════════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════════════════════════════

const NAV_LINKS = [
  { name: 'BUY',      href: '/properties-for-sale-in-dubai'  },
  { name: 'RENT',     href: '/properties-for-rent-in-dubai'  },
  { name: 'SELL',     href: '/sell-your-property-in-dubai'   },
  { name: 'OFF PLAN', href: '/off-plan-properties-in-dubai'  },
  { name: 'JOURNAL',  href: '/blog'                          },
];

const SLIDE_LINKS = [
  {
    name: 'Properties For Sale',
    href: '/properties-for-sale-in-dubai',
    icon: Building2,
  },
  {
    name: 'Properties For Rent',
    href: '/properties-for-rent-in-dubai',
    icon: Home,
  },
  {
    name: 'Apartments For Sale',
    href: '/apartments-for-sale-in-dubai',
    icon: Building,
  },
  {
    name: 'Off Plan Properties',
    href: '/off-plan-properties-in-dubai',
    icon: Landmark,
  },
  {
    name: 'New Projects',
    href: '/new-projects-in-dubai',
    icon: Building,
  },
  {
    name: 'Luxury Properties',
    href: '/luxury-properties-in-dubai',
    icon: Landmark,
  },
  {
    name: 'International Properties',
    href: '/international-properties-for-sale',
    icon: Globe,
  },
  {
    name: 'Developers',
    href: '/developers',
    icon: Users,
  },
  {
    name: 'Neighborhood Guide',
    href: '/dubai-neighborhood-guide',
    icon: Map,
  },
  {
    name: 'Sell Your Property',
    href: '/sell-your-property-in-dubai',
    icon: MapPin,
  },
  {
    name: 'Seller Guide',
    href: '/seller-guide',
    icon: BookOpen,
  },
  {
    name: 'Journal',
    href: '/blog',
    icon: BookOpen,
  },
  {
    name: 'About Us',
    href: '/about-us',
    icon: Users,
  },
  {
    name: 'Careers',
    href: '/careers',
    icon: Briefcase,
  },
  {
    name: 'Contact Us',
    href: '/contact-us',
    icon: Mail,
  },
];

const ALLOWED_IMAGE_HOSTS = [
  'lh3.googleusercontent.com',
  'graph.facebook.com',
  'www.gravatar.com',
  'acasa.ae',
];

// ════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════

function isValidPhotoUrl(photo?: string | null): boolean {
  if (!photo) return false;
  try {
    const url = new URL(photo);
    return ALLOWED_IMAGE_HOSTS.includes(url.hostname);
  } catch {
    return photo.startsWith('/');
  }
}

function getUserRole(usertype?: string): string {
  switch (usertype) {
    case 'Admin':      return 'Administrator';
    case 'admin_user': return 'Admin User';
    case 'agents':     return 'Agent';
    default:           return 'Member';
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();
}

// ════════════════════════════════════════════════════════════════
//  LOADING SPINNER
// ════════════════════════════════════════════════════════════════

function LoadingSpinner() {
  return (
    <div className="navbar-loader">
      <div className="navbar-loader-ring" />
      <div className="navbar-loader-ring" />
      <div className="navbar-loader-ring" />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  AVATAR COMPONENT
// ════════════════════════════════════════════════════════════════

function UserAvatar({
  user,
  size = 'sm',
  onClick,
}: {
  user: {
    full_name?: string | null;
    name?: string;
    photo?: string | null;
    email?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  const dims     = size === 'lg' ? 'h-14 w-14' : size === 'md' ? 'h-10 w-10' : 'h-8 w-8';
  const imgSize  = size === 'lg' ? 56           : size === 'md' ? 40           : 32;
  const textSize = size === 'lg' ? 'text-lg'    : size === 'md' ? 'text-sm'    : 'text-xs';

  const displayName = user.full_name || user.name || user.email || 'U';
  const initials    = getInitials(displayName);
  const hasPhoto    = isValidPhotoUrl(user.photo) && !imgError;

  if (hasPhoto) {
    return (
      <button
        onClick={onClick}
        className={`${dims} relative overflow-hidden rounded-full border-2 border-[#C9A96E]/40 transition-all duration-300 hover:border-[#C9A96E] hover:shadow-[0_0_12px_rgba(201,169,110,0.3)]`}
      >
        <Image
          src={user.photo!}
          alt={displayName}
          fill
          className="object-cover"
          sizes={`${imgSize}px`}
          onError={() => setImgError(true)}
        />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${dims} flex items-center justify-center rounded-full border-2 border-[#C9A96E]/40 bg-gradient-to-br from-[#C9A96E]/20 to-[#C9A96E]/5 ${textSize} font-semibold text-[#C9A96E] transition-all duration-300 hover:border-[#C9A96E] hover:shadow-[0_0_12px_rgba(201,169,110,0.3)]`}
    >
      {initials}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════
//  USER DROPDOWN (Desktop)
// ════════════════════════════════════════════════════════════════

function UserDropdown() {
  const { user, isAuthenticated, hasAdminAccess, logout: handleLogout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef     = useRef<HTMLDivElement>(null);
  const router          = useRouter();
  const pathname        = usePathname();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open]);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onLogout = async () => {
    setOpen(false);
    await handleLogout();
    toast.success('Logged out successfully');
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="hidden items-center gap-2 lg:flex">
        <Link
          href="/login"
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/80 transition-all duration-300 hover:border-[#C9A96E]/60 hover:bg-[#C9A96E]/10 hover:text-[#C9A96E]"
        >
          <LogIn className="h-3.5 w-3.5" />
          Sign In
        </Link>
      </div>
    );
  }

  const displayName = user.full_name || user.name || 'User';
  const userRole    = getUserRole(user.usertype);

  const menuItems = [
    { label: 'My Profile',       icon: User,            href: '/profile'  },
    ...(hasAdminAccess
      ? [{ label: 'Dashboard',   icon: LayoutDashboard, href: '/admin'    }]
      : []),
    { label: 'Saved Properties', icon: Heart,           href: '/saved'    },
    { label: 'Settings',         icon: Settings,        href: '/settings' },
  ];

  return (
    <div ref={dropdownRef} className="relative hidden lg:block">
      <div className="relative">
        <UserAvatar user={user} size="sm" onClick={() => setOpen(!open)} />
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0F1C2E] bg-emerald-400" />
      </div>

      <div
        className={`absolute right-0 top-[calc(100%+12px)] w-[280px] overflow-hidden rounded-2xl border border-white/10 bg-[#0F1C2E] shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-all duration-300 ${
          open
            ? 'visible translate-y-0 opacity-100'
            : 'invisible -translate-y-2 opacity-0'
        }`}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#C9A96E]/10 blur-[50px]" />

        <div className="relative border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <UserAvatar user={user} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-white/40">{user.email}</p>
              <span className="mt-1 inline-flex items-center rounded-full bg-[#C9A96E]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#C9A96E]">
                {userRole}
              </span>
            </div>
          </div>
        </div>

        <div className="p-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.href)}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 hover:bg-white/[0.05]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/50 transition-all duration-200 group-hover:border-[#C9A96E]/40 group-hover:bg-[#C9A96E]/10 group-hover:text-[#C9A96E]">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="text-[13px] font-medium text-white/70 transition-colors group-hover:text-white">
                {item.label}
              </span>
              <ChevronRight className="ml-auto h-3.5 w-3.5 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-white/40" />
            </button>
          ))}
        </div>

        <div className="border-t border-white/10 p-2">
          <button
            onClick={onLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-red-500/10"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/50 transition-all duration-200 group-hover:border-red-500/40 group-hover:bg-red-500/10 group-hover:text-red-400">
              <LogOut className="h-4 w-4" />
            </span>
            <span className="text-[13px] font-medium text-white/70 transition-colors group-hover:text-red-400">
              Sign Out
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  HAMBURGER
// ════════════════════════════════════════════════════════════════

function Hamburger({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white transition-all duration-300 hover:border-[#C9A96E]/60 hover:bg-[#C9A96E]/10 hover:text-[#C9A96E] lg:hidden"
      aria-label="Toggle menu"
    >
      <div className="relative h-5 w-5">
        <span
          className={`absolute left-0 top-1/2 h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${
            isOpen ? 'top-1/2 rotate-45' : '-translate-y-2'
          }`}
        />
        <span
          className={`absolute left-0 top-1/2 h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${
            isOpen ? 'opacity-0' : 'opacity-100'
          }`}
        />
        <span
          className={`absolute left-0 top-1/2 h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${
            isOpen ? 'top-1/2 -rotate-45' : 'translate-y-2'
          }`}
        />
      </div>
    </button>
  );
}

// ════════════════════════════════════════════════════════════════
//  SLIDE PANEL (Mobile)
// ════════════════════════════════════════════════════════════════

function SlidePanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, isAuthenticated, hasAdminAccess, logout: handleLogout } = useAuth();
  const [loadingHref, setLoadingHref] = useState<string | null>(null);

  const isActive = useCallback(
    (href: string) => {
      if (!pathname) return false;
      if (href === '/') return pathname === '/';
      return pathname === href || pathname.startsWith(href + '/');
    },
    [pathname]
  );

  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      setLoadingHref(href);
      setTimeout(() => {
        router.push(href);
        onClose();
      }, 400);
    },
    [router, onClose]
  );

  const onLogout = async () => {
    onClose();
    await handleLogout();
    toast.success('Logged out successfully');
  };

  const displayName = user?.full_name || user?.name || 'User';
  const userRole    = getUserRole(user?.usertype);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-[6px] transition-opacity duration-500 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[390px] max-w-[88vw] overflow-hidden bg-[#0F1C2E] shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#C9A96E]/10 blur-[90px]" />
          <div className="absolute -right-28 bottom-20 h-80 w-80 rounded-full bg-[#5B7FBF]/10 blur-[100px]" />
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-[#C9A96E]/35 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A96E]/60 to-transparent" />
        </div>

        <div className="relative flex h-full flex-col">
          {/* ── Header ────────────────────────────────────────── */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setLoadingHref('/');
                setTimeout(() => {
                  router.push('/');
                  onClose();
                }, 400);
              }}
              className="inline-flex w-fit transition-opacity hover:opacity-80"
            >
              <Image
                src="/acasa.png"
                alt="ACASA"
                width={112}
                height={34}
                className="h-8 w-auto brightness-0 invert"
                priority
              />
            </Link>

            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition-all duration-300 hover:border-[#C9A96E]/60 hover:bg-[#C9A96E] hover:text-[#0F1C2E]"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ── User Section (Mobile) ─────────────────────────── */}
          {isAuthenticated && user ? (
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <UserAvatar user={user} size="md" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0F1C2E] bg-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {displayName}
                  </p>
                  <p className="truncate text-[11px] text-white/40">
                    {user.email}
                  </p>
                </div>
                <span className="flex-shrink-0 rounded-full bg-[#C9A96E]/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#C9A96E]">
                  {userRole}
                </span>
              </div>

              {/* Quick Actions Grid */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: 'Profile',   icon: User,            href: '/profile'  },
                  ...(hasAdminAccess
                    ? [{ label: 'Dashboard', icon: LayoutDashboard, href: '/admin' }]
                    : [{ label: 'Saved',     icon: Heart,           href: '/saved' }]),
                  { label: 'Settings',  icon: Settings,        href: '/settings' },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => handleLinkClick(e, item.href)}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-3 text-white/50 transition-all duration-200 hover:border-[#C9A96E]/40 hover:bg-[#C9A96E]/10 hover:text-[#C9A96E]"
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider">
                      {item.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-b border-white/10 px-6 py-5">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">
                Welcome to ACASA
              </p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="/login"
                  onClick={(e) => handleLinkClick(e, '/login')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#C9A96E]/40 bg-[#C9A96E]/10 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#C9A96E] transition-all hover:bg-[#C9A96E]/20"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </a>
                <a
                  href="/register"
                  onClick={(e) => handleLinkClick(e, '/register')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/60 transition-all hover:border-white/20 hover:text-white"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Register
                </a>
              </div>
            </div>
          )}

          {/* ── Navigation Links ──────────────────────────────── */}
          <div className="px-4 pb-2 pt-4">
            <p className="px-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#C9A96E]/80">
              Explore
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-1">
              {SLIDE_LINKS.map((link, index) => {
                const active    = isActive(link.href);
                const Icon      = link.icon;
                const isLoading = loadingHref === link.href;

                return (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl px-4 py-3 transition-all duration-300 ${
                      active && !isLoading
                        ? 'bg-[#C9A96E] text-[#0F1C2E] shadow-[0_12px_30px_rgba(201,169,110,0.18)]'
                        : isLoading
                        ? 'cursor-wait bg-[#C9A96E] text-[#0F1C2E] shadow-[0_12px_30px_rgba(201,169,110,0.18)]'
                        : 'text-white/62 hover:bg-white/[0.05] hover:text-white'
                    }`}
                    style={{ transitionDelay: isOpen ? `${index * 25}ms` : '0ms' }}
                  >
                    {!active && !isLoading && (
                      <span className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-[#C9A96E]/15 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
                    )}

                    <span
                      className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300 ${
                        active || isLoading
                          ? 'border-[#0F1C2E]/15 bg-[#0F1C2E]/10'
                          : 'border-white/10 bg-white/[0.035] text-[#C9A96E] group-hover:border-[#C9A96E]/40 group-hover:bg-[#C9A96E]/10'
                      }`}
                    >
                      {isLoading ? <LoadingSpinner /> : <Icon className="h-4 w-4" />}
                    </span>

                    <span className="relative z-10 text-[13px] font-medium tracking-wide">
                      {isLoading ? (
                        <span className="opacity-50">{link.name}</span>
                      ) : (
                        link.name
                      )}
                    </span>

                    <span
                      className={`relative z-10 ml-auto h-[2px] rounded-full transition-all duration-300 ${
                        active || isLoading
                          ? 'w-6 bg-[#0F1C2E]'
                          : 'w-0 bg-[#C9A96E] group-hover:w-6'
                      }`}
                    />
                  </a>
                );
              })}
            </div>
          </div>

          {/* ── Footer ────────────────────────────────────────── */}
          <div className="border-t border-white/10 p-5">
            {isAuthenticated && user && (
              <button
                onClick={onLogout}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-red-400 transition-all hover:border-red-500/40 hover:bg-red-500/10"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            )}

            <a
              href="/contact-us"
              onClick={(e) => handleLinkClick(e, '/contact-us')}
              className="nav-golden-cta mb-4 inline-flex w-full items-center justify-center overflow-hidden px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white"
            >
              <span>Contact Us</span>
            </a>

            <p className="text-center text-[10px] text-white/35">
              © {new Date().getFullYear()} ACASA. All rights reserved.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
//  MAIN NAVBAR
// ════════════════════════════════════════════════════════════════

export default function Navbar() {
  const [isOpen, setIsOpen]           = useState(false);
  const [loadingHref, setLoadingHref] = useState<string | null>(null);
  const pathname                      = usePathname();
  const router                        = useRouter();
  const { user, isAuthenticated }     = useAuth();

  useEffect(() => {
    setIsOpen(false);
    setLoadingHref(null);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [isOpen]);

  const isActive = useCallback(
    (href: string) => {
      if (!pathname) return false;
      if (href === '/') return pathname === '/';
      return pathname === href || pathname.startsWith(href + '/');
    },
    [pathname]
  );

  const handleNavLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      setLoadingHref(href);
      setTimeout(() => router.push(href), 400);
    },
    [router]
  );

  const handleLogoClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setLoadingHref('/');
      setTimeout(() => router.push('/'), 400);
    },
    [router]
  );

  const linkColorClasses = 'text-white/80 hover:text-[#C9A96E] active:text-[#C9A96E]';
  const buttonBgClasses  =
    'border-white/10 bg-white/[0.03] text-white/80 hover:border-[#C9A96E]/60 hover:bg-[#C9A96E]/10 hover:text-[#C9A96E]';

  return (
    <>
      <style jsx global>{`
        .navbar-loader {
          display: inline-flex;
          gap: 3px;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
        }
        .navbar-loader-ring {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: currentColor;
          animation: navbarLoaderBounce 1.2s ease-in-out infinite;
        }
        .navbar-loader-ring:nth-child(2) { animation-delay: 0.2s; }
        .navbar-loader-ring:nth-child(3) { animation-delay: 0.4s; }
        @keyframes navbarLoaderBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.2); opacity: 1;   }
        }
        .nav-golden-cta {
          position: relative;
          border: 1px solid rgba(201, 169, 110, 0.55);
          background: transparent;
          transition: all 0.45s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03),
                      0 4px 18px rgba(0,0,0,0.12);
        }
        .nav-golden-cta::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          background: linear-gradient(90deg, #c9a96e 0%, #d4b888 50%, #c9a96e 100%);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-golden-cta::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.25),
            transparent
          );
          transform: translateX(-120%);
          transition: transform 0.7s ease;
        }
        .nav-golden-cta:hover::before { transform: scaleX(1); }
        .nav-golden-cta:hover::after  { transform: translateX(120%); }
        .nav-golden-cta:hover {
          color: #0F1C2E;
          border-color: #c9a96e;
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(201,169,110,0.2),
                      0 4px 16px rgba(0,0,0,0.18);
        }
        .nav-golden-cta span,
        .nav-golden-cta .navbar-loader  { position: relative; z-index: 1; }
        .nav-golden-cta .navbar-loader-ring { background: #0F1C2E; }
        .nav-link-underline { position: relative; }
        .nav-link-underline::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1.5px;
          background: #C9A96E;
          transition: width 0.3s ease;
        }
        .nav-link-underline:hover::after,
        .nav-link-underline.active::after { width: 100%; }
        .nav-link-underline.active        { color: #C9A96E; }
      `}</style>

      <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-[#0F1C2E] shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all duration-500">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <div className="flex h-[72px] items-center justify-between">

            {/* ── Left ────────────────────────────────────────── */}
            <div className="flex flex-1 items-center">
              <button
                onClick={() => setIsOpen(true)}
                className="group hidden items-center gap-3 text-white transition-all duration-300 hover:text-[#C9A96E] lg:flex"
                aria-label="Open menu"
              >
                <div className="relative h-5 w-5">
                  <span className="absolute left-0 top-1 h-[2px] w-5 rounded-full bg-current" />
                  <span className="absolute left-0 top-1/2 h-[2px] w-3 rounded-full bg-current transition-all duration-300 group-hover:w-5" />
                  <span className="absolute bottom-1 left-0 h-[2px] w-5 rounded-full bg-current" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.22em]">
                  Menu
                </span>
              </button>

              {/* Mobile logo */}
              <Link href="/" className="inline-flex lg:hidden" onClick={handleLogoClick}>
                <Image
                  src="/acasa.png"
                  alt="ACASA"
                  width={88}
                  height={26}
                  className="h-6 w-auto brightness-0 invert"
                  priority
                />
              </Link>
            </div>

            {/* ── Center Logo ─────────────────────────────────── */}
            <div className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
              <Link
                href="/"
                className="inline-flex transition-opacity hover:opacity-85"
                onClick={handleLogoClick}
              >
                {loadingHref === '/' ? (
                  <div className="flex items-center gap-3">
                    <Image
                      src="/acasa.png"
                      alt="ACASA"
                      width={124}
                      height={38}
                      className="h-9 w-auto brightness-0 invert"
                      priority
                    />
                    <LoadingSpinner />
                  </div>
                ) : (
                  <Image
                    src="/acasa.png"
                    alt="ACASA"
                    width={124}
                    height={38}
                    className="h-9 w-auto brightness-0 invert"
                    priority
                  />
                )}
              </Link>
            </div>

            {/* ── Right ───────────────────────────────────────── */}
            <div className="flex flex-1 items-center justify-end gap-3 md:gap-5">
              {/* Desktop Nav Links */}
              <nav className="hidden items-center gap-7 lg:flex">
                {NAV_LINKS.map((link) => {
                  const active    = isActive(link.href);
                  const isLoading = loadingHref === link.href;

                  return (
                    <a
                      key={link.name}
                      href={link.href}
                      onClick={(e) => handleNavLinkClick(e, link.href)}
                      className={`${linkColorClasses} nav-link-underline ${
                        active ? 'active' : ''
                      } group relative py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors duration-300 ${
                        isLoading ? 'cursor-wait opacity-50' : ''
                      }`}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="opacity-50">{link.name}</span>
                          <LoadingSpinner />
                        </span>
                      ) : (
                        link.name
                      )}
                    </a>
                  );
                })}
              </nav>

              {/* Search */}
              <button
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${buttonBgClasses}`}
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Desktop User Dropdown */}
              <UserDropdown />

              {/* Mobile: Avatar or Login icon */}
              {isAuthenticated && user ? (
                <div className="relative lg:hidden">
                  <UserAvatar
                    user={user}
                    size="sm"
                    onClick={() => setIsOpen(true)}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-[1.5px] border-[#0F1C2E] bg-emerald-400" />
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition-all duration-300 hover:border-[#C9A96E]/60 hover:bg-[#C9A96E]/10 hover:text-[#C9A96E] lg:hidden"
                >
                  <User className="h-4 w-4" />
                </Link>
              )}

              {/* Hamburger */}
              <Hamburger isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
            </div>
          </div>
        </div>
      </header>

      {/* Slide Panel */}
      <SlidePanel isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Spacer */}
      <div className="h-[72px]" />
    </>
  );
}