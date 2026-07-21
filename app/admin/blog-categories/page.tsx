"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Plus, Edit2, Trash2, Search, X, Check,
  RefreshCw, Tag, BookOpen, Clock, Calendar,
  ArrowUp, ArrowDown, Loader2, AlertTriangle,
} from "lucide-react";

interface Category {
  name       : string;
  slug       : string;
  total_blogs: number;
  first_used : string;
  last_used  : string;
}

type SortField = "name" | "total" | "newest";

export default function AdminCategoriesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading   ] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal,  setShowModal ] = useState(false);
  const [editing,    setEditing   ] = useState<Category | null>(null);
  const [formName,   setFormName  ] = useState("");
  const [sortBy,     setSortBy    ] = useState<SortField>("total");
  const [sortOrder,  setSortOrder ] = useState<"asc" | "desc">("desc");
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/blog-categories", { credentials: "include" });

      if (!res.ok) {
        if (res.status === 401) { router.push("/admin/login"); return; }
        throw new Error("Failed to fetch categories");
      }

      const data = await res.json();
      if (data.success) {
        setCategories(data.data.categories);
      } else {
        toast.error(data.message || "Failed to load categories");
      }
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ── Create ─────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    const name = formName.trim();
    if (name.length < 2) { toast.error("Name must be at least 2 characters"); return; }

    setSubmitting(true);
    try {
      const res  = await fetch("/api/v1/admin/blog-categories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }), credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Category created");
        closeModal();
        fetchCategories();
      } else {
        toast.error(data.message || "Failed to create");
      }
    } catch {
      toast.error("Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Update ─────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!editing) return;
    const name = formName.trim();
    if (name.length < 2) { toast.error("Name must be at least 2 characters"); return; }

    setSubmitting(true);
    try {
      const res  = await fetch("/api/v1/admin/blog-categories", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_name: editing.name, new_name: name }), credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Category updated");
        closeModal();
        fetchCategories();
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch {
      toast.error("Failed to update category");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (cat: Category) => {
    if (!confirm(`Delete "${cat.name}"?\n${cat.total_blogs} blogs will be moved to "Uncategorized".`)) return;

    try {
      const res  = await fetch(
        `/api/v1/admin/blog-categories?category=${encodeURIComponent(cat.name)}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();

      if (data.success) {
        toast.success(`"${cat.name}" deleted`);
        fetchCategories();
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete category");
    }
  };

  // ── Modal helpers ──────────────────────────────────────────────────────
  const openCreate = () => { setEditing(null); setFormName(""); setShowModal(true); };
  const openEdit   = (cat: Category) => { setEditing(cat); setFormName(cat.name); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); setFormName(""); };

  // ── Sort & filter ─────────────────────────────────────────────────────
  const toggleSort = (field: SortField) => {
    if (sortBy === field) { setSortOrder(o => o === "asc" ? "desc" : "asc"); }
    else { setSortBy(field); setSortOrder("desc"); }
  };

  const filtered = categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortOrder === "asc" ? 1 : -1;
    if (sortBy === "name")   return dir * a.name.localeCompare(b.name);
    if (sortBy === "total")  return dir * (a.total_blogs - b.total_blogs);
    return dir * (new Date(a.last_used).getTime() - new Date(b.last_used).getTime());
  });

  // ── Stats ──────────────────────────────────────────────────────────────
  const totalBlogs    = categories.reduce((s, c) => s + c.total_blogs, 0);
  const mostUsed      = categories.length > 0
    ? [...categories].sort((a, b) => b.total_blogs - a.total_blogs)[0]?.name
    : "-";
  const latestCategory = categories.length > 0
    ? [...categories].sort((a, b) => new Date(b.last_used).getTime() - new Date(a.last_used).getTime())[0]?.name
    : "-";

  const isFormValid = formName.trim().length >= 2;

  // ── Sort button ────────────────────────────────────────────────────────
  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
        sortBy === field
          ? "bg-neutral-900 text-white"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
      }`}
    >
      {label}
      {sortBy === field && (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
    </button>
  );

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 size={28} className="animate-spin text-neutral-400 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Blog Categories</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            {categories.length} categories total
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New Category
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Categories", value: categories.length, icon: Tag     },
          { label: "Total Blogs",      value: totalBlogs,         icon: BookOpen },
          { label: "Most Used",        value: mostUsed,           icon: Clock    },
          { label: "Latest",           value: latestCategory,     icon: Calendar },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-neutral-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-50 rounded-lg">
                <stat.icon size={16} className="text-neutral-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-neutral-400">{stat.label}</p>
                <p className="text-lg font-semibold text-neutral-900 truncate">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Sort ───────────────────────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-neutral-400 transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <SortButton field="name"   label="Name"   />
            <SortButton field="total"  label="Blogs"  />
            <SortButton field="newest" label="Newest" />
            <button
              onClick={fetchCategories}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={15} className="text-neutral-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <AnimatePresence>
          {sorted.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-14">
              <Tag size={32} className="text-neutral-200 mb-3" />
              <h3 className="text-sm font-medium text-neutral-900">No categories found</h3>
              <p className="text-xs text-neutral-400 mt-1">
                {searchTerm ? "Try adjusting your search" : "Create your first category"}
              </p>
              {!searchTerm && (
                <button
                  onClick={openCreate}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs hover:bg-neutral-800"
                >
                  <Plus size={14} />
                  Create Category
                </button>
              )}
            </div>
          ) : (
            sorted.map(cat => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-neutral-900 truncate">{cat.name}</h3>
                    <p className="text-[10px] text-neutral-400 mt-0.5 truncate">/{cat.slug}</p>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400">Blogs</span>
                    <span className="text-xs font-medium text-neutral-900">{cat.total_blogs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400">Last used</span>
                    <span className="text-[11px] text-neutral-400">
                      {cat.last_used ? new Date(cat.last_used).toLocaleDateString() : "-"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer count ────────────────────────────────────────────── */}
      <p className="text-center text-xs text-neutral-400">
        Showing {sorted.length} of {categories.length} categories
      </p>

      {/* ── Modal ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-900">
                  {editing ? "Edit Category" : "Create Category"}
                </h2>
                <button onClick={closeModal} className="p-1 hover:bg-neutral-100 rounded-lg">
                  <X size={18} className="text-neutral-500" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g., Luxury Living"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-neutral-400"
                    autoFocus
                    onKeyDown={e => { if (e.key === "Enter" && isFormValid) editing ? handleUpdate() : handleCreate(); }}
                  />
                  <p className="mt-1 text-[10px] text-neutral-400">
                    {editing ? `Currently: "${editing.name}"` : "Minimum 2 characters"}
                  </p>
                </div>

                {editing && (
                  <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700">This will update all blogs with this category</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2.5 mt-5 pt-4 border-t border-neutral-100">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-neutral-200 rounded-xl text-sm text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={editing ? handleUpdate : handleCreate}
                  disabled={!isFormValid || submitting}
                  className={`flex-1 px-4 py-2 rounded-xl text-sm text-white font-medium flex items-center justify-center gap-1.5 ${
                    !isFormValid || submitting
                      ? "bg-neutral-300 cursor-not-allowed"
                      : "bg-neutral-900 hover:bg-neutral-800"
                  }`}
                >
                  {submitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : editing ? (
                    <><Check size={14} /> Update</>
                  ) : (
                    <><Plus size={14} /> Create</>
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