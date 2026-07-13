// components/SimilarProperties/index.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Bed, Square, ArrowRight } from "lucide-react";

interface Property {
  id: number;
  property_name: string;
  property_slug: string;
  price: string | null;
  bedroom: string | null;
  area: string | null;
  featured_image: string | null;
  location_name: string | null;
  completion_date: string | null;
}

export default function SimilarProperties({ properties }: { properties: Property[] }) {
  if (!properties || properties.length === 0) return null;

  const formatPrice = (price: string | null) => {
    if (!price) return "Price on Request";
    const num = parseInt(price);
    if (num >= 1000000) {
      return `AED ${(num / 1000000).toFixed(1)}M`;
    }
    return `AED ${num.toLocaleString()}`;
  };

  return (
    <div className="mt-12">
      <h2 className="mb-6 font-playfair text-[22px] uppercase tracking-[-0.5px] text-[#1a2233]">
        Similar Properties
      </h2>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Link
            key={property.id}
            href={`/property/${property.property_slug}`}
            className="group block overflow-hidden rounded-lg border border-[#1a2233]/10 bg-white transition-all hover:shadow-lg hover:-translate-y-1"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f5f1ec]">
              {property.featured_image ? (
                <Image
                  src={property.featured_image}
                  alt={property.property_name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-[#1a2233]/30 text-xs">No Image</span>
                </div>
              )}
              
              {/* Price Tag */}
              <div className="absolute bottom-3 left-3 rounded bg-[#1a2233]/85 px-2.5 py-1.5">
                <span className="text-[10px] font-semibold text-white">
                  {formatPrice(property.price)}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-playfair text-[13px] font-semibold uppercase tracking-[0.02em] text-[#1a2233] line-clamp-2 group-hover:text-[#577C8E] transition-colors">
                {property.property_name}
              </h3>
              
              {/* Location */}
              {property.location_name && (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#1a2233]/50">
                  <MapPin className="h-2.5 w-2.5" />
                  <span className="line-clamp-1">{property.location_name}</span>
                </div>
              )}

              {/* Details */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-[#1a2233]/60">
                {property.bedroom && (
                  <span className="flex items-center gap-1">
                    <Bed className="h-3 w-3" />
                    {property.bedroom}
                  </span>
                )}
                {property.area && (
                  <span className="flex items-center gap-1">
                    <Square className="h-3 w-3" />
                    {property.area} sq.ft
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}