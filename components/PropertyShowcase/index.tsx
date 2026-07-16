"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bed, Ruler, CheckCircle, Tag, Building2, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface PropertyDetail {
  id: number;
  name: string;
  slug: string;
  listing_type: string;
  occupancy: string;
  status: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
  completion_date: string | null;
  exclusive_status: string | null;
  dld_permit: string | null;
  ref_number: string | null;
  price: {
    amount: number;
    display: string;
    currency: string;
    symbol: string;
    is_price_on_request: boolean;
    sale_price: number | null;
    rental_price: number | null;
  };
  bedrooms: string;
  bathrooms: string;
  display_title: string;
  area: {
    value: number | null;
    size: string;
    display: string;
  };
  location: {
    community: string | null;
    city: string;
    community_id: number | null;
    city_id: number | null;
    address: string | null;
    sub_community?: string | null;
  };
  developer: {
    id: number | null;
    name: string | null;
    country: string | null;
    logo_url: string | null;
  };
  agent: {
    id: number | null;
    name: string | null;
    phone: string | null;
    photo_url: string | null;
    email: string | null;
  };
  featured_image: string | null;
  images: Array<{ id: number; url: string; title: string | null; featured: number }>;
  gallery_urls: string[];
  description: string | null;
  amenities: string[];
  video_url: string | null;
  payment_plans: Array<{ id: number; name: string; percentage: string }>;
}

function isValidValue(val: any): boolean {
  if (!val) return false;
  const str = String(val).trim().toLowerCase();
  return str !== "" && str !== "null" && str !== "undefined";
}

function getDisplayName(property: any): string {
  if (!property) return "Property";
  const name = property.name;
  if (isValidValue(name)) return name;
  
  if (property.slug) {
    let displayName = property.slug
      .replace(/-/g, " ")
      .replace(/\bLn\d+\b/g, "")
      .replace(/\bFor\b/g, "for")
      .replace(/\bIn\b/g, "in")
      .replace(/\bOf\b/g, "of")
      .trim();
    displayName = displayName.replace(/\b\w/g, (char: string) => char.toUpperCase());
    displayName = displayName.replace(/\s+/g, " ").trim();
    return displayName || `Property ${property.id}`;
  }
  return `Property ${property.id}`;
}

function getDisplayLocation(property: any): string {
  if (!property) return "Dubai";
  const community = property.location?.community;
  const subCommunity = property.location?.sub_community;
  const city = property.location?.city || "Dubai";
  const parts: string[] = [];
  if (isValidValue(subCommunity)) parts.push(subCommunity);
  if (isValidValue(community)) parts.push(community);
  parts.push(city);
  return parts.join(", ");
}

function stripHtml(html: string): string {
  if (typeof window === "undefined") {
    return html.replace(/<[^>]*>/g, "");
  }
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function generateDescription(property: PropertyDetail): string {
  if (isValidValue(property.description)) {
    return stripHtml(property.description!);
  }

  const parts: string[] = [];
  const propertyType = property.bedrooms?.toLowerCase().includes("studio")
    ? "studio residence"
    : property.bedrooms
    ? `${property.bedrooms} residence`
    : "elegant residence";
  const listingType = property.listing_type?.toLowerCase() === "off plan"
    ? "off-plan"
    : "ready-to-move";
  const developer = isValidValue(property.developer?.name)
    ? ` by ${property.developer!.name}`
    : "";
  const location = getDisplayLocation(property);

  parts.push(
    `Discover this exclusive ${listingType} ${propertyType}${developer}, ideally situated in the heart of ${location}.`
  );

  if (property.area?.display) {
    parts.push(
      `Spanning ${property.area.display}, this thoughtfully designed home offers a perfect blend of modern living and premium comfort.`
    );
  }

  if (property.completion_date && property.status === 5) {
    parts.push(
      `Scheduled for completion in ${property.completion_date}, it represents a compelling investment opportunity with strong potential returns.`
    );
  } else if (property.status === 1) {
    parts.push(
      `Move-in ready, this property is available for immediate occupancy in one of Dubai's most sought-after neighborhoods.`
    );
  }

  if (property.payment_plans && property.payment_plans.length > 0) {
    parts.push(`Flexible payment plans are available to suit your investment needs.`);
  }

  return parts.join(" ");
}

export default function FeaturedProperty() {
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchFeaturedProperty();
  }, []);

  async function fetchFeaturedProperty() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/properties?action=featured&limit=1");
      const data = await res.json();

      if (data.success && data.data && data.data.length > 0) {
        setProperty(data.data[0]);
      } else {
        const fallbackRes = await fetch(
          "/api/v1/properties/property-rbjzccq52-apartments-for-sale-in-so-uptown-tower"
        );
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success && fallbackData.data) {
          setProperty(fallbackData.data);
        } else {
          setError("No featured property found");
        }
      }
    } catch (err) {
      console.error("Error fetching featured property:", err);
      setError("Failed to load property");
    } finally {
      setLoading(false);
    }
  }

  const mainImage = property?.featured_image || property?.gallery_urls?.[0] || null;
  const isOffPlan = property?.status === 5;
  const isReady = property?.status === 1;
  const displayName = property ? getDisplayName(property) : "";
  const displayLocation = property ? getDisplayLocation(property) : "";
  const description = property ? generateDescription(property) : "";
  const shouldTruncate = description.length > 200;

  const completionStatus = isOffPlan
    ? property?.completion_date
      ? `Completion ${property.completion_date}`
      : "Off Plan"
    : isReady
    ? "Ready to move"
    : "N/A";

  if (loading) {
    return (
      <section className="w-full bg-white py-10 px-4 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#0A2540] mx-auto" />
            <p className="mt-4 text-sm text-gray-500 font-inter">
              Loading featured property...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !property) {
    return (
      <section className="w-full bg-white py-10 px-4 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto text-center min-h-[200px] flex flex-col items-center justify-center">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto" />
          <p className="mt-4 text-gray-500 font-inter">
            {error || "No featured property available"}
          </p>
          <button
            onClick={fetchFeaturedProperty}
            className="mt-4 text-xs tracking-widest text-[#0A2540] hover:text-white border border-[#0A2540] px-6 py-2 hover:bg-[#0A2540] transition-colors font-inter"
          >
            RETRY
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-white py-10 px-4 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left - Image with click navigation */}
          <Link 
            href={`/featured-explore-properties/${property.slug}`}
            className="relative w-full aspect-[4/3] lg:aspect-[4/3] overflow-hidden bg-gray-100 block cursor-pointer group"
          >
            {mainImage ? (
              <img
                src={mainImage}
                alt={displayName}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Building2 className="h-20 w-20 text-gray-300" />
              </div>
            )}

            {property.featured && (
              <div className="absolute top-4 left-4">
                <span className="bg-[#0A2540] text-white px-3 py-1 text-[10px] tracking-widest font-inter">
                  FEATURED
                </span>
              </div>
            )}

            {/* Overlay hint on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
              <span className="text-white text-sm font-inter opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 px-4 py-2">
                View Details
              </span>
            </div>
          </Link>

          {/* Right - Content */}
          <div className="flex flex-col">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-playfair text-[#0A2540] leading-tight">
              {displayName}
            </h1>

            {/* Location */}
            <p className="mt-3 text-sm text-gray-600 font-inter">
              {displayLocation}
            </p>

            {/* Divider */}
            <div className="border-t border-gray-200 my-5" />

            {/* Description with Read More toggle */}
            {description && (
              <div className="relative">
                <p className={`text-sm text-gray-600 leading-relaxed font-inter ${!isExpanded && shouldTruncate ? 'line-clamp-4' : ''}`}>
                  {description}
                </p>
                
                {shouldTruncate && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-2 text-sm text-[#0A2540] font-medium flex items-center gap-1 hover:opacity-70 transition-opacity"
                  >
                    {isExpanded ? (
                      <>
                        Show Less <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Read More <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 my-5" />

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="flex items-start gap-3">
                <Bed className="h-5 w-5 text-[#0A2540] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] tracking-widest text-gray-500 font-inter uppercase">
                    Beds
                  </p>
                  <p className="text-sm text-gray-900 font-inter mt-0.5">
                    {property.bedrooms || "Studio"}
                    {property.bedrooms &&
                    !property.bedrooms.toLowerCase().includes("bedroom") &&
                    !property.bedrooms.toLowerCase().includes("studio")
                      ? " Bedroom"
                      : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Ruler className="h-5 w-5 text-[#0A2540] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] tracking-widest text-gray-500 font-inter uppercase">
                    Size
                  </p>
                  <p className="text-sm text-gray-900 font-inter mt-0.5">
                    {property.area?.display || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-[#0A2540] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] tracking-widest text-gray-500 font-inter uppercase">
                    Status
                  </p>
                  <p className="text-sm text-gray-900 font-inter mt-0.5">
                    {completionStatus}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-[#0A2540] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] tracking-widest text-gray-500 font-inter uppercase">
                    Price
                  </p>
                  <p className="text-sm text-gray-900 font-inter mt-0.5 font-semibold">
                    {property.price.is_price_on_request
                      ? "Price on Request"
                      : property.price.display}
                  </p>
                </div>
              </div>
            </div>

            {/* Button */}
            <div className="mt-8">
              <Link
                href={`/featured-explore-properties/${property.slug}`}
                className="inline-block border border-[#0A2540] text-[#0A2540] text-xs tracking-widest px-10 py-3 hover:bg-[#0A2540] hover:text-white transition-colors duration-300 font-inter"
              >
                LEARN MORE
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}