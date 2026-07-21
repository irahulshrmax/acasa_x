// app/admin/blogs/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    Plus, Edit2, Trash2, Search, Eye, RefreshCw,
    FileText, Tag, Calendar, User, Clock,
    ChevronLeft, ChevronRight, X, ImageOff,
    Loader2, AlertTriangle, MoreVertical,
} from 'lucide-react';

interface Blog {
    id: number;
    title: string;
    slug: string;
    sub_title: string | null;
    writer: string | null;
    publish_date: string | null;
    category: string;
    imageurl: string;
    image_urls?: {
        main: string;
        thumbnail: string;
        medium: string;
    };
    excerpt: string;
    reading_time: number;
    status: number;
    created_at: string;
}

interface Category {
    name: string;
    slug: string;
    total_blogs: number;
}

interface Meta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const STATUS_OPTIONS = [
    { value: "", label: "All Status" },
    { value: "1", label: "Published" },
    { value: "0", label: "Draft" },
    { value: "2", label: "Archived" },
];

const STATUS_STYLE: Record<number, string> = {
    1: "bg-emerald-50 text-emerald-700 border-emerald-200",
    0: "bg-amber-50 text-amber-700 border-amber-200",
    2: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

const STATUS_DOT: Record<number, string> = {
    1: "bg-emerald-500",
    0: "bg-amber-500",
    2: "bg-neutral-400",
};

const STATUS_LABEL: Record<number, string> = {
    1: "Published",
    0: "Draft",
    2: "Archived",
};

const SORT_OPTIONS = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "title_asc", label: "Title A-Z" },
    { value: "title_desc", label: "Title Z-A" },
    { value: "published", label: "Publish Date" },
];

function getImageUrl(url: string | null | undefined): string | null {
    if (!url?.trim()) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/upload/')) return url;
    if (url.includes('.') && !url.includes('/')) {
        return `/upload/blogs/${url}`;
    }
    return url.startsWith('/') ? url : `/${url}`;
}

function formatDate(date: string) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

function formatRelativeDate(date: string) {
    if (!date) return '';
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return formatDate(date);
}

function BlogImage({ blog, className = '' }: { blog: Blog; className?: string }) {
    const [error, setError] = useState(false);

    let src = blog.image_urls?.main || blog.imageurl;
    const finalSrc = getImageUrl(src);

    if (!finalSrc || error) {
        return (
            <div className={`w-full h-full flex flex-col items-center justify-center bg-neutral-50 text-neutral-300 ${className}`}>
                <ImageOff size={28} />
                <span className="text-[10px] mt-1.5 font-medium">No image</span>
            </div>
        );
    }

    return (
        <img
            src={finalSrc}
            alt={blog.title}
            className={`w-full h-full object-cover ${className}`}
            onError={() => setError(true)}
            loading="lazy"
        />
    );
}

function CardSkeleton() {
    return (
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden animate-pulse">
            <div className="h-52 bg-neutral-100" />
            <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="h-5 bg-neutral-100 rounded-full w-20" />
                    <div className="h-5 bg-neutral-100 rounded-full w-16" />
                </div>
                <div className="h-5 bg-neutral-100 rounded w-full" />
                <div className="h-5 bg-neutral-100 rounded w-4/5" />
                <div className="h-4 bg-neutral-100 rounded w-full" />
                <div className="h-4 bg-neutral-100 rounded w-3/4" />
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <div className="h-4 bg-neutral-100 rounded w-24" />
                    <div className="h-4 bg-neutral-100 rounded w-16" />
                </div>
            </div>
        </div>
    );
}

