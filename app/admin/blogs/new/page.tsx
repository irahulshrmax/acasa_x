'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  FiArrowLeft,
  FiSave,
  FiTag,
  FiUpload,
  FiCheck,
  FiAlertCircle,
  FiCalendar,
  FiUser,
} from "react-icons/fi";
import { ImageUpload } from "@/app/admin/components/ImageUpload";

interface Category {
  name: string;
  slug: string;
  total_blogs: number;
}

interface BlogFormData {
  title: string;
  slug: string;
  sub_title: string;
  writer: string;
  publish_date: string;
  category: string;
  imageurl: string;
  descriptions: string;
  status: number;
  seo_title: string;
  seo_keywork: string;
  seo_description: string;
}

const STATUS_OPTIONS = [
  { value: 1, label: "Published", color: "emerald" },
  { value: 0, label: "Draft", color: "amber" },
  { value: 2, label: "Archived", color: "neutral" },
];

const MIN_TITLE_LENGTH = 3;
const MIN_DESCRIPTION_LENGTH = 20;

const INITIAL_FORM_DATA: BlogFormData = {
  title: "",
  slug: "",
  sub_title: "",
  writer: "",
  publish_date: "",
  category: "",
  imageurl: "",
  descriptions: "",
  status: 1,
  seo_title: "",
  seo_keywork: "",
  seo_description: "",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-neutral-900 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(progress, 100)}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}

