'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FiTrendingUp, FiTrendingDown, FiBarChart2, FiCalendar,
  FiUsers, FiFileText, FiHome as FiHomeIcon, FiStar,
  FiClock, FiAward, FiTarget, FiZap
} from 'react-icons/fi';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#22c55e', '#f59e0b'];

  const fetchOverviewData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [blogsRes, propertiesRes, usersRes, reviewsRes] = await Promise.all([
        fetch('/api/v1/blogs?limit=100'),
        fetch('/api/v1/properties?limit=100'),
        fetch('/api/v1/users?limit=100'),
        fetch('/api/v1/reviews?limit=100'),
      ]);

      const [blogsData, propertiesData, usersData, reviewsData] = await Promise.all([
        blogsRes.json(),
        propertiesRes.json(),
        usersRes.json(),
        reviewsRes.json(),
      ]);

      const blogs = blogsData.success ? blogsData.data || [] : [];
      const properties = propertiesData.success ? propertiesData.data || [] : [];
      const users = usersData.success ? usersData.data || [] : [];
      const reviews = reviewsData.success ? reviewsData.data || [] : [];

      // Generate chart data (last 7 days)
      const today = new Date();
      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        // Count blogs created on this day
        const dayBlogs = blogs.filter((b: any) => {
          const created = new Date(b.created_at);
          return created.toDateString() === date.toDateString();
        });
        
        // Count properties created on this day
        const dayProperties = properties.filter((p: any) => {
          const created = new Date(p.created_at);
          return created.toDateString() === date.toDateString();
        });
        
        chartData.push({
          day: dayStr,
          blogs: dayBlogs.length,
          properties: dayProperties.length,
        });
      }
      setChartData(chartData);

      // Pie chart data - content distribution
      setPieData([
        { name: 'Blogs', value: blogs.length },
        { name: 'Properties', value: properties.length },
        { name: 'Users', value: users.length },
        { name: 'Reviews', value: reviews.length },
      ]);

      // Overview stats
      const publishedBlogs = blogs.filter((b: any) => b.status === 1).length;
      const draftBlogs = blogs.filter((b: any) => b.status === 0).length;
      const averageRating = reviews.length > 0 
        ? (reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : '0.0';

      setOverviewData({
        blogs: { total: blogs.length, published: publishedBlogs, draft: draftBlogs },
        properties: { total: properties.length, active: properties.filter((p: any) => p.status === 1).length },
        users: { total: users.length, active: users.filter((u: any) => u.status === 1).length },
        reviews: { total: reviews.length, average: averageRating, pending: reviews.filter((r: any) => r.status === 0).length },
      });

    } catch (error) {
      console.error('Error fetching overview data:', error);
      toast.error('Failed to load overview data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-neutral-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-blue-500 border-r-purple-500 border-b-blue-500 border-l-purple-500 rounded-full animate-spin" />
          </div>
          <p className="text-neutral-500 font-medium">Loading overview...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-3">
          {trend > 0 ? (
            <FiTrendingUp size={14} className="text-emerald-500" />
          ) : (
            <FiTrendingDown size={14} className="text-red-500" />
          )}
          <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {Math.abs(trend)}%
          </span>
          <span className="text-xs text-neutral-400">vs last month</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Content" 
          value={overviewData?.blogs.total + overviewData?.properties.total || 0}
          subtitle={`${overviewData?.blogs.total || 0} blogs, ${overviewData?.properties.total || 0} properties`}
          icon={FiFileText}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          trend={12}
        />
        <StatCard 
          title="Total Users" 
          value={overviewData?.users.total || 0}
          subtitle={`${overviewData?.users.active || 0} active users`}
          icon={FiUsers}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          trend={8}
        />
        <StatCard 
          title="Published Content" 
          value={(overviewData?.blogs.published || 0) + (overviewData?.properties.active || 0)}
          subtitle={`${overviewData?.blogs.published || 0} blogs published`}
          icon={FiAward}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          trend={5}
        />
        <StatCard 
          title="Reviews" 
          value={overviewData?.reviews.total || 0}
          subtitle={`Avg ${overviewData?.reviews.average || 0}/5 ★`}
          icon={FiStar}
          color="bg-gradient-to-br from-yellow-500 to-yellow-600"
          trend={-2}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-900">Content Overview</h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                Blogs
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                Properties
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBlogs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProperties" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="blogs" 
                  stroke="#3b82f6" 
                  fill="url(#colorBlogs)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="properties" 
                  stroke="#8b5cf6" 
                  fill="url(#colorProperties)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
          <h3 className="font-semibold text-neutral-900 mb-4">Content Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {pieData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <div className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-neutral-600">{item.name}</span>
                <span className="font-medium text-neutral-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <FiZap size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">Draft Blogs</p>
              <p className="text-lg font-bold text-neutral-900">{overviewData?.blogs.draft || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <FiTarget size={18} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">Active Properties</p>
              <p className="text-lg font-bold text-neutral-900">{overviewData?.properties.active || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 rounded-xl">
              <FiUsers size={18} className="text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">Active Users</p>
              <p className="text-lg font-bold text-neutral-900">{overviewData?.users.active || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-50 rounded-xl">
              <FiClock size={18} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">Pending Reviews</p>
              <p className="text-lg font-bold text-neutral-900">{overviewData?.reviews.pending || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminOverviewPage;