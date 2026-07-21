'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, LogOut, ChevronLeft, ChevronRight, User,
  LayoutDashboard, FileText, Users, Home,
  MapPin, Briefcase, Mail, Star, File,
  UserCheck, Settings, BarChart2,
  BookOpen, Tag, HelpCircle, Shield,
  Newspaper, Folder, MessageSquare, Award,
  ChevronDown, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export const menuItems = [
  { id: 'dashboard',      label: 'Dashboard',      icon: LayoutDashboard, section: 'main' },
  { id: 'overview',       label: 'Overview',        icon: Home,            section: 'main' },
  { id: 'blogs',          label: 'Blogs',           icon: FileText,        section: 'content' },
  { id: 'blog-categories',label: 'Blog Categories', icon: Tag,             section: 'content' },
  { id: 'faqs',           label: 'FAQs',            icon: HelpCircle,      section: 'content' },
  { id: 'privacy-policy', label: 'Privacy Policy',  icon: Shield,          section: 'content' },
  { id: 'press',          label: 'Press',           icon: Newspaper,       section: 'content' },
  { id: 'properties',     label: 'Properties',      icon: Home,            section: 'real-estate' },
  { id: 'projects',       label: 'Projects',        icon: Folder,          section: 'real-estate' },
  { id: 'developers',     label: 'Developers',      icon: Users,           section: 'real-estate' },
  { id: 'communities',    label: 'Communities',      icon: MapPin,          section: 'real-estate' },
  { id: 'careers',        label: 'Careers',          icon: Briefcase,       section: 'engagement' },
  { id: 'contacts',       label: 'Contacts',         icon: Mail,            section: 'engagement' },
  { id: 'reviews',        label: 'Reviews',          icon: Star,            section: 'engagement' },
  { id: 'testimonials',   label: 'Testimonials',     icon: Award,           section: 'engagement' },
  { id: 'documents',      label: 'Documents',        icon: File,            section: 'engagement' },
  { id: 'users',          label: 'Users',            icon: UserCheck,       section: 'management' },
  { id: 'analytics',      label: 'Analytics',        icon: BarChart2,       section: 'management' },
  { id: 'settings',       label: 'Settings',         icon: Settings,        section: 'management' },
];

export const menuSections = [
  { id: 'main',        label: 'Main',               items: menuItems.filter(i => i.section === 'main') },
  { id: 'content',     label: 'Content Management', items: menuItems.filter(i => i.section === 'content') },
  { id: 'real-estate', label: 'Real Estate',        items: menuItems.filter(i => i.section === 'real-estate') },
  { id: 'engagement',  label: 'Engagement',         items: menuItems.filter(i => i.section === 'engagement') },
  { id: 'management',  label: 'Management',         items: menuItems.filter(i => i.section === 'management') },
];

interface UserData {
  id         : number;
  usertype   : string;
  full_name  : string;
  name       : string;
  email      : string;
  phone      : string;
  photo      : string;
  status     : number;
}

interface SidebarProps {
  activeTab  : string;
  onTabChange: (tab: string) => void;
  isOpen     : boolean;
  onClose    : () => void;
  onLogout   : () => Promise<void>;
}

