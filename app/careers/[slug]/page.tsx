// app/careers/[slug]/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Share2,
  ChevronLeft,
  Loader2,
  MapPin,
  Phone,
  Calendar,
  Building2,
  Shield,
  ExternalLink,
  Check,
  MessageCircle,
  Briefcase,
  Users,
  Mail,
  Clock,
  Award,
  CheckCircle,
  X,
  AlertCircle,
} from "lucide-react";

const API_URL = "/api/v1/jobs";
const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME = {
  primary: "#0F1C2E",
  secondary: "#1A2F4A",
  accent: "#C9A96E",
  accentLight: "#F5ECD7",
  muted: "#6B7A8D",
  border: "#E2E8F0",
  surface: "#F8FAFC",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
};

interface Job {
  id: number;
  title: string;
  description: string;
  sub_description: string | null;
  sub_title: string | null;
  type: string;
  link: string;
  city_name: string | null;
  status: number;
  created_at: string | null;
  updated_at: string | null;
  slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keyword: string | null;
  about_team: string | null;
  about_company: string | null;
  responsibilities: string | null;
  social: string | null;
}

function getJobTypeColor(type: string): string {
  if (type.includes("Remote")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (type.includes("Full-time")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (type.includes("Part-time")) return "bg-purple-50 text-purple-700 border-purple-200";
  if (type.includes("Contract")) return "bg-orange-50 text-orange-700 border-orange-200";
  if (type.includes("Internship")) return "bg-pink-50 text-pink-700 border-pink-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

function getDaysAgo(date: string | null): string {
  if (!date) return "Recently";
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
  return `${Math.floor(diff / 365)} years ago`;
}

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="relative mx-auto h-16 w-16">
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: `${THEME.accent}30` }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{ borderTopColor: THEME.accent, borderRightColor: THEME.accent }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-[6px] rounded-full border-2 border-transparent"
            style={{ borderBottomColor: THEME.primary, borderLeftColor: THEME.primary }}
            animate={{ rotate: -360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <motion.p
          className="mt-5 text-[10px] uppercase tracking-[0.3em]"
          style={{ color: THEME.muted }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Loading Job
        </motion.p>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    cover_letter: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchJob = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}?slug=${slug}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || "Job not found");
        }
        
        if (!data.success || !data.data) {
          throw new Error("Job not found");
        }
        
        setJob(data.data);
      } catch (err: any) {
        setError(err.message || "Failed to load job");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [slug]);

  const handleShare = useCallback(async () => {
    if (!job) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: job.title || "Job",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {}
  }, [job]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/jobs/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job?.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          cover_letter: formData.cover_letter,
          resume_url: "",
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to submit application");

      setFormSuccess(true);
      setFormData({ first_name: "", last_name: "", email: "", phone: "", cover_letter: "" });
      setTimeout(() => setFormSuccess(false), 5000);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  if (error || !job) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center px-4 max-w-md">
          <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h1
            className="text-2xl font-light"
            style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
          >
            Position Not Found
          </h1>
          <p className="text-sm text-red-500 my-4">{error || "The position you're looking for doesn't exist."}</p>
          <div className="mt-4 p-4 bg-gray-50 rounded text-xs text-left font-mono overflow-auto max-h-32 border border-gray-200">
            <p><strong>Slug:</strong> {slug}</p>
            <p><strong>API:</strong> {API_URL}?slug={slug}</p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-[11px] tracking-widest text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: THEME.primary }}
            >
              <ArrowLeft className="h-4 w-4" />
              All Jobs
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-200 px-6 py-2.5 text-[11px] tracking-widest text-gray-700 hover:bg-gray-300"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const typeColor = getJobTypeColor(job.type || "");
  const daysAgo = getDaysAgo(job.created_at);
  const jobSlug = job.link || job.slug || `job-${job.id}`;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      <div className="border-b" style={{ borderColor: THEME.border, backgroundColor: THEME.surface }}>
        <div className="mx-auto max-w-[1180px] px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
              <Link href="/" className="hover:text-gray-600 transition-colors">
                Home
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <Link href="/careers" className="hover:text-gray-600 transition-colors">
                Careers
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="truncate max-w-[120px] sm:max-w-none text-gray-500">
                {job.title || "Position"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex h-9 w-9 items-center justify-center border border-gray-200 bg-white text-gray-500 transition-all hover:border-gray-300 hover:text-gray-700"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-4 pt-8 pb-6 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`rounded-[3px] px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.12em] border ${typeColor}`}>
                {job.type || "Full-time"}
              </span>
              {job.status === 1 && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Shield className="h-2.5 w-2.5" />
                  Active
                </span>
              )}
              {job.city_name && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-gray-100 text-gray-700 border border-gray-200">
                  <MapPin className="h-2.5 w-2.5" />
                  {job.city_name}
                </span>
              )}
            </div>

            <h1
              className="text-[24px] leading-tight sm:text-[32px] md:text-[38px]"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              {job.title || "Position"}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px]" style={{ color: THEME.muted }}>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Posted {daysAgo}</span>
              </div>
              {job.created_at && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date(job.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" })}
              className="px-6 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition-all hover:opacity-90"
              style={{ backgroundColor: THEME.primary }}
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-4 py-6 md:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr_1fr]">
          <div>
            {job.description && (
              <div className="mb-10">
                <h2
                  className="text-[20px] sm:text-[24px] mb-4"
                  style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
                >
                  Job Description
                </h2>
                <div
                  className="prose prose-sm max-w-none text-[13px] leading-relaxed"
                  style={{ color: "#4A5462" }}
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              </div>
            )}

            {job.sub_description && (
              <div className="mb-10 border-t pt-8" style={{ borderColor: THEME.border }}>
                <h2
                  className="text-[20px] sm:text-[24px] mb-4"
                  style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
                >
                  {job.sub_title || "Requirements"}
                </h2>
                <div
                  className="prose prose-sm max-w-none text-[13px] leading-relaxed"
                  style={{ color: "#4A5462" }}
                  dangerouslySetInnerHTML={{ __html: job.sub_description }}
                />
              </div>
            )}

            {job.responsibilities && (
              <div className="mb-10 border-t pt-8" style={{ borderColor: THEME.border }}>
                <h2
                  className="text-[20px] sm:text-[24px] mb-4"
                  style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
                >
                  Responsibilities
                </h2>
                <div
                  className="prose prose-sm max-w-none text-[13px] leading-relaxed"
                  style={{ color: "#4A5462" }}
                  dangerouslySetInnerHTML={{ __html: job.responsibilities }}
                />
              </div>
            )}

            {job.about_team && (
              <div className="mb-10 border-t pt-8" style={{ borderColor: THEME.border }}>
                <h2
                  className="text-[20px] sm:text-[24px] mb-4"
                  style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
                >
                  About the Team
                </h2>
                <div
                  className="prose prose-sm max-w-none text-[13px] leading-relaxed"
                  style={{ color: "#4A5462" }}
                  dangerouslySetInnerHTML={{ __html: job.about_team }}
                />
              </div>
            )}

            {job.about_company && (
              <div className="border-t pt-8" style={{ borderColor: THEME.border }}>
                <h2
                  className="text-[20px] sm:text-[24px] mb-4"
                  style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
                >
                  About ACASA
                </h2>
                <div
                  className="prose prose-sm max-w-none text-[13px] leading-relaxed"
                  style={{ color: "#4A5462" }}
                  dangerouslySetInnerHTML={{ __html: job.about_company }}
                />
              </div>
            )}
          </div>

          <aside id="apply">
            <div className="sticky top-6">
              <div className="border bg-white" style={{ borderColor: THEME.border }}>
                <div className="border-b p-5" style={{ borderColor: THEME.border, backgroundColor: THEME.primary }}>
                  <h3
                    className="text-[16px] font-normal text-white"
                    style={{ fontFamily: FONT_DISPLAY }}
                  >
                    Apply for this Position
                  </h3>
                  <p className="mt-0.5 text-[10px] tracking-[0.1em] text-white/50">
                    {job.title}
                  </p>
                </div>

                <div className="p-5">
                  {formSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-8 text-center"
                    >
                      <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
                      <p className="mt-3 text-[14px] font-medium" style={{ color: THEME.primary }}>
                        Application Submitted!
                      </p>
                      <p className="mt-1 text-[12px]" style={{ color: THEME.muted }}>
                        We'll review your application and get back to you soon.
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-3.5">
                      {formError && (
                        <div className="flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-[11px] text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          {formError}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
                            First Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="first_name"
                            required
                            value={formData.first_name}
                            onChange={handleFormChange}
                            placeholder="John"
                            className="mt-1 w-full border border-gray-200 px-3 py-2.5 text-[12px] transition-all focus:border-gray-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
                            Last Name
                          </label>
                          <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleFormChange}
                            placeholder="Doe"
                            className="mt-1 w-full border border-gray-200 px-3 py-2.5 text-[12px] transition-all focus:border-gray-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
                          Email Address <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleFormChange}
                          placeholder="you@email.com"
                          className="mt-1 w-full border border-gray-200 px-3 py-2.5 text-[12px] transition-all focus:border-gray-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
                          Phone Number <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleFormChange}
                          placeholder="+971 50 000 0000"
                          className="mt-1 w-full border border-gray-200 px-3 py-2.5 text-[12px] transition-all focus:border-gray-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
                          Cover Letter
                        </label>
                        <textarea
                          name="cover_letter"
                          rows={4}
                          value={formData.cover_letter}
                          onChange={handleFormChange}
                          placeholder="Tell us why you're a great fit for this role..."
                          className="mt-1 w-full resize-none border border-gray-200 px-3 py-2.5 text-[12px] transition-all focus:border-gray-400 focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={formSubmitting}
                        className="w-full py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ backgroundColor: THEME.primary }}
                      >
                        {formSubmitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Submitting
                          </span>
                        ) : (
                          "Submit Application"
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <Link
                href="/careers"
                className="mt-3 flex items-center justify-center gap-2 border py-3 text-[10px] font-medium uppercase tracking-[0.15em] transition-all hover:bg-gray-50"
                style={{ borderColor: THEME.border, color: THEME.muted }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All Jobs
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <div className="h-20 sm:hidden" />
    </div>
  );
}