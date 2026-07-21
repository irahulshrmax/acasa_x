'use client';

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  FiArrowLeft,
  FiSave,
  FiTag,
  FiUser,
  FiCalendar,
} from "react-icons/fi";
import { ImageUpload } from "@/app/admin/components/ImageUpload";

interface Category {
  name: string;
  slug: string;
  total_blogs: number;
}

interface BlogFormData {
  id: number;
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
  { value: 1, label: "Published" },
  { value: 0, label: "Draft" },
  { value: 2, label: "Archived" },
];

export default function AdminBlogEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<BlogFormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // ✅ FIX: Use query param instead of path param
        const blogRes = await fetch(`/api/v1/admin/blogs?id=${id}`, {
          credentials: "include",
        });
        const blogData = await blogRes.json();
        
        console.log('📡 Edit blog response:', blogData);
        
        if (!blogData.success) {
          toast.error(blogData.message || "Blog not found");
          router.push("/admin/blogs");
          return;
        }
        setFormData(blogData.data);

        const catRes = await fetch("/api/v1/admin/blog-categories", {
          credentials: "include",
        });
        const catData = await catRes.json();
        if (catData.success) {
          // ✅ Handle categories response
          const categoriesData = catData.data?.categories || catData.data || [];
          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        }
      } catch (error: any) {
        console.error('❌ Error fetching data:', error);
        toast.error(error.message || "Failed to load blog");
        router.push("/admin/blogs");
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchData();
    }
  }, [id, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: name === "status" ? parseInt(value) : value,
      };
    });
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageUpload = (url: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, imageurl: url };
    });
    if (errors.imageurl) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.imageurl;
        return newErrors;
      });
    }
  };

  const handleImageRemove = () => {
    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, imageurl: "" };
    });
  };

  const validate = (): boolean => {
    if (!formData) return false;
    const newErrors: Record<string, string> = {};
    if (!formData.title || formData.title.length < 3) {
      newErrors.title = "Title is required (min 3 characters)";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (!formData.descriptions || formData.descriptions.length < 20) {
      newErrors.descriptions = "Description is required (min 20 characters)";
    }
    if (!formData.imageurl) {
      newErrors.imageurl = "Featured image is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !validate()) {
      toast.error("Please fix all errors");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/admin/blogs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Blog updated successfully!");
        setTimeout(() => router.push("/admin/blogs"), 800);
      } else {
        if (data.errors) {
          setErrors(data.errors);
          toast.error("Please fix all errors");
        } else {
          toast.error(data.message || "Failed to update blog");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update blog");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="min-h-screen bg-neutral-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500">Loading blog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 p-4 md:p-6 lg:p-8">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors mb-2 text-sm"
            >
              <FiArrowLeft size={18} />
              Back
            </button>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Edit Blog</h1>
            <p className="text-sm text-neutral-500 mt-1">Update your blog post</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/blogs")}
              className="px-5 py-2.5 border border-neutral-200 rounded-xl text-neutral-600 hover:bg-neutral-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave size={18} />
                  Update
                </>
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-sm">
              <label className="block font-semibold text-neutral-900 mb-4">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
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
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition-all text-base"
              />
            </div>

            <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-sm">
              <label className="block font-semibold text-neutral-900 mb-4">Sub Title</label>
              <input
                type="text"
                name="sub_title"
                value={formData.sub_title || ""}
                onChange={handleChange}
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
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all resize-y text-base ${
                  errors.descriptions
                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                    : "border-neutral-200 focus:ring-neutral-900/20 focus:border-neutral-900"
                }`}
              />
              {errors.descriptions && <p className="mt-2 text-sm text-red-500">{errors.descriptions}</p>}
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
                    value={formData.publish_date || ""}
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
                    value={formData.writer || ""}
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
                    value={formData.seo_title || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition-all text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1.5">SEO Keywords</label>
                  <input
                    type="text"
                    name="seo_keywork"
                    value={formData.seo_keywork || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition-all text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-600 mb-1.5">SEO Description</label>
                  <textarea
                    name="seo_description"
                    value={formData.seo_description || ""}
                    onChange={handleChange}
                    rows={3}
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