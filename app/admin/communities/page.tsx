// app/admin/communities/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    Plus, Edit2, Trash2, Search, Eye, RefreshCw,
    MapPin, Home, Building2, ChevronLeft, ChevronRight,
    Loader2, AlertTriangle, X, CheckCircle, Globe
} from 'lucide-react';

interface Community {
    id: number;
    name: string;
    slug: string;
    city_name?: string;
    state_name?: string;
    country_name?: string;
    status: number;
    featured: number;
    property_count: number;
    image_url?: string;
    created_at?: string;
}

interface Meta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function AdminCommunitiesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const LIMIT = 12;

    const fetchCommunities = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: String(page),
                limit: String(LIMIT),
            });
            if (status) params.set('status', status);
            if (search) params.set('search', search);

            const res = await fetch(`/api/v1/admin/communities?${params}`, {
                credentials: 'include',
            });

            if (!res.ok) {
                if (res.status === 401) { router.push('/admin/login'); return; }
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            if (data.success) {
                setCommunities(data.data || []);
                setMeta(data.meta || null);
            } else {
                toast.error(data.message || 'Failed to load communities');
            }
        } catch (error: any) {
            console.error('Error fetching communities:', error);
            toast.error(error.message || 'Failed to load communities');
        } finally {
            setLoading(false);
        }
    }, [page, status, search, router]);

    useEffect(() => {
        fetchCommunities();
    }, [fetchCommunities]);

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/v1/admin/communities?id=${deleteId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Community deleted');
                setShowDelete(false);
                setDeleteId(null);
                fetchCommunities();
            } else {
                toast.error(data.message || 'Failed to delete');
            }
        } catch (error) {
            toast.error('Failed to delete community');
        } finally {
            setDeleting(false);
        }
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setPage(1);
    };

    const getStatusBadge = (status: number) => {
        if (status === 1) {
            return <span className="px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700 rounded-full">Active</span>;
        }
        return <span className="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-500 rounded-full">Inactive</span>;
    };

    const getFeaturedBadge = (featured: number) => {
        if (featured === 1) {
            return <span className="px-2 py-0.5 text-xs bg-amber-50 text-amber-700 rounded-full">★ Featured</span>;
        }
        return null;
    };

    // ─── Skeleton ──────────────────────────────────────────────────────────
    if (loading && communities.length === 0) {
        return (
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div className="h-7 bg-neutral-200 rounded w-32 animate-pulse" />
                    <div className="h-9 bg-neutral-200 rounded w-28 animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white border border-neutral-200 rounded-xl p-4 animate-pulse">
                            <div className="h-32 bg-neutral-100 rounded-lg mb-3" />
                            <div className="h-4 bg-neutral-100 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-neutral-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-neutral-900">Communities</h1>
                    <p className="text-xs text-neutral-500 mt-0.5">
                        {meta?.total || 0} communities total
                    </p>
                </div>
                <button
                    onClick={() => router.push('/admin/communities/new')}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors text-sm"
                >
                    <Plus size={16} />
                    New Community
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white border border-neutral-200 rounded-xl p-3">
                <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex-1 relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search communities..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-neutral-400"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={e => { setStatus(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-neutral-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-neutral-400 min-w-[130px]"
                    >
                        <option value="">All Status</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>

                    <div className="flex gap-1.5">
                        <button
                            onClick={fetchCommunities}
                            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={15} className="text-neutral-400" />
                        </button>
                        {(search || status) && (
                            <button
                                onClick={clearFilters}
                                className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                                title="Clear filters"
                            >
                                <X size={15} className="text-neutral-400" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Grid */}
            {communities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white border border-neutral-200 rounded-xl">
                    <Building2 size={36} className="text-neutral-200 mb-3" />
                    <h3 className="text-sm font-medium text-neutral-900">No communities found</h3>
                    <p className="text-xs text-neutral-400 mt-1">
                        {search || status ? 'Try adjusting your filters' : 'Create your first community'}
                    </p>
                    {!search && !status && (
                        <button
                            onClick={() => router.push('/admin/communities/new')}
                            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs"
                        >
                            <Plus size={14} />
                            Create Community
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {communities.map((community, i) => (
                        <motion.div
                            key={community.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.05, 0.3) }}
                            className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-sm transition-all group"
                        >
                            {/* Image */}
                            <div className="relative h-40 bg-neutral-100 overflow-hidden">
                                {community.image_url ? (
                                    <img
                                        src={community.image_url}
                                        alt={community.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                        <Building2 size={40} />
                                    </div>
                                )}
                                <div className="absolute top-2 left-2 flex gap-1">
                                    {getStatusBadge(community.status)}
                                    {getFeaturedBadge(community.featured)}
                                </div>
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => router.push(`/admin/communities/edit/${community.id}`)}
                                        className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                                    >
                                        <Edit2 size={13} className="text-neutral-600" />
                                    </button>
                                    <button
                                        onClick={() => { setDeleteId(community.id); setShowDelete(true); }}
                                        className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                                    >
                                        <Trash2 size={13} className="text-red-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="text-sm font-semibold text-neutral-900 line-clamp-1">
                                    {community.name}
                                </h3>
                                <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                                    <span className="flex items-center gap-1">
                                        <MapPin size={12} />
                                        {community.city_name || 'N/A'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Home size={12} />
                                        {community.property_count || 0} properties
                                    </span>
                                </div>
                                <div className="mt-3 flex items-center gap-2 text-[10px] text-neutral-400">
                                    <span>/{community.slug}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-neutral-400">
                        {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs text-neutral-500 px-2">{page} / {meta.totalPages}</span>
                        <button
                            onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                            disabled={page === meta.totalPages}
                            className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDelete && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-50 rounded-xl">
                                <AlertTriangle size={20} className="text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-neutral-900">Delete Community</h2>
                                <p className="text-xs text-neutral-400">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-sm text-neutral-600 mb-5">
                            Are you sure you want to delete this community?
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowDelete(false)}
                                className="flex-1 px-4 py-2 border border-neutral-200 rounded-xl text-sm text-neutral-600 hover:bg-neutral-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 flex items-center justify-center gap-1.5 disabled:opacity-60"
                            >
                                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}