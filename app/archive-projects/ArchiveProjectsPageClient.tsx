// app/archive-projects/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Building2, MapPin, BedDouble, ArrowLeft, Home, Calendar, TrendingUp } from "lucide-react";

const API_URL = "/api/v1/archive-projects";

interface ArchiveProject {
  id: number;
  title: string;
  slug: string;
  location: string;
  price: string;
  image: string | null;
  featured: boolean;
  beds: string;
  sqft: string;
  handover: string;
  listingType: string;
  description: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface StatsData {
  total: number;
  offPlan: number;
  resale: number;
}

function getUnsplashFallback(title?: string | null): string {
  const query = encodeURIComponent(title || "luxury project dubai");
  return `https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&q=80`;
}

function ArchiveImage({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  const [error, setError] = useState(false);

  const imageUrl = error ? getUnsplashFallback(alt) : (src || getUnsplashFallback(alt));

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${className}`}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}

function ArchiveCard({ project }: { project: ArchiveProject }) {
  const bedsList = project.beds && project.beds !== "N/A" 
    ? project.beds.split(",").slice(0, 2).join(", ") + (project.beds.split(",").length > 2 ? "..." : "")
    : "N/A";

  return (
    <Link
      href={`/archive-projects/${project.slug}`}
      className="group block overflow-hidden rounded-xl border border-[#1A2233]/10 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <ArchiveImage src={project.image} alt={project.title} />
        <div className="absolute left-3 top-3 rounded bg-red-600 px-3 py-1 text-[10px] uppercase tracking-wider text-white">
          Archived
        </div>
        {project.featured && (
          <div className="absolute right-3 top-3 rounded bg-amber-500 px-3 py-1 text-[10px] uppercase tracking-wider text-white">
            Featured
          </div>
        )}
        {project.listingType && (
          <div className="absolute bottom-3 left-3 rounded bg-black/70 px-3 py-1 text-[10px] uppercase tracking-wider text-white backdrop-blur-sm">
            {project.listingType}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 text-base font-semibold text-[#1A2233]" style={{ fontFamily: "'Playfair Display', serif" }}>
          {project.title}
        </h3>

        {project.location && (
          <div className="mt-1 flex items-center gap-1 text-xs text-[#1A2233]/60">
            <MapPin className="h-3 w-3" />
            {project.location}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs text-[#1A2233]/60">
            {bedsList && bedsList !== "N/A" && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5" />
                {bedsList}
              </span>
            )}
            {project.sqft && project.sqft !== "N/A" && (
              <span className="flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
                {project.sqft}
              </span>
            )}
            {project.handover && project.handover !== "TBA" && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {project.handover}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-[#1A2233]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {project.price}
          </p>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-[#1A2233]/10 bg-white">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="p-4">
        <div className="h-5 w-3/4 bg-gray-200 rounded" />
        <div className="mt-2 h-4 w-1/2 bg-gray-200 rounded" />
        <div className="mt-3 flex justify-between">
          <div className="h-4 w-1/3 bg-gray-200 rounded" />
          <div className="h-4 w-1/4 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function ArchiveProjectsPage() {
  const [projects, setProjects] = useState<ArchiveProject[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}?page=${page}&limit=12`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch");
      setProjects(data.data || []);
      setPagination(data.pagination || null);
      setStats(data.stats || null);
    } catch (err: any) {
      setError(err.message || "Failed to load archive projects");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-white py-20">
        <div className="mx-auto max-w-[1460px] px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="mt-2 h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white py-20 text-center">
        <Building2 className="mx-auto h-16 w-16 text-gray-300" />
        <h1 className="mt-6 text-2xl font-bold">Error</h1>
        <p className="mt-3 text-gray-500">{error}</p>
        <button onClick={() => fetchProjects()} className="mt-8 rounded bg-black px-6 py-3 text-white">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-[#1A2233]/8 bg-[#F8F6F3]">
        <div className="mx-auto max-w-[1460px] px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-[#577C8E] hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <h1 className="mt-4 text-3xl text-[#1A2233] md:text-4xl" style={{ fontFamily: "'Playfair Display', serif" }}>
            Archived Projects
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-[#1A2233]/60">
            <span>{stats?.total || 0} projects</span>
            <span className="text-[#1A2233]/20">|</span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              {stats?.offPlan || 0} Off Plan
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-blue-500" />
              {stats?.resale || 0} Resale
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1460px] px-4 py-12 sm:px-6 lg:px-8">
        {projects.length === 0 ? (
          <div className="py-20 text-center">
            <Building2 className="mx-auto h-16 w-16 text-gray-300" />
            <h2 className="mt-4 text-xl font-semibold text-[#1A2233]">No Archived Projects</h2>
            <p className="mt-2 text-gray-500">There are no archived projects at the moment.</p>
            <Link href="/projects" className="mt-6 inline-block rounded bg-[#1A2233] px-6 py-3 text-white">
              View Active Projects
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((project) => (
                <ArchiveCard key={project.id} project={project} />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="rounded border px-4 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="px-4 py-2 text-sm">
                  Page {page} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.totalPages}
                  className="rounded border px-4 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}