export function Sidebar({ activeTab, onTabChange, isOpen, onClose, onLogout }: SidebarProps) {
  const router = useRouter();

  const [isCollapsed,      setIsCollapsed     ] = useState(false);
  const [isMobile,         setIsMobile        ] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['main', 'content', 'real-estate', 'engagement', 'management']);
  const [user,             setUser            ] = useState<UserData | null>(null);
  const [loading,          setLoading         ] = useState(true);
  const [imageError,       setImageError      ] = useState(false);
  const [loggingOut,       setLoggingOut      ] = useState(false);

  // ── Fetch user ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/v1/auth/me', {
          credentials: 'include',
          headers    : { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.user) {
            setUser(data.data.user);
          }
        } else if (res.status === 401) {
          router.replace('/admin/login');
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  // ── Mobile detection ───────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Close on outside click (mobile) ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (isMobile && isOpen && !(e.target as HTMLElement).closest('.sidebar-container')) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMobile, isOpen, onClose]);

  // ── Lock body scroll on mobile ─────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = (isMobile && isOpen) ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobile, isOpen]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleTabClick = (id: string) => {
    onTabChange(id);
    if (isMobile) onClose();
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // ── Logout handler ─────────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const res = await fetch('/api/v1/auth/logout', {
        method     : 'POST',
        credentials: 'include',
        headers    : { 'Content-Type': 'application/json' },
        body       : JSON.stringify({ type: 'admin' }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Logged out successfully');
        setUser(null);

        // Small delay so user sees the toast
        setTimeout(() => {
          router.replace('/admin/login');
        }, 500);
      } else {
        toast.error(data.message || 'Logout failed');
        setLoggingOut(false);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
      setLoggingOut(false);
    }
  };

  // ── User helpers ───────────────────────────────────────────────────────────
  const displayName = loading ? 'Loading...' : (user?.full_name || user?.name || 'Admin User');
  const displayEmail = loading ? '' : (user?.email || '');

  const initials = (() => {
    if (loading) return '';
    const name = user?.full_name || user?.name || 'A';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  })();

  const photoUrl = (() => {
    if (!user?.photo || imageError) return null;
    const p = user.photo;
    if (p.startsWith('http')) return p;
    if (p.startsWith('/')) return p;
    return `/uploads/${p}`;
  })();

  // ── Avatar component ──────────────────────────────────────────────────────
  const Avatar = ({ size = 'sm' }: { size?: 'sm' | 'lg' }) => {
    const s = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';

    if (loading) {
      return <div className={`${s} rounded-full bg-neutral-200 animate-pulse`} />;
    }

    if (photoUrl) {
      return (
        <img
          src={photoUrl}
          alt={displayName}
          className={`${s} rounded-full object-cover`}
          onError={() => setImageError(true)}
        />
      );
    }

    return (
      <div className={`${s} bg-neutral-900 rounded-full flex items-center justify-center text-white font-medium`}>
        {initials || <User size={size === 'sm' ? 14 : 18} />}
      </div>
    );
  };

  // ── Logout button ─────────────────────────────────────────────────────────
  const LogoutButton = ({ collapsed = false }: { collapsed?: boolean }) => (
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
        text-neutral-600 hover:bg-red-50 hover:text-red-600
        disabled:opacity-50 disabled:cursor-not-allowed
        ${collapsed ? 'justify-center' : ''}
      `}
      title={collapsed ? 'Logout' : undefined}
    >
      {loggingOut ? (
        <Loader2 size={18} className="animate-spin flex-shrink-0" />
      ) : (
        <LogOut size={18} className="flex-shrink-0" />
      )}
      {!collapsed && (
        <span className="text-sm font-medium">
          {loggingOut ? 'Logging out...' : 'Logout'}
        </span>
      )}
    </button>
  );

  // ── Menu item renderer ────────────────────────────────────────────────────
  const MenuItem = ({ item, collapsed = false }: { item: typeof menuItems[0]; collapsed?: boolean }) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;

    return (
      <button
        onClick={() => handleTabClick(item.id)}
        className={`
          w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group
          ${collapsed ? 'justify-center' : ''}
          ${isActive
            ? 'bg-neutral-900 text-white'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          }
        `}
        title={collapsed ? item.label : undefined}
      >
        <Icon
          size={18}
          className={`flex-shrink-0 transition-colors ${
            isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-600'
          }`}
        />
        {!collapsed && (
          <span className="text-sm flex-1 text-left">{item.label}</span>
        )}
      </button>
    );
  };

  // ── Section renderer ──────────────────────────────────────────────────────
  const SectionBlock = ({ section }: { section: typeof menuSections[0] }) => {
    const isExpanded = expandedSections.includes(section.id);

    return (
      <div className="space-y-0.5">
        <button
          onClick={() => toggleSection(section.id)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-400 uppercase tracking-wider hover:text-neutral-600 transition-colors"
        >
          <span>{section.label}</span>
          <ChevronDown
            size={12}
            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {isExpanded && (
          <div className="space-y-0.5">
            {section.items.map(item => (
              <MenuItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // DESKTOP SIDEBAR
  // ═══════════════════════════════════════════════════════════════════════════
  if (!isMobile) {
    return (
      <aside
        className={`sidebar-container bg-white border-r border-neutral-200 h-screen sticky top-0 transition-all duration-300 flex flex-col ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Brand */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 border-b border-neutral-100`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-neutral-900">Admin</span>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={16} className="text-neutral-400" />
            </button>
          )}
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="absolute -right-3 top-6 w-6 h-6 bg-white border border-neutral-200 rounded-full flex items-center justify-center hover:bg-neutral-50 transition-colors shadow-sm"
            >
              <ChevronRight size={12} className="text-neutral-500" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-thin">
          {isCollapsed ? (
            <div className="space-y-1">
              {menuItems.map(item => (
                <MenuItem key={item.id} item={item} collapsed />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {menuSections.map(section => (
                <SectionBlock key={section.id} section={section} />
              ))}
            </div>
          )}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-neutral-100 p-3 space-y-2">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 px-3 py-2 bg-neutral-50 rounded-xl">
              <Avatar size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{displayName}</p>
                <p className="text-xs text-neutral-400 truncate">{displayEmail}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Avatar size="sm" />
            </div>
          )}

          <LogoutButton collapsed={isCollapsed} />
        </div>
      </aside>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE SIDEBAR
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`sidebar-container fixed top-0 left-0 h-full w-72 bg-white z-50 lg:hidden transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-neutral-900">Admin</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-thin">
          <div className="space-y-4">
            {menuSections.map(section => (
              <SectionBlock key={section.id} section={section} />
            ))}
          </div>
        </nav>

        {/* User + Logout */}
        <div className="border-t border-neutral-100 p-4 space-y-3">
          <div className="flex items-center gap-3 px-3 py-2 bg-neutral-50 rounded-xl">
            <Avatar size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{displayName}</p>
              <p className="text-xs text-neutral-400 truncate">{displayEmail}</p>
            </div>
          </div>

          <LogoutButton />
        </div>
      </aside>
    </>
  );
}