export default function AdminBlogCreatePage() {
  const router = useRouter();
  const slugManuallyEditedRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<BlogFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!slugManuallyEditedRef.current) {
      setFormData((prev) => ({ ...prev, slug: slugify(prev.title) }));
    }
  }, [formData.title]);

  useEffect(() => {
    let cancelled = false;
    async function fetchCategories() {
      try {
        const res = await fetch("/api/v1/admin/blog-categories", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.success) {
          setCategories(data.data.categories);
        }
      } catch {
        toast.error("Failed to load categories");
      }
    }
    fetchCategories();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "slug") {
      slugManuallyEditedRef.current = true;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: name === "status" ? parseInt(value, 10) : value,
    }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, imageurl: url }));
    if (errors.imageurl) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.imageurl;
        return next;
      });
    }
  };

  const handleImageRemove = () => {
    setFormData((prev) => ({ ...prev, imageurl: "" }));
  };

  const generateSlug = () => {
    if (!formData.title) {
      toast.error("Please enter a title first");
      return;
    }
    slugManuallyEditedRef.current = true;
    setFormData((prev) => ({ ...prev, slug: slugify(prev.title) }));
    toast.success("Slug generated!");
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title || formData.title.trim().length < MIN_TITLE_LENGTH) {
      newErrors.title = `Title is required (min ${MIN_TITLE_LENGTH} characters)`;
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (!formData.descriptions || formData.descriptions.trim().length < MIN_DESCRIPTION_LENGTH) {
      newErrors.descriptions = `Description is required (min ${MIN_DESCRIPTION_LENGTH} characters)`;
    }
    if (!formData.imageurl) {
      newErrors.imageurl = "Featured image is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!validate()) {
      toast.error("Please fix all errors");
      return;
    }

    setLoading(true);
    setProgress(30);

    try {
      const res = await fetch("/api/v1/admin/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      setProgress(70);
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) {
          setErrors(data.errors);
          toast.error("Please fix all errors");
        } else {
          toast.error(data.message || "Failed to create blog");
        }
        setProgress(0);
        return;
      }

      setProgress(100);
      toast.success("Blog created successfully!");
      setTimeout(() => router.push("/admin/blogs"), 800);
    } catch (error: any) {
      toast.error(error?.message || "Failed to create blog");
      setProgress(0);
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 p-4 md:p-6 lg:p-8">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors mb-2 text-sm"
            >
              <FiArrowLeft size={18} />
              Back
            </button>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Create New Blog</h1>
            <p className="text-sm text-neutral-500 mt-1">Fill in the details to create a new blog post</p>
          </div>
          <div className="flex items-center gap-3">
            {loading && (
              <div className="w-48">
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span>Saving...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <ProgressBar progress={progress} />
              </div>
            )}
            <button
              type="button"
              onClick={() => router.push("/admin/blogs")}
              className="px-5 py-2.5 border border-neutral-200 rounded-xl text-neutral-600 hover:bg-neutral-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="blog-create-form"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave size={18} />
                  Publish
                </>
              )}
            </button>
          </div>
        </div>

        <form id="blog-create-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <label className="font-semibold text-neutral-900">Title *</label>
                <button
                  type="button"
                  onClick={generateSlug}
                  className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 rounded-lg"
                >
                  <FiTag size={12} />
                  Generate Slug
                </button>
              </div>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter blog title..."
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-base ${
                  errors.title
                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                    : "border-neutral-200 focus:ring-neutral-900/20 focus:border-neutral-900"
                }`}
              />
              {errors.title && <p className="mt-2 text-sm text-red-500">{errors.title}</p>}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-sm">
              <label className="block font-semibold text-neutral-900 mb-4">Slug</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="auto-generated-slug"
                  className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition-all text-base"
                />
                <span className="text-sm text-neutral-400 bg-neutral-50 px-4 py-2.5 rounded-xl border border-neutral-200 whitespace-nowrap">
                  /{formData.slug || "slug"}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-2">Leave empty to auto-generate from title</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-sm">
              <label className="block font-semibold text-neutral-900 mb-4">Sub Title</label>
              <input
                type="text"
                name="sub_title"
                value={formData.sub_title}
                onChange={handleChange}
                placeholder="Short description or subtitle..."
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition-all text-base"
              />
            </div>

            <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-sm">
              <label className="block font-semibold text-neutral-900 mb-4">Content *</label>
              <textarea
                name="descriptions"
                value={formData.descriptions}
                onChange={handleChange}
                rows={14}
                placeholder="Write your blog content here... (HTML supported)"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all resize-y text-base ${
                  errors.descriptions
                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                    : "border-neutral-200 focus:ring-neutral-900/20 focus:border-neutral-900"
                }`}
              />
              {errors.descriptions && <p className="mt-2 text-sm text-red-500">{errors.descriptions}</p>}
              <div className="flex justify-between mt-2 text-xs text-neutral-400">
                <span>{formData.descriptions.length} characters</span>
                <span>Min {MIN_DESCRIPTION_LENGTH} characters</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-sm">
              <ImageUpload
                onUpload={handleImageUpload}
                onRemove={handleImageRemove}
                existingImage={formData.imageurl}
                label="Featured Image"
                required={true}
                maxSizeMB={5}
              />
              {errors.imageurl && <p className="mt-2 text-sm text-red-500">{errors.imageurl}</p>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-sm">
              <h3 className="font-semibold text-neutral-900 mb-5">Status & Publishing</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-600 mb-1.5">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition-all text-base bg-white"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1.5">Publish Date</label>
                  <input
                    type="date"
                    name="publish_date"
                    value={formData.publish_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition-all text-base"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-sm">
              <h3 className="font-semibold text-neutral-900 mb-5">Category & Author</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-600 mb-1.5">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-base bg-white ${
                      errors.category
                        ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                        : "border-neutral-200 focus:ring-neutral-900/20 focus:border-neutral-900"
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name} ({cat.total_blogs})
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-2 text-sm text-red-500">{errors.category}</p>}
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1.5">Author / Writer</label>
                  <input
                    type="text"
                    name="writer"
                    value={formData.writer}
                    onChange={handleChange}
                    placeholder="Author name"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition-all text-base"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-sm">
              <h3 className="font-semibold text-neutral-900 mb-5">SEO Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-600 mb-1.5">SEO Title</label>
                  <input
                    type="text"
                    name="seo_title"
                    value={formData.seo_title}
                    onChange={handleChange}
                    placeholder="Meta title"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition-all text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1.5">SEO Keywords</label>
                  <input
                    type="text"
                    name="seo_keywork"
                    value={formData.seo_keywork}
                    onChange={handleChange}
                    placeholder="keyword1, keyword2, keyword3"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition-all text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1.5">SEO Description</label>
                  <textarea
                    name="seo_description"
                    value={formData.seo_description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Meta description"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition-all resize-none text-base"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}