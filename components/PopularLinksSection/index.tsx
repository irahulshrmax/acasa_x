"use client";

import Link from "next/link";

type LinkItem = {
  label: string;
  href: string;
};

type LinkGroup = {
  title: string;
  links: LinkItem[];
};

const LINK_GROUPS: LinkGroup[] = [
  // ─── POPULAR SEARCHES ──────────────────────────────────────────────
  {
    title: "Popular Searches",
    links: [
      {
        label: "Luxury homes for sale in Dubai",
        href: "/featured-explore-properties?keyword=luxury-homes",
      },
      {
        label: "Waterfront properties in Dubai",
        href: "/featured-explore-properties?keyword=waterfront-properties",
      },
      {
        label: "Beachfront villas in Dubai",
        href: "/featured-explore-properties?keyword=beachfront-villas",
      },
      {
        label: "Investment properties in Dubai",
        href: "/featured-explore-properties?keyword=investment-properties",
      },
      {
        label: "Branded residences in Dubai",
        href: "/featured-explore-properties?keyword=branded-residences",
      },
      {
        label: "Golf course properties in Dubai",
        href: "/featured-explore-properties?keyword=golf-course-properties",
      },
      {
        label: "Properties with private pool in Dubai",
        href: "/featured-explore-properties?keyword=private-pool",
      },
      {
        label: "Sea view properties in Dubai",
        href: "/featured-explore-properties?keyword=sea-view",
      },
      {
        label: "New launch properties in Dubai",
        href: "/new-projects-in-dubai",
      },
      {
        label: "Ready to move properties in Dubai",
        href: "/featured-explore-properties?status=1",
      },
    ],
  },

  // ─── PROPERTY TYPES ──────────────────────────────────────────────────
  {
    title: "Property Types",
    links: [
      {
        label: "Apartments for sale in Dubai",
        href: "/apartments-for-sale-in-dubai",
      },
      {
        label: "Villas for sale in Dubai",
        href: "/properties-for-sale-dubai?type=villas",
      },
      {
        label: "Townhouses for sale in Dubai",
        href: "/properties-for-sale-dubai?type=townhouses",
      },
      {
        label: "Penthouses for sale in Dubai",
        href: "/properties-for-sale-dubai?type=penthouses",
      },
      {
        label: "Duplexes for sale in Dubai",
        href: "/properties-for-sale-dubai?type=duplexes",
      },
      {
        label: "Mansions for sale in Dubai",
        href: "/properties-for-sale-dubai?type=mansions",
      },
      {
        label: "Luxury homes for sale in Dubai",
        href: "/luxury-properties",
      },
      {
        label: "Off-plan properties in Dubai",
        href: "/off-plan-properties-in-dubai",
      },
      {
        label: "Rental properties in Dubai",
        href: "/properties-for-rent-dubai",
      },
      {
        label: "Properties for sale in Dubai",
        href: "/sell-your-property-in-dubai",
      },
    ],
  },

  // ─── BUY & SELL ──────────────────────────────────────────────────────
  {
    title: "Buy & Sell",
    links: [
      {
        label: "Properties for sale in Dubai",
        href: "/properties-for-sale-dubai",
      },
      {
        label: "Properties for rent in Dubai",
        href: "/properties-for-rent-dubai",
      },
      {
        label: "Off-plan properties in Dubai",
        href: "/off-plan-properties-in-dubai",
      },
      {
        label: "New projects in Dubai",
        href: "/new-projects-in-dubai",
      },
      {
        label: "Luxury properties in Dubai",
        href: "/luxury-properties",
      },
      {
        label: "Lifestyle properties in Dubai",
        href: "/dubai-lifestyle-properties",
      },
      {
        label: "Sell your property in Dubai",
        href: "/sell-your-property-in-dubai",
      },
      {
        label: "Archive properties in Dubai",
        href: "/archive-properties",
      },
      {
        label: "Archive projects in Dubai",
        href: "/archive-projects",
      },
      {
        label: "Global properties for sale",
        href: "/global-properties-for-sale",
      },
    ],
  },

  // ─── POPULAR AREAS ──────────────────────────────────────────────────
  {
    title: "Popular Areas",
    links: [
      {
        label: "Properties in Palm Jumeirah, Dubai",
        href: "/neighborhood-guide/palm-jumeirah",
      },
      {
        label: "Properties in Dubai Marina, Dubai",
        href: "/neighborhood-guide/dubai-marina",
      },
      {
        label: "Properties in Downtown Dubai",
        href: "/neighborhood-guide/downtown-dubai",
      },
      {
        label: "Properties in Business Bay, Dubai",
        href: "/neighborhood-guide/business-bay",
      },
      {
        label: "Properties in Dubai Hills Estate",
        href: "/neighborhood-guide/dubai-hills-estate",
      },
      {
        label: "Properties in Jumeirah Bay Island",
        href: "/neighborhood-guide/jumeirah-bay-island",
      },
      {
        label: "Properties in Emirates Hills",
        href: "/neighborhood-guide/emirates-hills",
      },
      {
        label: "Properties in Dubai Harbour",
        href: "/neighborhood-guide/dubai-harbour",
      },
      {
        label: "Properties in Bluewaters Island",
        href: "/neighborhood-guide/bluewaters-island",
      },
      {
        label: "Properties in Al Barari",
        href: "/neighborhood-guide/al-barari",
      },
      {
        label: "Properties in Yas Island, Abu Dhabi",
        href: "/neighborhood-guide/yas-island",
      },
      {
        label: "Properties in Saadiyat Island, Abu Dhabi",
        href: "/neighborhood-guide/saadiyat-island",
      },
      {
        label: "Properties in Al Reem Island, Abu Dhabi",
        href: "/neighborhood-guide/al-reem-island",
      },
      {
        label: "Properties in Al Marjan Island, Ras Al Khaimah",
        href: "/neighborhood-guide/al-marjan-island",
      },
    ],
  },
];

export default function PopularLinksSection() {
  return (
    <section className="bg-[#F3EEE9] py-14 md:py-16 lg:py-20">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-14">
          {LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-5 text-[10px] font-medium uppercase tracking-[0.24em] text-[#577C8E]">
                {group.title}
              </h3>

              <ul className="space-y-3">
                {group.links.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="group inline-flex text-[12px] leading-relaxed text-[#192334]/85 transition-colors duration-300 hover:text-[#577C8E]"
                    >
                      <span className="relative">
                        {item.label}
                        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-[#577C8E] transition-all duration-300 group-hover:w-full" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}