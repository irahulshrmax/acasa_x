// app/admin/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Users, Home, MapPin, Briefcase,
  Mail, Star, UserCheck, RefreshCw, Bell,
  Plus, Eye, TrendingUp, BarChart2,
  Clock, Calendar, MessageSquare, ArrowRight,
  Activity, Building2, Phone, ChevronRight,
  Loader2, AlertCircle, Sparkles
} from 'lucide-react';

// ─── TYPES ──────────────────────────────────────────────────────────────
interface DashboardStats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  archivedBlogs: number;
  totalBlogViews: number;
  totalBlogLikes: number;
  totalBlogComments: number;
  totalProperties: number;
  totalDevelopers: number;
  totalCommunities: number;
  totalSubCommunities: number;
  totalUsers: number;
  totalAdmins: number;
  totalContacts: number;
  totalReviews: number;
  totalCareers: number;
  totalDocuments: number;
  totalFAQs: number;
  recentBlogs: any[];
  recentProperties: any[];
  recentContacts: any[];
}

// ─── DUMMY DATA ──────────────────────────────────────────────────────────
const DUMMY_STATS: DashboardStats = {
  totalBlogs: 392,
  publishedBlogs: 350,
  draftBlogs: 32,
  archivedBlogs: 10,
  totalBlogViews: 158432,
  totalBlogLikes: 2341,
  totalBlogComments: 892,
  totalProperties: 2856,
  totalDevelopers: 148,
  totalCommunities: 67,
  totalSubCommunities: 234,
  totalUsers: 1234,
  totalAdmins: 12,
  totalContacts: 456,
  totalReviews: 89,
  totalCareers: 23,
  totalDocuments: 156,
  totalFAQs: 45,
  recentBlogs: [
    {
      id: 477,
      title: 'Long-Term Property Investment Dubai: Is an Off-Plan Investment Worth It?',
      status: 1,
      views: 234,
      publish_date: '2026-07-20',
      created_at: '2026-07-20 15:52:37'
    },
    {
      id: 476,
      title: 'Off-Plan Apartments Dubai: How to Choose the Right Investment (2026 Guide)',
      status: 1,
      views: 567,
      publish_date: '2026-07-20',
      created_at: '2026-07-20 14:04:38'
    },
    {
      id: 475,
      title: 'Dubai Luxury Property Trends 2026: Why the Market Continues to Thrive',
      status: 1,
      views: 432,
      publish_date: '2026-07-19',
      created_at: '2026-07-19 10:30:00'
    },
    {
      id: 474,
      title: 'Your Guide to the Dubai Property Market in 2026',
      status: 1,
      views: 321,
      publish_date: '2026-07-18',
      created_at: '2026-07-18 09:15:00'
    },
    {
      id: 473,
      title: 'A Complete Guide to the Best 5 Star Hotels in Sharjah',
      status: 1,
      views: 189,
      publish_date: '2026-01-28',
      created_at: '2026-01-27 07:12:20'
    }
  ],
  recentProperties: [
    {
      id: 1,
      title: 'Luxury 3-Bedroom Apartment in Downtown Dubai',
      name: 'Luxury 3-Bedroom Apartment',
      price: 2500000,
      location: 'Downtown Dubai',
      community_name: 'Downtown Dubai',
      created_at: '2026-07-20 14:00:00'
    },
    {
      id: 2,
      title: '4-Bedroom Villa with Private Pool in Palm Jumeirah',
      name: '4-Bedroom Villa with Private Pool',
      price: 8500000,
      location: 'Palm Jumeirah',
      community_name: 'Palm Jumeirah',
      created_at: '2026-07-19 11:30:00'
    },
    {
      id: 3,
      title: 'Modern 2-Bedroom Apartment in Dubai Marina',
      name: 'Modern 2-Bedroom Apartment',
      price: 1800000,
      location: 'Dubai Marina',
      community_name: 'Dubai Marina',
      created_at: '2026-07-18 09:45:00'
    },
    {
      id: 4,
      title: '5-Bedroom Villa in Emirates Hills',
      name: '5-Bedroom Villa in Emirates Hills',
      price: 12000000,
      location: 'Emirates Hills',
      community_name: 'Emirates Hills',
      created_at: '2026-07-17 16:20:00'
    },
    {
      id: 5,
      title: 'Studio Apartment in Jumeirah Village Circle',
      name: 'Studio Apartment in JVC',
      price: 450000,
      location: 'Jumeirah Village Circle',
      community_name: 'Jumeirah Village Circle',
      created_at: '2026-07-16 13:10:00'
    }
  ],
  recentContacts: [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+971 50 123 4567',
      message: 'Interested in Palm Jumeirah properties',
      created_at: '2026-07-20 10:00:00'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+971 55 987 6543',
      message: 'Looking for investment properties in Dubai Marina',
      created_at: '2026-07-19 15:30:00'
    },
    {
      id: 3,
      name: 'Michael Brown',
      email: 'm.brown@email.com',
      phone: '+971 50 456 7890',
      message: 'Need more info about off-plan projects',
      created_at: '2026-07-19 09:15:00'
    }
  ]
};

const DUMMY_CATEGORIES = [
  { category: 'dubai-real-estate', count: 145 },
  { category: 'market-news', count: 67 },
  { category: 'lifestyle', count: 54 },
  { category: 'real-estate', count: 48 },
  { category: 'dubai-lifestyle', count: 35 },
  { category: 'gardening', count: 18 },
  { category: 'interiors', count: 12 },
  { category: 'legal', count: 8 },
  { category: 'Select Category', count: 5 }
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────
function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [blogCategories, setBlogCategories] = useState<{ category: string; count: number }[]>([]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ─── LOAD DUMMY DATA ──────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setStats(DUMMY_STATS);
      setBlogCategories(DUMMY_CATEGORIES);

      const activities = [
        ...DUMMY_STATS.recentBlogs.slice(0, 3).map((b: any) => ({
          id: `blog-${b.id}`,
          type: 'blog',
          title: b.title,
          status: b.status === 1 ? 'Published' : 'Draft',
          time: b.created_at || b.publish_date,
          icon: FileText,
        })),
        ...DUMMY_STATS.recentProperties.slice(0, 2).map((p: any) => ({
          id: `prop-${p.id}`,
          type: 'property',
          title: p.title || p.name,
          status: p.price ? `$${p.price.toLocaleString()}` : 'New listing',
          time: p.created_at,
          icon: Home,
        })),
      ];

      setRecentActivity(
        activities
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 8)
      );
      setLoading(false);
    }, 800);
  }, []);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const getTimeAgo = (date: string) => {
    if (!date) return 'N/A';
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      blog: 'bg-blue-50 text-blue-600',
      user: 'bg-emerald-50 text-emerald-600',
      property: 'bg-violet-50 text-violet-600',
    };
    return colors[type] || 'bg-neutral-50 text-neutral-600';
  };

  const quickActions = [
    {
      label: 'New Blog Post',
      icon: FileText,
      path: '/admin/blogs/new',
      accent: 'hover:border-blue-200 hover:bg-blue-50/50',
    },
    {
      label: 'Add Property',
      icon: Building2,
      path: '/admin/properties/create',
      accent: 'hover:border-emerald-200 hover:bg-emerald-50/50',
    },
    {
      label: 'Manage Users',
      icon: Users,
      path: '/admin/users',
      accent: 'hover:border-violet-200 hover:bg-violet-50/50',
    },
    {
      label: 'View Messages',
      icon: MessageSquare,
      path: '/admin/contacts',
      accent: 'hover:border-amber-200 hover:bg-amber-50/50',
      badge: stats?.totalContacts || 0,
    },
  ];

  // ─── LOADING STATE ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-neutral-400 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ─── MAIN RENDER ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Welcome Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={20} className="text-neutral-400" />
            <h1 className="text-xl font-semibold text-neutral-900">
              Welcome back, Admin
            </h1>
          </div>
          <p className="text-sm text-neutral-500">
            Here&apos;s what&apos;s happening with your platform today
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-600">
            <Calendar size={14} className="text-neutral-400" />
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-600">
            <Clock size={14} className="text-neutral-400" />
            {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <button
            onClick={refreshData}
            className="p-2 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={16} className="text-neutral-500" />
          </button>
        </div>
      </div>

      {/* ── Blog Stats Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText size={18} className="text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Total
            </span>
          </div>
          <p className="text-2xl font-semibold text-neutral-900">
            {stats?.totalBlogs?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Total Blogs</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <FileText size={18} className="text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <p className="text-2xl font-semibold text-neutral-900">
            {stats?.publishedBlogs?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Published</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <FileText size={18} className="text-amber-600" />
            </div>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Draft
            </span>
          </div>
          <p className="text-2xl font-semibold text-neutral-900">
            {stats?.draftBlogs?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Draft</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <FileText size={18} className="text-red-600" />
            </div>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              Archived
            </span>
          </div>
          <p className="text-2xl font-semibold text-neutral-900">
            {stats?.archivedBlogs?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Archived</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Eye size={18} className="text-purple-600" />
            </div>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              Views
            </span>
          </div>
          <p className="text-2xl font-semibold text-neutral-900">
            {stats?.totalBlogViews?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Total Views</p>
        </div>
      </div>

      {/* ── Stats Row 2 ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Properties', value: stats?.totalProperties || 0, icon: Home },
          { title: 'Users', value: stats?.totalUsers || 0, icon: Users },
          { title: 'Developers', value: stats?.totalDevelopers || 0, icon: UserCheck },
          { title: 'Communities', value: stats?.totalCommunities || 0, icon: MapPin },
        ].map((stat) => (
          <div
            key={stat.title}
            className="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-neutral-50 rounded-lg">
                <stat.icon size={18} className="text-neutral-600" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-neutral-900">
              {stat.value.toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500 mt-1">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* ── Blog Categories as Cards ────────────────────────────────────── */}
      {blogCategories.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={18} className="text-neutral-400" />
            <h3 className="font-medium text-neutral-900">Blog Categories</h3>
            <span className="ml-auto text-xs text-neutral-400">{blogCategories.length} categories</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {blogCategories.map((cat) => {
              const maxCount = blogCategories[0]?.count || 1;
              const percentage = Math.min((cat.count / maxCount) * 100, 100);
              return (
                <div
                  key={cat.category}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 hover:shadow-md transition-all hover:border-neutral-300 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700 truncate group-hover:text-neutral-900 transition-colors">
                      {cat.category}
                    </span>
                    <span className="ml-2 bg-white px-2 py-0.5 rounded-full text-xs font-semibold text-neutral-500 border border-neutral-200 shrink-0">
                      {cat.count}
                    </span>
                  </div>
                  <div className="mt-2 w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-neutral-700 rounded-full transition-all duration-700 group-hover:bg-neutral-900" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Activity + Quick Actions ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-neutral-400" />
              <h3 className="font-medium text-neutral-900">Recent Activity</h3>
            </div>
            <button
              onClick={refreshData}
              className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <RefreshCw size={14} className="text-neutral-400" />
            </button>
          </div>

          <div className="divide-y divide-neutral-100">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle size={24} className="text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-400">No recent activity</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                    <activity.icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900 truncate">{activity.title}</p>
                    <p className="text-xs text-neutral-400">{activity.status}</p>
                  </div>
                  <span className="text-xs text-neutral-400 whitespace-nowrap">
                    {getTimeAgo(activity.time)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-neutral-200 rounded-xl">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h3 className="font-medium text-neutral-900">Quick Actions</h3>
          </div>

          <div className="p-3 space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => router.push(action.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 border border-neutral-200 rounded-xl transition-all ${action.accent}`}
              >
                <div className="p-1.5 bg-neutral-100 rounded-lg">
                  <action.icon size={16} className="text-neutral-600" />
                </div>
                <span className="text-sm font-medium text-neutral-700 flex-1 text-left">
                  {action.label}
                </span>
                {action.badge ? (
                  <span className="text-xs bg-neutral-900 text-white px-2 py-0.5 rounded-full">
                    {action.badge}
                  </span>
                ) : (
                  <ChevronRight size={14} className="text-neutral-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Blogs + Properties ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Blogs */}
        <div className="bg-white border border-neutral-200 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-neutral-400" />
              <h3 className="font-medium text-neutral-900">Recent Blogs</h3>
            </div>
            <button
              onClick={() => router.push('/admin/blogs')}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              View all
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="divide-y divide-neutral-100">
            {stats?.recentBlogs?.length ? (
              stats.recentBlogs.map((blog: any) => (
                <div
                  key={blog.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-neutral-900 truncate">{blog.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-neutral-400">
                        {new Date(blog.publish_date || blog.created_at).toLocaleDateString()}
                      </p>
                      {blog.views > 0 && (
                        <span className="text-xs text-neutral-400">
                          • {blog.views} views
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`ml-3 px-2 py-0.5 text-xs font-medium rounded-full border ${
                      blog.status === 1
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {blog.status === 1 ? 'Published' : 'Draft'}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <FileText size={20} className="text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-400">No blogs yet</p>
                <button
                  onClick={() => router.push('/admin/blogs/new')}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Create your first blog
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Properties */}
        <div className="bg-white border border-neutral-200 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-neutral-400" />
              <h3 className="font-medium text-neutral-900">Recent Properties</h3>
            </div>
            <button
              onClick={() => router.push('/admin/properties')}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              View all
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="divide-y divide-neutral-100">
            {stats?.recentProperties?.length ? (
              stats.recentProperties.map((property: any) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-neutral-900 truncate">{property.title || property.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-neutral-400" />
                      <p className="text-xs text-neutral-400">{property.location || property.community_name || 'N/A'}</p>
                    </div>
                  </div>
                  <span className="ml-3 text-sm font-semibold text-neutral-900">
                    {property.price ? `$${property.price.toLocaleString()}` : 'N/A'}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <Building2 size={20} className="text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-400">No properties yet</p>
                <button
                  onClick={() => router.push('/admin/properties/create')}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Add your first property
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;