function BlogCard({
    blog,
    index,
    onEdit,
    onDelete,
    onView,
}: {
    blog: Blog;
    index: number;
    onEdit: () => void;
    onDelete: () => void;
    onView: () => void;
}) {
    const [showActions, setShowActions] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.4 }}
            className="bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all duration-300 group flex flex-col"
        >
            {/* Image Section */}
            <div className="relative h-52 overflow-hidden bg-neutral-100">
                <BlogImage blog={blog} className="group-hover:scale-105 transition-transform duration-500" />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-sm bg-white/90 ${STATUS_STYLE[blog.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[blog.status]}`} />
                        {STATUS_LABEL[blog.status]}
                    </span>
                </div>

                {/* Reading Time Badge */}
                {blog.reading_time > 0 && (
                    <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-black/50 text-white backdrop-blur-sm">
                            <Clock size={10} />
                            {blog.reading_time} min
                        </span>
                    </div>
                )}

                {/* Hover Action Buttons */}
                <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <button
                        onClick={onView}
                        className="p-2 bg-white/95 rounded-xl hover:bg-white shadow-sm transition-all hover:shadow-md"
                        title="View"
                    >
                        <Eye size={15} className="text-neutral-600" />
                    </button>
                    <button
                        onClick={onEdit}
                        className="p-2 bg-white/95 rounded-xl hover:bg-white shadow-sm transition-all hover:shadow-md"
                        title="Edit"
                    >
                        <Edit2 size={15} className="text-neutral-600" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 bg-white/95 rounded-xl hover:bg-red-50 shadow-sm transition-all hover:shadow-md"
                        title="Delete"
                    >
                        <Trash2 size={15} className="text-red-500" />
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex flex-col flex-1">
                {/* Category & Writer */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold">
                        <Tag size={10} />
                        {blog.category}
                    </span>
                    {blog.writer && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 font-medium">
                            <User size={10} />
                            {blog.writer}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-neutral-900 line-clamp-2 leading-snug mb-2 group-hover:text-neutral-700 transition-colors">
                    {blog.title}
                </h3>

                {/* Subtitle */}
                {blog.sub_title && (
                    <p className="text-[13px] text-neutral-500 line-clamp-1 mb-2 font-medium">
                        {blog.sub_title}
                    </p>
                )}

                {/* Excerpt */}
                {blog.excerpt && (
                    <p className="text-[12px] text-neutral-400 line-clamp-2 leading-relaxed flex-1">
                        {blog.excerpt}
                    </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                        <Calendar size={12} />
                        <span>{blog.publish_date ? formatRelativeDate(blog.publish_date) : formatRelativeDate(blog.created_at)}</span>
                    </div>

                    {/* Mobile action menu */}
                    <div className="relative md:hidden">
                        <button
                            onClick={() => setShowActions(!showActions)}
                            className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            <MoreVertical size={14} className="text-neutral-400" />
                        </button>
                        <AnimatePresence>
                            {showActions && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 bottom-full mb-1 bg-white border border-neutral-200 rounded-xl shadow-lg py-1 z-10 min-w-[120px]"
                                >
                                    <button onClick={() => { onView(); setShowActions(false); }} className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-50 w-full">
                                        <Eye size={13} /> View
                                    </button>
                                    <button onClick={() => { onEdit(); setShowActions(false); }} className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-50 w-full">
                                        <Edit2 size={13} /> Edit
                                    </button>
                                    <button onClick={() => { onDelete(); setShowActions(false); }} className="flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 w-full">
                                        <Trash2 size={13} /> Delete
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Slug preview */}
                    <span className="hidden md:block text-[10px] text-neutral-300 font-mono truncate max-w-[120px]">
                        /{blog.slug}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

export default function AdminBlogsPage() {
    const router = useRouter();
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [page, setPage] = useState(1);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const LIMIT = 9; // 3 per row × 3 rows = 9

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/v1/admin/blog-categories', { credentials: 'include' });
            const data = await res.json();
            if (data.success) {
                let categoriesData: Category[] = [];
                if (Array.isArray(data.data)) {
                    categoriesData = data.data;
                } else if (data.data?.categories && Array.isArray(data.data.categories)) {
                    categoriesData = data.data.categories;
                } else if (data.data?.list && Array.isArray(data.data.list)) {
                    categoriesData = data.data.list;
                } else {
                    const keys = Object.keys(data.data || {});
                    for (const key of keys) {
                        if (Array.isArray(data.data[key])) {
                            categoriesData = data.data[key];
                            break;
                        }
                    }
                }
                setCategories(categoriesData);
            } else {
                setCategories([]);
            }
        } catch {
            setCategories([]);
        }
    }, []);

    const fetchBlogs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams({
                page: String(page),
                limit: String(LIMIT),
                sort_by: sortBy,
            });
            if (status) params.set('status', status);
            if (category) params.set('category', category);
            if (search) params.set('search', search);

            const res = await fetch(`/api/v1/admin/blogs?${params}`, {
                credentials: 'include',
                headers: { 'Cache-Control': 'no-cache' },
            });

            if (!res.ok) {
                if (res.status === 401) { router.push('/admin/login'); return; }
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            if (data.success) {
                setBlogs(data.data || []);
                setMeta(data.meta || null);
            } else {
                setError(data.message || 'Failed to load blogs');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load blogs');
        } finally {
            setLoading(false);
        }
    }, [page, sortBy, status, category, search, router]);

    useEffect(() => {
        fetchCategories();
        fetchBlogs();
    }, [fetchCategories, fetchBlogs]);

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/v1/admin/blogs?id=${deleteId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Blog deleted successfully');
                setShowDelete(false);
                setDeleteId(null);
                fetchBlogs();
            } else {
                toast.error(data.message || 'Failed to delete');
            }
        } catch {
            toast.error('Failed to delete blog');
        } finally {
            setDeleting(false);
        }
    };

    const clearFilters = () => {
        setSearch('');
        setCategory('');
        setStatus('');
        setSortBy('newest');
        setPage(1);
        setError(null);
    };

    const hasFilters = search || category || status;
    const deleteBlog = blogs.find(b => b.id === deleteId);

    // Initial Loading
    if (loading && blogs.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-8 bg-neutral-200 rounded-lg w-36 animate-pulse" />
                        <div className="h-4 bg-neutral-100 rounded w-28 mt-2 animate-pulse" />
                    </div>
                    <div className="h-10 bg-neutral-200 rounded-xl w-32 animate-pulse" />
                </div>
                <div className="h-14 bg-neutral-100 rounded-2xl animate-pulse" />
                {/* 3 columns grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Blog Posts</h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {meta?.total || 0} {(meta?.total || 0) === 1 ? 'post' : 'posts'} total
                        {hasFilters && <span className="text-blue-500 ml-1">• Filtered</span>}
                    </p>
                </div>
                <button
                    onClick={() => router.push('/admin/blogs/new')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-all text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                    <Plus size={18} /> New Blog
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm">
                <form
                    onSubmit={(e) => { e.preventDefault(); setPage(1); fetchBlogs(); }}
                    className="flex flex-col lg:flex-row gap-3"
                >
                    <div className="flex-1 relative">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by title, content..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <select
                            value={category}
                            onChange={e => { setCategory(e.target.value); setPage(1); }}
                            className="px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 min-w-[140px] transition-all"
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => (
                                <option key={c.name} value={c.name}>{c.name} ({c.total_blogs})</option>
                            ))}
                        </select>

                        <select
                            value={status}
                            onChange={e => { setStatus(e.target.value); setPage(1); }}
                            className="px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 min-w-[130px] transition-all"
                        >
                            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>

                        <select
                            value={sortBy}
                            onChange={e => { setSortBy(e.target.value); setPage(1); }}
                            className="px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 min-w-[130px] transition-all"
                        >
                            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>

                        <div className="flex gap-1.5">
                            <button
                                type="submit"
                                className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 text-sm font-medium transition-all active:scale-[0.98]"
                            >
                                Search
                            </button>
                            <button
                                type="button"
                                onClick={() => { fetchBlogs(); }}
                                className="p-2.5 hover:bg-neutral-100 rounded-xl transition-colors border border-neutral-200"
                                title="Refresh"
                            >
                                <RefreshCw size={16} className={`text-neutral-500 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="p-2.5 hover:bg-red-50 rounded-xl transition-colors border border-neutral-200"
                                    title="Clear filters"
                                >
                                    <X size={16} className="text-red-400" />
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {/* Error State */}
            {error && !loading && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl"
                >
                    <AlertTriangle size={18} className="text-red-500 shrink-0" />
                    <p className="text-sm text-red-600 flex-1">{error}</p>
                    <button onClick={fetchBlogs} className="text-xs font-medium text-red-700 hover:underline">
                        Retry
                    </button>
                </motion.div>
            )}

            {/* Blog Grid — 3 columns */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
            ) : blogs.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 bg-white border border-neutral-200 rounded-2xl"
                >
                    <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
                        <FileText size={28} className="text-neutral-300" />
                    </div>
                    <h3 className="text-base font-semibold text-neutral-900">
                        {hasFilters ? 'No matching blogs' : 'No blogs yet'}
                    </h3>
                    <p className="text-sm text-neutral-400 mt-1.5 text-center max-w-xs">
                        {hasFilters
                            ? 'Try adjusting your filters or search query'
                            : 'Get started by creating your first blog post'
                        }
                    </p>
                    <div className="flex gap-2 mt-5">
                        {hasFilters ? (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1.5 px-4 py-2 border border-neutral-200 rounded-xl text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
                            >
                                <X size={14} /> Clear Filters
                            </button>
                        ) : (
                            <button
                                onClick={() => router.push('/admin/blogs/new')}
                                className="flex items-center gap-1.5 px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-all"
                            >
                                <Plus size={16} /> Create Blog
                            </button>
                        )}
                    </div>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {blogs.map((blog, i) => (
                        <BlogCard
                            key={blog.id}
                            blog={blog}
                            index={i}
                            onView={() => router.push(`/blog/${blog.slug}`)}
                            onEdit={() => router.push(`/admin/blogs/edit/${blog.id}`)}
                            onDelete={() => { setDeleteId(blog.id); setShowDelete(true); }}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <p className="text-sm text-neutral-400">
                        Showing{' '}
                        <span className="font-medium text-neutral-600">
                            {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)}
                        </span>
                        {' '}of{' '}
                        <span className="font-medium text-neutral-600">{meta.total}</span>
                        {' '}posts
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors"
                        >
                            <ChevronLeft size={16} />
                            <span className="hidden sm:inline">Previous</span>
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                                .filter(p => {
                                    if (meta.totalPages <= 5) return true;
                                    if (p === 1 || p === meta.totalPages) return true;
                                    if (Math.abs(p - page) <= 1) return true;
                                    return false;
                                })
                                .map((p, idx, arr) => {
                                    const prev = arr[idx - 1];
                                    const showDots = prev && p - prev > 1;
                                    return (
                                        <span key={p} className="flex items-center gap-1">
                                            {showDots && (
                                                <span className="px-1 text-neutral-300 text-sm">…</span>
                                            )}
                                            <button
                                                onClick={() => setPage(p)}
                                                className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                                                    p === page
                                                        ? 'bg-neutral-900 text-white shadow-sm'
                                                        : 'hover:bg-neutral-100 text-neutral-600'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        </span>
                                    );
                                })}
                        </div>

                        <button
                            onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                            disabled={page === meta.totalPages}
                            className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors"
                        >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            <AnimatePresence>
                {showDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => !deleting && setShowDelete(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-start gap-4 mb-5">
                                <div className="p-3 bg-red-50 rounded-2xl shrink-0">
                                    <AlertTriangle size={24} className="text-red-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-neutral-900">Delete Blog Post</h2>
                                    <p className="text-sm text-neutral-400 mt-0.5">This action cannot be undone</p>
                                </div>
                            </div>

                            {deleteBlog && (
                                <div className="p-3 bg-neutral-50 rounded-xl mb-5 flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-neutral-200">
                                        <BlogImage blog={deleteBlog} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-neutral-900 truncate">{deleteBlog.title}</p>
                                        <p className="text-xs text-neutral-400">{deleteBlog.category} • {formatDate(deleteBlog.created_at)}</p>
                                    </div>
                                </div>
                            )}

                            <p className="text-sm text-neutral-600 mb-6">
                                Are you sure you want to delete this blog post? All associated data will be permanently removed.
                            </p>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowDelete(false)}
                                    disabled={deleting}
                                    className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-60 transition-all active:scale-[0.98]"
                                >
                                    {deleting ? (
                                        <>
                                            <Loader2 size={15} className="animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={15} />
                                            Delete Post
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}