'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Menu, Bell, Search, User, LogOut,
  Settings, HelpCircle, ChevronDown, X,
  Loader2
} from 'lucide-react';

interface UserData {
  id       : number;
  usertype : string;
  full_name: string;
  name     : string;
  email    : string;
  phone    : string;
  photo    : string;
  status   : number;
}

interface Notification {
  id     : string;
  title  : string;
  message: string;
  time   : string;
  read   : boolean;
  type   : 'info' | 'success' | 'warning' | 'error';
}

interface NavbarProps {
  activeTab  : string;
  onMenuClick: () => void;
  onLogout   : () => Promise<void>;
}

export function Navbar({ activeTab, onMenuClick, onLogout }: NavbarProps) {
  const router = useRouter();

  const [searchOpen,        setSearchOpen       ] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen,      setUserMenuOpen     ] = useState(false);
  const [searchQuery,       setSearchQuery      ] = useState('');
  const [user,              setUser             ] = useState<UserData | null>(null);
  const [loading,           setLoading          ] = useState(true);
  const [loggingOut,        setLoggingOut       ] = useState(false);
  const [imageError,        setImageError       ] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id     : '1',
      title  : 'New User Registered',
      message: 'John Doe just created an account',
      time   : '5 minutes ago',
      read   : false,
      type   : 'success',
    },
    {
      id     : '2',
      title  : 'Order #1234',
      message: 'New order has been placed',
      time   : '1 hour ago',
      read   : false,
      type   : 'info',
    },
    {
      id     : '3',
      title  : 'Server Update',
      message: 'System maintenance scheduled for tonight',
      time   : '3 hours ago',
      read   : true,
      type   : 'warning',
    },
  ]);

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef     = useRef<HTMLDivElement>(null);
  const searchRef       = useRef<HTMLDivElement>(null);

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
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  // ── Close dropdowns on outside click ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notificationRef.current && !notificationRef.current.contains(target)) setNotificationsOpen(false);
      if (userMenuRef.current     && !userMenuRef.current.contains(target))     setUserMenuOpen(false);
      if (searchRef.current       && !searchRef.current.contains(target))       setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setUserMenuOpen(false);

    try {
      const res  = await fetch('/api/v1/auth/logout', {
        method     : 'POST',
        credentials: 'include',
        headers    : { 'Content-Type': 'application/json' },
        body       : JSON.stringify({ type: 'admin' }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Logged out successfully');
        setUser(null);
        setTimeout(() => router.replace('/admin/login'), 500);
      } else {
        toast.error(data.message || 'Logout failed');
        setLoggingOut(false);
      }
    } catch {
      toast.error('Something went wrong');
      setLoggingOut(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const displayName = user?.full_name || user?.name || 'Admin User';
  const displayEmail = user?.email || '';
  const userRole = user?.usertype || 'User';

  const initials = (() => {
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

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const getNotificationDot = (type: string) => {
    const colors: Record<string, string> = {
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      error  : 'bg-red-500',
      info   : 'bg-blue-500',
    };
    return colors[type] || 'bg-neutral-400';
  };

  // ── Avatar ─────────────────────────────────────────────────────────────────
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

  // ── Page title ─────────────────────────────────────────────────────────────
  const pageTitle = activeTab
    ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/-/g, ' ')
    : 'Dashboard';

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
      <div className="px-4 md:px-6 py-3 flex items-center justify-between">

        {/* ── Left ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <Menu size={20} className="text-neutral-700" />
          </button>

          <div>
            <h1 className="text-lg font-semibold text-neutral-900">{pageTitle}</h1>
            <p className="hidden md:block text-xs text-neutral-400">
              {activeTab === 'dashboard' ? 'Platform overview' : `Manage ${pageTitle.toLowerCase()}`}
            </p>
          </div>
        </div>

        {/* ── Right ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">

          {/* Search — Desktop */}
          <div ref={searchRef} className="hidden md:block relative">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 lg:w-56 px-4 py-2 pl-9 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:border-neutral-300 transition-all"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X size={14} />
                </button>
              )}
            </form>
          </div>

          {/* Search — Mobile */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden p-2 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <Search size={18} className="text-neutral-600" />
          </button>

          {/* Mobile Search Overlay */}
          {searchOpen && (
            <div className="fixed inset-0 z-50 bg-black/40 md:hidden">
              <div className="p-4 pt-20" ref={searchRef}>
                <div className="max-w-md mx-auto bg-white rounded-2xl border border-neutral-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-neutral-900 text-sm">Search</h3>
                    <button onClick={() => setSearchOpen(false)} className="p-1 hover:bg-neutral-100 rounded-lg">
                      <X size={18} className="text-neutral-500" />
                    </button>
                  </div>
                  <form onSubmit={handleSearch}>
                    <input
                      type="text"
                      placeholder="Type to search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200"
                      autoFocus
                    />
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              <Bell size={18} className="text-neutral-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-neutral-200 shadow-lg overflow-hidden">
                <div className="p-3 border-b border-neutral-100 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-neutral-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell size={20} className="text-neutral-300 mx-auto mb-2" />
                      <p className="text-sm text-neutral-400">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-3 py-3 hover:bg-neutral-50 transition-colors cursor-pointer ${
                          !n.read ? 'bg-neutral-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getNotificationDot(n.type)}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                            <p className="text-xs text-neutral-500 truncate">{n.message}</p>
                            <p className="text-xs text-neutral-400 mt-1">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-neutral-100">
                  <button className="w-full text-center text-xs text-neutral-500 hover:text-neutral-900 py-1.5 transition-colors">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              disabled={loading}
              className="flex items-center gap-2 p-1.5 pr-2 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              <Avatar size="sm" />
              <span className="hidden md:block text-sm font-medium text-neutral-700 max-w-[120px] truncate">
                {loading ? 'Loading...' : displayName}
              </span>
              <ChevronDown
                size={14}
                className={`hidden md:block text-neutral-400 transition-transform duration-200 ${
                  userMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-neutral-200 shadow-lg overflow-hidden">
                {/* User Info */}
                <div className="p-3 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <Avatar size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{displayName}</p>
                      <p className="text-xs text-neutral-400 truncate">{displayEmail}</p>
                      <span className="inline-block mt-1 text-[10px] font-medium bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">
                        {userRole}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => { setUserMenuOpen(false); router.push('/admin/profile'); }}
                    className="w-full px-3 py-2 text-left text-sm text-neutral-600 hover:bg-neutral-50 transition-colors flex items-center gap-3"
                  >
                    <User size={16} className="text-neutral-400" />
                    Profile
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); router.push('/admin/settings'); }}
                    className="w-full px-3 py-2 text-left text-sm text-neutral-600 hover:bg-neutral-50 transition-colors flex items-center gap-3"
                  >
                    <Settings size={16} className="text-neutral-400" />
                    Settings
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-neutral-600 hover:bg-neutral-50 transition-colors flex items-center gap-3"
                  >
                    <HelpCircle size={16} className="text-neutral-400" />
                    Help Center
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-neutral-100 py-1">
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full px-3 py-2 text-left text-sm text-neutral-600 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-3 disabled:opacity-50"
                  >
                    {loggingOut ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <LogOut size={16} />
                    )}
                    {loggingOut ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}