"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
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
  Compass,
  Sparkles,
  Phone,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

interface NavLink {
  name: string;
  href: string;
}

interface SlideLink {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface UserData {
  full_name?: string | null;
  name?: string;
  photo?: string | null;
  email?: string;
  usertype?: string;
}

const NAV_LINKS: NavLink[] = [
  { name: "BUY", href: "/properties-for-sale-dubai" },
  { name: "SELL", href: "/sell-your-property-in-dubai" },
  { name: "OFF PLAN", href: "/off-plan-properties-in-dubai" },
  { name: "JOURNAL", href: "/blog" },
];

const SLIDE_LINKS: SlideLink[] = [
  { name: "Properties For Sale", href: "/properties-for-sale-dubai", icon: Building2 },
  { name: "Properties For Rent", href: "/properties-for-rent-dubai", icon: Home },
  { name: "Apartments For Sale", href: "/apartments-for-sale-in-dubai", icon: Building },
  { name: "Off Plan Properties", href: "/off-plan-properties-in-dubai", icon: Landmark, badge: "Popular" },
  { name: "New Projects", href: "/new-projects-in-dubai", icon: Building, badge: "New" },
  { name: "Developers", href: "/developers", icon: Users },
  { name: "Neighborhood Guide", href: "/neighborhood-guide", icon: Compass },
  { name: "Sell Your Property", href: "/sell-your-property-in-dubai", icon: MapPin },
  { name: "Seller Guide", href: "/seller-guide", icon: BookOpen },
  { name: "Journal", href: "/blog", icon: BookOpen },
  { name: "About Us", href: "/about-us", icon: Users },
  { name: "Careers", href: "/careers", icon: Briefcase },
  { name: "Contact Us", href: "/contact-us", icon: Mail },
];

const ALLOWED_IMAGE_HOSTS = [
  "lh3.googleusercontent.com",
  "graph.facebook.com",
  "www.gravatar.com",
  "acasa.ae",
];

function isValidPhotoUrl(photo: string | null | undefined): boolean {
  if (!photo) return false;
  try {
    const url = new URL(photo);
    return ALLOWED_IMAGE_HOSTS.includes(url.hostname);
  } catch {
    return photo.startsWith("/");
  }
}

function getUserRole(usertype: string | undefined): string {
  switch (usertype) {
    case "Admin": return "Administrator";
    case "admin_user": return "Admin User";
    case "agents": return "Agent";
    default: return "Member";
  }
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
}

function UserAvatar({ user, size = "sm", onClick }: { user: UserData; size?: "sm" | "md"; onClick?: () => void }) {
  const [imgError, setImgError] = useState(false);
  const isSmall = size === "sm";
  const dims = isSmall ? "h-8 w-8" : "h-11 w-11";
  const textSize = isSmall ? "text-[10px]" : "text-xs";
  const displayName = user.full_name || user.name || user.email || "U";
  const initials = getInitials(displayName);
  const hasPhoto = isValidPhotoUrl(user.photo) && !imgError;

  return (
    <button
      onClick={onClick}
      className={`${dims} relative flex items-center justify-center overflow-hidden rounded-full ring-2 ring-[#C9A96E]/30 ring-offset-2 ring-offset-[#0a1628]`}
    >
      {hasPhoto ? (
        <Image
          src={user.photo!}
          alt={displayName}
          fill
          className="object-cover"
          sizes={isSmall ? "32px" : "44px"}
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={`${textSize} flex h-full w-full items-center justify-center bg-gradient-to-br from-[#C9A96E] to-[#a88a4e] font-bold text-[#0a1628]`}>
          {initials}
        </span>
      )}
    </button>
  );
}

function UserDropdown() {
  const { user, isAuthenticated, hasAdminAccess, logout: handleLogout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open]);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onLogout = async () => {
    setOpen(false);
    await handleLogout();
    toast.success("Logged out successfully");
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="hidden items-center gap-3 lg:flex">
        <Link
          href="/login"
          className="flex items-center gap-2 rounded-full border border-[#C9A96E]/40 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A96E] hover:bg-[#C9A96E] hover:text-[#0a1628] transition-colors duration-300"
        >
          <LogIn className="h-3.5 w-3.5" />
          Sign In
        </Link>
      </div>
    );
  }

  const displayName = user.full_name || user.name || "User";
  const userRole = getUserRole(user.usertype);

  const menuItems = [
    { label: "My Profile", icon: User, href: "/profile" },
    ...(hasAdminAccess ? [{ label: "Dashboard", icon: LayoutDashboard, href: "/admin" }] : []),
    { label: "Saved Properties", icon: Heart, href: "/saved" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ];

  return (
    <div ref={ref} className="relative hidden lg:block">
      <div className="relative">
        <UserAvatar user={user} size="sm" onClick={() => setOpen(!open)} />
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a1628] bg-emerald-400" />
      </div>

      {open && (
        <div className="absolute right-0 top-[calc(100%+12px)] w-[280px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a1628] shadow-2xl">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center gap-3">
              <UserAvatar user={user} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                <p className="truncate text-[11px] text-white/30">{user.email}</p>
                <span className="mt-1.5 inline-block rounded-full bg-[#C9A96E]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#C9A96E]">
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
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-[13px] text-white/60 hover:bg-white/5 hover:text-white transition-colors"
              >
                <item.icon className="h-4 w-4 text-white/30" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="border-t border-white/10 p-2">
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SlidePanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, hasAdminAccess, logout: handleLogout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const isActive = useCallback(
    (href: string) => {
      if (!pathname) return false;
      if (href === "/") return pathname === "/";
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname]
  );

  const handleLinkClick = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
    },
    [router, onClose]
  );

  const onLogout = async () => {
    onClose();
    await handleLogout();
    toast.success("Logged out successfully");
  };

  const displayName = user?.full_name || user?.name || "User";
  const userRole = getUserRole(user?.usertype);

  const filteredLinks = searchQuery
    ? SLIDE_LINKS.filter((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : SLIDE_LINKS;

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) setSearchQuery("");
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70" onClick={onClose} />
      )}

      <aside
        className={`fixed left-0 top-0 z-[70] flex h-full w-[380px] max-w-[90vw] flex-col bg-[#0a1628] border-r border-white/10 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <Link href="/" onClick={() => handleLinkClick("/")}>
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
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/50 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isAuthenticated && user ? (
          <div className="mx-5 my-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <UserAvatar user={user} size="md" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a1628] bg-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                <p className="truncate text-[11px] text-white/30">{user.email}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#C9A96E]/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#C9A96E]">
                {userRole}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Profile", icon: User, href: "/profile" },
                ...(hasAdminAccess
                  ? [{ label: "Dashboard", icon: LayoutDashboard, href: "/admin" }]
                  : [{ label: "Saved", icon: Heart, href: "/saved" }]),
                { label: "Settings", icon: Settings, href: "/settings" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleLinkClick(item.href)}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] py-2.5 text-white/40 hover:border-[#C9A96E]/30 hover:text-[#C9A96E] transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-[8px] font-bold uppercase tracking-wider">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-5 my-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="mb-3 text-[11px] text-white/30">
              Sign in to save properties and get personalized recommendations.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleLinkClick("/login")}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#C9A96E] py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#0a1628]"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </button>
              <button
                onClick={() => handleLinkClick("/register")}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Register
              </button>
            </div>
          </div>
        )}

        <div className="mx-5 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-[13px] text-white/80 placeholder-white/25 outline-none focus:border-[#C9A96E]/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div className="px-6 pb-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#C9A96E]/50">
            {searchQuery ? `Results (${filteredLinks.length})` : "Explore"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {filteredLinks.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;

            return (
              <button
                key={link.name}
                onClick={() => handleLinkClick(link.href)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-colors ${
                  active
                    ? "bg-[#C9A96E] text-[#0a1628]"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  active ? "bg-[#0a1628]/10" : "bg-white/[0.04]"
                }`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-[13px] font-medium">{link.name}</span>
                {link.badge && !active && (
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase ${
                    link.badge === "New"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-[#C9A96E]/10 text-[#C9A96E]"
                  }`}>
                    {link.badge}
                  </span>
                )}
                <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${active ? "text-[#0a1628]/40" : "text-white/15"}`} />
              </button>
            );
          })}

          {filteredLinks.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <Search className="mb-3 h-8 w-8 text-white/15" />
              <p className="text-sm text-white/30">No results found</p>
              <p className="mt-1 text-[11px] text-white/20">Try a different search term</p>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-5">
          {isAuthenticated && user && (
            <button
              onClick={onLogout}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 py-2.5 text-[10px] font-bold uppercase tracking-wider text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          )}

          <button
            onClick={() => handleLinkClick("/contact-us")}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#C9A96E]/50 bg-[#C9A96E]/10 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A96E] hover:bg-[#C9A96E] hover:text-[#0a1628] transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />
            Get In Touch
          </button>

          <p className="text-center text-[10px] text-white/20">
            © {new Date().getFullYear()} ACASA
          </p>
        </div>
      </aside>
    </>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => setIsOpen(false), [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  const isActive = useCallback(
    (href: string) => {
      if (!pathname) return false;
      if (href === "/") return pathname === "/";
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname]
  );

  return (
    <>
      <header className="fixed left-0 top-0 z-50 w-full bg-[#0a1628] border-b border-white/10">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <div className="flex h-16 items-center justify-between lg:h-[72px]">

            <div className="flex w-full items-center justify-between lg:hidden">
              <Link href="/">
                <Image
                  src="/acasa.png"
                  alt="ACASA"
                  width={88}
                  height={26}
                  className="h-6 w-auto brightness-0 invert"
                  priority
                />
              </Link>

              <div className="flex items-center gap-2">
                {isAuthenticated && user ? (
                  <div className="relative">
                    <UserAvatar user={user} size="sm" onClick={() => setIsOpen(true)} />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a1628] bg-emerald-400" />
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:text-white transition-colors"
                    aria-label="Sign In"
                  >
                    <User className="h-4 w-4" />
                  </Link>
                )}

                <button
                  onClick={() => setIsOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:text-white transition-colors"
                  aria-label="Open menu"
                >
                  <div className="flex flex-col gap-[5px]">
                    <span className="h-[1.5px] w-4 rounded-full bg-current" />
                    <span className="h-[1.5px] w-4 rounded-full bg-current" />
                    <span className="h-[1.5px] w-4 rounded-full bg-current" />
                  </div>
                </button>
              </div>
            </div>

            <div className="hidden flex-1 items-center lg:flex">
              <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-3 text-white/70 hover:text-[#C9A96E] transition-colors"
                aria-label="Open menu"
              >
                <div className="flex flex-col gap-[5px]">
                  <span className="h-[2px] w-5 rounded-full bg-current" />
                  <span className="h-[2px] w-3.5 rounded-full bg-current" />
                  <span className="h-[2px] w-5 rounded-full bg-current" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.25em]">Menu</span>
              </button>
            </div>

            <div className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
              <Link href="/">
                <Image
                  src="/acasa.png"
                  alt="ACASA"
                  width={130}
                  height={40}
                  className="h-9 w-auto brightness-0 invert"
                  priority
                />
              </Link>
            </div>

            <div className="hidden flex-1 items-center justify-end gap-6 lg:flex">
              <nav className="flex items-center gap-8">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${
                      isActive(link.href) ? "text-[#C9A96E]" : "text-white/60 hover:text-[#C9A96E]"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>

              <div className="h-5 w-px bg-white/10" />

              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      <SlidePanel isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <div className="h-16 lg:h-[72px]" />
    </>
  );
}