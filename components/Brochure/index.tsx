// components/BrochureDownload.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Download,
  Loader2,
  Mail,
  User,
  X,
  CheckCircle2,
  BarChart3,
  Building2,
  MapPin,
  Bed,
  Bath,
  Ruler,
  Calendar,
  UserCircle,
  Phone,
  PhoneCall,
  Copy,
  Share2,
  Star,
  StarOff,
  FileCheck,
  Shield,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface BrochureDownloadProps {
  propertyId: number;
  propertyName: string;
  propertyData?: any;
  className?: string;
  showStats?: boolean;
  variant?: "property" | "project";
  onDownload?: () => void;
}

interface DownloadStats {
  total_downloads: number;
  unique_users: number;
  last_download: string;
}

interface BrochureData {
  property: any;
  developer: any;
  location: any;
  amenities: string[];
  payment_plans: any[];
  gallery: string[];
  specs: any;
  agent: any;
}

export default function BrochureDownload({
  propertyId,
  propertyName,
  propertyData,
  className = "",
  showStats = false,
  variant = "property",
  onDownload,
}: BrochureDownloadProps) {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [includeFloorPlan, setIncludeFloorPlan] = useState(true);
  const [includePaymentPlan, setIncludePaymentPlan] = useState(true);
  const [includeGallery, setIncludeGallery] = useState(true);
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  const [brochureUrl, setBrochureUrl] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    if (showStats) {
      fetchStats();
    }
  }, [showStats]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareLink(window.location.href);
    }
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/brochure/stats?propertyId=${propertyId}`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (phone.trim() && !/^[0-9+\-\s()]{8,20}$/.test(phone)) {
      newErrors.phone = "Invalid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildBrochureData = useCallback((): BrochureData => {
    const data = propertyData || {};

    return {
      property: {
        id: data.id || propertyId,
        name: data.ProjectName || data.property_name || propertyName,
        slug: data.project_slug || data.property_slug || "",
        description: data.Description || data.description || "",
        price: data.price || data.Price || null,
        price_end: data.price_end || data.PriceEnd || null,
        bedroom: data.bedroom || data.Bedroom || "",
        bathroom: data.bathroom || data.Bathroom || "",
        area: data.area || data.Area || "",
        area_size: data.area_size || data.AreaSize || "",
        completion_date: data.completion_date || data.CompletionDate || "",
        occupancy: data.occupancy || data.Occupancy || "",
        listing_type: data.listing_type || data.ListingType || "",
        featured: data.featured_project === "1" || data.featured === true,
        image_url: data.image_url || data.featured_image || "",
        gallery_images: data.gallery_images || data.gallery || [],
        rera_number: data.ReraNumber || data.rera_number || "",
        dld_permit: data.dld_permit || data.DLDPermit || "",
        exclusive_status: data.exclusive_status || data.ExclusiveStatus || "",
        unit_count: data.unit_count || data.UnitCount || 1,
        total_units: data.total_units || data.TotalUnits || null,
      },
      developer: {
        name: data.developer_name || data.DeveloperName || "",
        logo: data.developer_logo || data.DeveloperLogo || "",
        country: data.developer_country || data.DeveloperCountry || "",
        website: data.developer_website || data.DeveloperWebsite || "",
        informations: data.developer_info || data.DeveloperInfo || "",
      },
      location: {
        community: data.community_name || data.CommunityName || "",
        sub_community: data.sub_community_name || data.SubCommunityName || "",
        city: data.city_name || data.CityName || "Dubai",
        address: data.address || data.Address || "",
        latitude: data.map_latitude || data.Latitude || null,
        longitude: data.map_longitude || data.Longitude || null,
      },
      amenities: data.amenities
        ? Array.isArray(data.amenities)
          ? data.amenities
          : data.amenities.split(",").filter(Boolean)
        : [],
      payment_plans: data.payment_plans || data.PaymentPlans || [],
      gallery: data.gallery_images || data.gallery || data.media_records?.map((m: any) => m.full_url) || [],
      specs: data.specs || data.Specifications || null,
      agent: {
        name: data.agent_name || data.AgentName || "",
        phone: data.agent_phone || data.AgentPhone || "",
        email: data.agent_email || data.AgentEmail || "",
        photo: data.agent_photo || data.AgentPhoto || "",
        rera: data.agent_rera || data.AgentRera || "",
      },
    };
  }, [propertyData, propertyId, propertyName]);

  const generateBrochureHTML = (brochureData: BrochureData): string => {
    const { property, developer, location, amenities, payment_plans, gallery, specs, agent } = brochureData;

    const priceDisplay = property.price
      ? `AED ${Number(property.price).toLocaleString()}`
      : "Price on Request";

    const bedroomDisplay = property.bedroom || "Studio";
    const bathroomDisplay = property.bathroom || "1";
    const areaDisplay = property.area
      ? `${Number(property.area).toLocaleString()} sq. ft.`
      : "Area on Request";

    const galleryImages = gallery.length > 0 ? gallery : (property.gallery_images || [property.image_url]).filter(Boolean);

    const featuredImage = property.image_url || galleryImages[0] || "";

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${property.name} - Brochure</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            padding: 40px 20px;
        }
        .brochure {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        .header {
            background: linear-gradient(135deg, #192334 0%, #2a3a4a 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        .header .subtitle {
            font-size: 16px;
            opacity: 0.8;
            font-weight: 300;
        }
        .header .badge {
            display: inline-block;
            background: rgba(255,255,255,0.15);
            padding: 4px 16px;
            border-radius: 20px;
            font-size: 12px;
            margin-top: 12px;
            letter-spacing: 1px;
        }
        .cover-image {
            width: 100%;
            height: 400px;
            object-fit: cover;
        }
        .content { padding: 40px; }
        .section { margin-bottom: 32px; }
        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #192334;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e8e6e1;
        }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .info-item { 
            background: #f8f8f8; 
            padding: 16px 20px; 
            border-radius: 8px;
            border-left: 3px solid #192334;
        }
        .info-item .label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #8a94a3;
            font-weight: 600;
        }
        .info-item .value {
            font-size: 16px;
            font-weight: 500;
            color: #192334;
            margin-top: 4px;
        }
        .price-display {
            background: linear-gradient(135deg, #f8f4ee 0%, #f0ece6 100%);
            padding: 24px;
            border-radius: 12px;
            text-align: center;
            margin: 16px 0;
        }
        .price-display .amount {
            font-size: 36px;
            font-weight: 700;
            color: #192334;
        }
        .price-display .label {
            font-size: 14px;
            color: #8a94a3;
            font-weight: 500;
        }
        .amenity-tag {
            display: inline-block;
            background: #f0ece6;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            margin: 4px 4px 4px 0;
            color: #192334;
        }
        .payment-plan {
            background: #f8f8f8;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e8e6e1;
        }
        .payment-plan .percentage {
            font-size: 28px;
            font-weight: 700;
            color: #192334;
        }
        .payment-plan .name {
            font-size: 14px;
            color: #4a5462;
            margin-top: 4px;
        }
        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
        }
        .gallery-grid img {
            width: 100%;
            height: 120px;
            object-fit: cover;
            border-radius: 4px;
        }
        .developer-section {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 20px;
            background: #f8f8f8;
            border-radius: 12px;
        }
        .developer-section img {
            width: 80px;
            height: 80px;
            object-fit: contain;
            border-radius: 8px;
            background: white;
            padding: 8px;
        }
        .developer-section .name {
            font-size: 18px;
            font-weight: 600;
            color: #192334;
        }
        .developer-section .country {
            font-size: 14px;
            color: #8a94a3;
        }
        .agent-card {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px 20px;
            background: #f8f8f8;
            border-radius: 12px;
        }
        .agent-card img {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            object-fit: cover;
        }
        .agent-card .name {
            font-weight: 600;
            color: #192334;
        }
        .agent-card .phone {
            font-size: 14px;
            color: #4a5462;
        }
        .footer {
            background: #f8f8f8;
            padding: 24px 40px;
            text-align: center;
            font-size: 12px;
            color: #8a94a3;
            border-top: 1px solid #e8e6e1;
        }
        .footer .brand {
            font-weight: 600;
            color: #192334;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            .grid-2, .grid-3 { grid-template-columns: 1fr; }
            .gallery-grid { grid-template-columns: repeat(2, 1fr); }
            .header h1 { font-size: 24px; }
            .content { padding: 20px; }
            .cover-image { height: 200px; }
        }
    </style>
</head>
<body>
    <div class="brochure">
        <!-- Header -->
        <div class="header">
            <div class="badge">${variant.toUpperCase()} BROCHURE</div>
            <h1>${property.name}</h1>
            <div class="subtitle">${location.city}${location.community ? ` • ${location.community}` : ""}</div>
            ${property.listing_type ? `<div class="badge">${property.listing_type}</div>` : ""}
            ${property.featured ? '<div class="badge" style="background:rgba(200,170,120,0.3);color:#c8aa78;">★ FEATURED</div>' : ""}
        </div>

        <!-- Cover Image -->
        ${featuredImage ? `<img src="${featuredImage}" alt="${property.name}" class="cover-image" />` : ""}

        <!-- Content -->
        <div class="content">
            <!-- Price -->
            <div class="price-display">
                <div class="label">PRICE</div>
                <div class="amount">${priceDisplay}</div>
                ${property.price_end ? `<div style="font-size:14px;color:#8a94a3;margin-top:4px;">to AED ${Number(property.price_end).toLocaleString()}</div>` : ""}
            </div>

            <!-- Key Details -->
            <div class="section">
                <div class="section-title">Key Details</div>
                <div class="grid-3">
                    <div class="info-item">
                        <div class="label">Bedrooms</div>
                        <div class="value">${bedroomDisplay}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Bathrooms</div>
                        <div class="value">${bathroomDisplay}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Area</div>
                        <div class="value">${areaDisplay}</div>
                    </div>
                </div>
                ${property.unit_count > 1
                  ? `
                <div style="margin-top:12px;" class="grid-2">
                    <div class="info-item">
                        <div class="label">Total Units</div>
                        <div class="value">${property.unit_count}</div>
                    </div>
                    ${property.total_units
                      ? `
                    <div class="info-item">
                        <div class="label">Available Units</div>
                        <div class="value">${property.unit_count} / ${property.total_units}</div>
                    </div>`
                      : ""}
                </div>`
                  : ""}
            </div>

            <!-- Additional Details -->
            <div class="section">
                <div class="section-title">Additional Information</div>
                <div class="grid-2">
                    ${property.completion_date
                      ? `
                    <div class="info-item">
                        <div class="label">Completion Date</div>
                        <div class="value">${property.completion_date}</div>
                    </div>`
                      : ""}
                    ${property.occupancy
                      ? `
                    <div class="info-item">
                        <div class="label">Occupancy</div>
                        <div class="value">${property.occupancy}</div>
                    </div>`
                      : ""}
                    ${property.exclusive_status
                      ? `
                    <div class="info-item">
                        <div class="label">Status</div>
                        <div class="value">${property.exclusive_status}</div>
                    </div>`
                      : ""}
                    ${property.dld_permit
                      ? `
                    <div class="info-item">
                        <div class="label">DLD Permit</div>
                        <div class="value">${property.dld_permit}</div>
                    </div>`
                      : ""}
                </div>
            </div>

            <!-- Description -->
            ${property.description
              ? `
            <div class="section">
                <div class="section-title">Description</div>
                <p style="line-height:1.8;color:#4a5462;font-size:15px;">${property.description.replace(/<[^>]*>/g, "")}</p>
            </div>`
              : ""}

            <!-- Amenities -->
            ${amenities.length > 0
              ? `
            <div class="section">
                <div class="section-title">Amenities</div>
                <div>
                    ${amenities.map((a: string) => `<span class="amenity-tag">${a.trim()}</span>`).join("")}
                </div>
            </div>`
              : ""}

            <!-- Payment Plans -->
            ${payment_plans.length > 0
              ? `
            <div class="section">
                <div class="section-title">Payment Plans</div>
                <div class="grid-3">
                    ${payment_plans
                      .map(
                        (plan: any) => `
                        <div class="payment-plan">
                            <div class="percentage">${plan.percentage || plan.percent || 0}%</div>
                            <div class="name">${plan.name || plan.plan_name || "Payment"}</div>
                        </div>
                      `
                      )
                      .join("")}
                </div>
            </div>`
              : ""}

            <!-- Gallery -->
            ${includeGallery && galleryImages.length > 1
              ? `
            <div class="section">
                <div class="section-title">Gallery</div>
                <div class="gallery-grid">
                    ${galleryImages
                      .slice(0, 8)
                      .map(
                        (img: string) => `
                        <img src="${img}" alt="Gallery image" />
                      `
                      )
                      .join("")}
                </div>
                ${galleryImages.length > 8 ? `<p style="text-align:center;margin-top:8px;font-size:13px;color:#8a94a3;">+${galleryImages.length - 8} more images</p>` : ""}
            </div>`
              : ""}

            <!-- Developer -->
            ${developer.name
              ? `
            <div class="section">
                <div class="section-title">Developer</div>
                <div class="developer-section">
                    ${developer.logo ? `<img src="${developer.logo}" alt="${developer.name}" />` : ""}
                    <div>
                        <div class="name">${developer.name}</div>
                        ${developer.country ? `<div class="country">${developer.country}</div>` : ""}
                        ${developer.website ? `<div style="font-size:13px;color:#192334;margin-top:4px;">${developer.website}</div>` : ""}
                    </div>
                </div>
                ${developer.informations ? `<p style="margin-top:12px;font-size:14px;color:#4a5462;line-height:1.6;">${developer.informations}</p>` : ""}
            </div>`
              : ""}

            <!-- Agent -->
            ${agent.name
              ? `
            <div class="section">
                <div class="section-title">Agent</div>
                <div class="agent-card">
                    ${agent.photo ? `<img src="${agent.photo}" alt="${agent.name}" />` : ""}
                    <div>
                        <div class="name">${agent.name}</div>
                        ${agent.phone ? `<div class="phone">📞 ${agent.phone}</div>` : ""}
                        ${agent.email ? `<div class="phone">✉️ ${agent.email}</div>` : ""}
                        ${agent.rera ? `<div style="font-size:12px;color:#8a94a3;">RERA: ${agent.rera}</div>` : ""}
                    </div>
                </div>
            </div>`
              : ""}

            <!-- Location -->
            <div class="section">
                <div class="section-title">Location</div>
                <div class="info-item">
                    ${location.community ? `<div><strong>Community:</strong> ${location.community}</div>` : ""}
                    ${location.sub_community ? `<div><strong>Sub Community:</strong> ${location.sub_community}</div>` : ""}
                    ${location.city ? `<div><strong>City:</strong> ${location.city}</div>` : ""}
                    ${location.address ? `<div><strong>Address:</strong> ${location.address}</div>` : ""}
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="brand">ACASA Real Estate</div>
            <div style="margin-top:4px;">Property Brochure • ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
            <div style="margin-top:4px;">Ref: ${property.id} • ${property.name}</div>
        </div>
    </div>
</body>
</html>
        `;
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const brochureData = buildBrochureData();
      const html = generateBrochureHTML(brochureData);

      // Track download
      await fetch("/api/brochure/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          email: email.trim(),
          name: name.trim(),
          phone: phone.trim(),
          userAgent: navigator.userAgent,
        }),
      });

      // Generate PDF via API
      const response = await fetch("/api/brochure/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          html,
          email: email.trim(),
          name: name.trim(),
          sendEmail,
          includeFloorPlan,
          includePaymentPlan,
          includeGallery,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to generate brochure");
      }

      // Download PDF
      if (data.data.pdf_url) {
        window.open(data.data.pdf_url, "_blank");
      } else if (data.data.html) {
        // Fallback: download as HTML
        const blob = new Blob([data.data.html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.data.download_filename || `${propertyName.replace(/\s+/g, "_")}_brochure.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setShowSuccess(true);
      setShowForm(false);

      if (onDownload) onDownload();

      if (sendEmail) {
        toast.success("Brochure downloaded and sent to your email!");
      } else {
        toast.success("Brochure downloaded successfully!");
      }

      setTimeout(() => {
        setEmail("");
        setName("");
        setPhone("");
        setSendEmail(true);
        setShowSuccess(false);
        if (showStats) fetchStats();
      }, 3000);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate brochure");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    const brochureData = buildBrochureData();
    const html = generateBrochureHTML(brochureData);
    setPreviewData(html);
    setShowPreview(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setShowPreview(false);
    setErrors({});
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Check out ${propertyName}`,
          text: `Property brochure for ${propertyName}`,
          url: shareLink,
        });
      } else {
        await navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
        toast.success("Link copied to clipboard!");
      }
    } catch {
      // User cancelled share
    }
  };

  return (
    <div className={className}>
      {/* Stats Display */}
      {showStats && stats && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex flex-wrap items-center gap-3 text-xs text-gray-600"
        >
          <div className="flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full">
            <BarChart3 className="h-3 w-3 text-blue-500" />
            <span>{stats.total_downloads} downloads</span>
          </div>
          <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-full">
            <User className="h-3 w-3 text-green-500" />
            <span>{stats.unique_users} users</span>
          </div>
          {stats.last_download && (
            <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-full">
              <Calendar className="h-3 w-3 text-gray-500" />
              <span>Last: {new Date(stats.last_download).toLocaleDateString()}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-4 flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-800 border border-green-200"
          >
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold">Success!</p>
              <p className="text-sm">Your brochure has been generated</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button Group */}
      {!showForm && !showSuccess && (
        <div className="flex flex-wrap gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(true)}
            className="flex items-center gap-3 bg-gradient-to-r from-[#192334] to-[#2a3a4a] px-8 py-4 text-[11px] tracking-widest text-white hover:from-[#2a3a4a] hover:to-[#192334] transition-all duration-300 shadow-lg hover:shadow-xl rounded-lg group flex-1 min-w-[200px]"
          >
            <FileText className="h-5 w-5 group-hover:scale-110 transition-transform" />
            DOWNLOAD BROCHURE
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePreview}
            className="flex items-center gap-2 bg-gray-100 px-6 py-4 text-[11px] tracking-widest text-[#192334] hover:bg-gray-200 transition-all rounded-lg"
          >
            <FileText className="h-4 w-4" />
            PREVIEW
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleShare}
            className="flex items-center gap-2 bg-gray-100 px-4 py-4 text-[11px] tracking-widest text-[#192334] hover:bg-gray-200 transition-all rounded-lg"
          >
            {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
          </motion.button>
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="border-2 border-gray-200 bg-white p-8 shadow-2xl rounded-xl relative overflow-hidden mt-4"
          >
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full blur-3xl opacity-50 -z-10" />

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h4 className="text-2xl font-bold text-[#192334] mb-2">Download Premium Brochure</h4>
              <p className="text-sm text-gray-600">
                {propertyName} • {variant === "project" ? "Project Details" : "Property Details"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleDownload} className="space-y-5">
              {/* Name Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: undefined });
                    }}
                    className={`w-full rounded-lg border ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    } pl-12 pr-4 py-3 text-sm focus:border-[#192334] focus:outline-none focus:ring-2 focus:ring-[#192334]/20 transition-all`}
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    className={`w-full rounded-lg border ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    } pl-12 pr-4 py-3 text-sm focus:border-[#192334] focus:outline-none focus:ring-2 focus:ring-[#192334]/20 transition-all`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Phone Number (optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="tel"
                    placeholder="+971 50 123 4567"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors({ ...errors, phone: undefined });
                    }}
                    className={`w-full rounded-lg border ${
                      errors.phone ? "border-red-500" : "border-gray-300"
                    } pl-12 pr-4 py-3 text-sm focus:border-[#192334] focus:outline-none focus:ring-2 focus:ring-[#192334]/20 transition-all`}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="w-4 h-4 text-[#192334] border-gray-300 rounded focus:ring-[#192334]"
                  />
                  <label htmlFor="sendEmail" className="text-sm text-gray-700 cursor-pointer">
                    Send to email
                  </label>
                </div>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <input
                    type="checkbox"
                    id="includeGallery"
                    checked={includeGallery}
                    onChange={(e) => setIncludeGallery(e.target.checked)}
                    className="w-4 h-4 text-[#192334] border-gray-300 rounded focus:ring-[#192334]"
                  />
                  <label htmlFor="includeGallery" className="text-sm text-gray-700 cursor-pointer">
                    Include Gallery
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <input
                    type="checkbox"
                    id="includeFloorPlan"
                    checked={includeFloorPlan}
                    onChange={(e) => setIncludeFloorPlan(e.target.checked)}
                    className="w-4 h-4 text-[#192334] border-gray-300 rounded focus:ring-[#192334]"
                  />
                  <label htmlFor="includeFloorPlan" className="text-sm text-gray-700 cursor-pointer">
                    Floor Plans
                  </label>
                </div>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <input
                    type="checkbox"
                    id="includePaymentPlan"
                    checked={includePaymentPlan}
                    onChange={(e) => setIncludePaymentPlan(e.target.checked)}
                    className="w-4 h-4 text-[#192334] border-gray-300 rounded focus:ring-[#192334]"
                  />
                  <label htmlFor="includePaymentPlan" className="text-sm text-gray-700 cursor-pointer">
                    Payment Plans
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#192334] py-4 text-sm font-semibold text-white hover:bg-[#2a3a4a] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    GENERATING...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    GENERATE & DOWNLOAD
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="flex justify-center items-center gap-6 pt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Shield className="text-green-500 h-3 w-3" />
                  Secure
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="text-green-500 h-3 w-3" />
                  Instant Download
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="text-green-500 h-3 w-3" />
                  No Spam
                </span>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && previewData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-[#192334]">Brochure Preview</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const brochureData = buildBrochureData();
                      const html = generateBrochureHTML(brochureData);
                      const blob = new Blob([html], { type: "text/html" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${propertyName.replace(/\s+/g, "_")}_brochure.html`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast.success("HTML brochure downloaded!");
                    }}
                    className="px-4 py-2 bg-[#192334] text-white text-sm rounded-lg hover:bg-[#2a3a4a] transition flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download HTML
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="overflow-auto max-h-[calc(90vh-80px)] p-0">
                <iframe
                  srcDoc={previewData}
                  className="w-full min-h-[600px] h-[calc(90vh-100px)] border-0"
                  title="Brochure Preview"
                  sandbox="allow-scripts"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}