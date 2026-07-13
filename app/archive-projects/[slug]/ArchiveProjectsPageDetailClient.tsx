"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Building2, MapPin, BedDouble, ArrowLeft, Home, Square, Bed, Calendar, Shield, Phone, Mail } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = "/api/archive/projects";
const IMAGE_BASE_URL = "https://acasa.ae/upload/media";

interface ArchiveProjectDetail {
  id: number;
  title: string;
  slug: string;
  location: string;
  price: string;
  featured_image: string | null;
  gallery_images: string[];
  beds: string;
  sqft: string;
  handover: string;
  listingType: string;
  description: string;
  amenities: string[];
  refNo: string;
  developer: string;
  developer_logo: string;
  map_latitude: string;
  map_longitude: string;
  video_url: string;
  occupancy: string;
  exclusive_status: string;
  property_type: string;
  status: number;
  verified: number;
  featured_project: string;
  views: string;
  created_at: string;
  updated_at: string;
}

function getUnsplashFallback(title?: string | null): string {
  const query = encodeURIComponent(title || "luxury project dubai");
  return `https://source.unsplash.com/800x600/?${query},real-estate,property,development`;
}

function ArchiveImage({ src, alt, className = "", fill = false }: { src: string | null; alt: string; className?: string; fill?: boolean }) {
  const [error, setError] = useState(false);

  const imageUrl = src || getUnsplashFallback(alt);

  if (error) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-gray-100 ${className}`}>
        <Building2 className="h-12 w-12 opacity-30" />
      </div>
    );
  }

  if (fill) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        className={`h-full w-full object-cover ${className}`}
        onError={() => setError(true)}
        loading="lazy"
      />
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}

export default function ArchiveProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [project, setProject] = useState<ArchiveProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    accept_terms: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/${slug}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Project not found");
        setProject(data.data);
      } catch (err: any) {
        setError(err.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchProject();
  }, [slug]);

  const heroImage = project?.featured_image || null;
  const allImages = project?.gallery_images || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!form.accept_terms) {
      toast.error("Please accept terms and conditions");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/projects/enquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: project.id,
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.message,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Enquiry submitted successfully!");
        setForm({ name: "", email: "", phone: "", message: "", accept_terms: false });
      } else {
        toast.error(data.message || "Failed to submit enquiry");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#577C8E] border-t-transparent" />
        <p className="mt-4 text-gray-500">Loading project details...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-white py-20 text-center">
        <Building2 className="mx-auto h-16 w-16 text-gray-300" />
        <h1 className="mt-6 text-2xl font-bold">Project Not Found</h1>
        <p className="mt-3 text-gray-500">{error || "This archived project does not exist."}</p>
        <Link href="/archive-projects" className="mt-8 inline-block rounded bg-black px-6 py-3 text-white">
          Back to Archive
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="border-b border-[#1A2233]/8 bg-[#F8F6F3]">
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/archive-projects" className="inline-flex items-center gap-2 text-sm text-[#577C8E] hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to Archive
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl text-[#1A2233] md:text-3xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              {project.title}
            </h1>
            <span className="rounded bg-red-600 px-3 py-1 text-[10px] uppercase tracking-wider text-white">Archived</span>
          </div>
          {project.location && (
            <div className="mt-2 flex items-center gap-1 text-sm text-[#1A2233]/60">
              <MapPin className="h-4 w-4" />
              {project.location}
            </div>
          )}
        </div>
      </div>

      {/* Hero Image */}
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative h-[400px] w-full overflow-hidden rounded-xl bg-gray-100 md:h-[500px]">
          <ArchiveImage src={heroImage} alt={project.title} fill className="object-cover" />
        </div>

        {allImages.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-2 md:grid-cols-5 lg:grid-cols-6">
            {allImages.slice(0, 6).map((img, idx) => (
              <div key={idx} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                <ArchiveImage src={img} alt={`${project.title} ${idx + 2}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {project.description && (
              <div className="mb-8">
                <h2 className="mb-4 text-2xl text-[#1A2233]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  About This Project
                </h2>
                <div
                  className="prose max-w-none text-[#1A2233]/80"
                  dangerouslySetInnerHTML={{ __html: project.description }}
                />
              </div>
            )}

            {/* Key Details */}
            <div className="mb-8">
              <h2 className="mb-4 text-2xl text-[#1A2233]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Key Details
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {project.beds && project.beds !== "N/A" && (
                  <div className="rounded-lg border p-3 text-center">
                    <Bed className="mx-auto mb-2 h-5 w-5 text-[#577C8E]" />
                    <p className="text-sm font-semibold">{project.beds}</p>
                    <p className="text-xs text-gray-500">Bedrooms</p>
                  </div>
                )}
                {project.sqft && project.sqft !== "N/A" && (
                  <div className="rounded-lg border p-3 text-center">
                    <Square className="mx-auto mb-2 h-5 w-5 text-[#577C8E]" />
                    <p className="text-sm font-semibold">{project.sqft}</p>
                    <p className="text-xs text-gray-500">Area</p>
                  </div>
                )}
                {project.property_type && (
                  <div className="rounded-lg border p-3 text-center">
                    <Home className="mx-auto mb-2 h-5 w-5 text-[#577C8E]" />
                    <p className="text-sm font-semibold">{project.property_type}</p>
                    <p className="text-xs text-gray-500">Property Type</p>
                  </div>
                )}
                {project.handover && project.handover !== "TBA" && (
                  <div className="rounded-lg border p-3 text-center">
                    <Calendar className="mx-auto mb-2 h-5 w-5 text-[#577C8E]" />
                    <p className="text-sm font-semibold">{project.handover}</p>
                    <p className="text-xs text-gray-500">Handover</p>
                  </div>
                )}
                {project.listingType && (
                  <div className="rounded-lg border p-3 text-center">
                    <Shield className="mx-auto mb-2 h-5 w-5 text-[#577C8E]" />
                    <p className="text-sm font-semibold">{project.listingType}</p>
                    <p className="text-xs text-gray-500">Listing Type</p>
                  </div>
                )}
              </div>
            </div>

            {/* Developer */}
            {project.developer && (
              <div className="mb-8 rounded-xl border p-6">
                <h2 className="mb-4 text-2xl text-[#1A2233]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Developer
                </h2>
                <div className="flex items-start gap-4">
                  {project.developer_logo && (
                    <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                      <ArchiveImage src={project.developer_logo} alt={project.developer} className="h-full w-full object-contain p-2" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{project.developer}</h3>
                  </div>
                </div>
              </div>
            )}

            {/* Amenities */}
            {project.amenities && project.amenities.length > 0 && (
              <div>
                <h2 className="mb-4 text-2xl text-[#1A2233]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Amenities
                </h2>
                <div className="flex flex-wrap gap-2">
                  {project.amenities.map((item, idx) => (
                    <span key={idx} className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Price Card */}
              <div className="rounded-xl border p-6 text-center">
                <p className="text-sm uppercase tracking-wider text-gray-500">Starting From</p>
                <p className="mt-2 text-3xl font-bold text-[#577C8E]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {project.price}
                </p>
                {project.listingType && (
                  <div className="mt-4">
                    <span className="inline-block rounded-full bg-gray-100 px-4 py-1 text-xs uppercase">
                      {project.listingType}
                    </span>
                  </div>
                )}
                {project.refNo && (
                  <p className="mt-2 text-xs text-gray-400">Ref: {project.refNo}</p>
                )}
              </div>

              {/* Enquiry Form */}
              <div id="enquiry-form" className="rounded-xl border p-6">
                <h3 className="mb-4 text-xl font-semibold">Request Information</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#577C8E]"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#577C8E]"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone *"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#577C8E]"
                    required
                  />
                  <textarea
                    placeholder="Message"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#577C8E]"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={form.accept_terms}
                      onChange={(e) => setForm({ ...form, accept_terms: e.target.checked })}
                      className="h-4 w-4 rounded"
                    />
                    <label htmlFor="terms" className="text-xs text-gray-500">
                      I accept the Terms & Conditions
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-[#1A2233] py-3 text-white transition-all hover:bg-[#2a3344] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Enquiry"}
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}