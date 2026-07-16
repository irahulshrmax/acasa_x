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
  {
    title: "Popular Searches",
    links: [
      {
        label: "Luxury homes for sale in United Arab Emirates",
        href: "/featured-explore-properties?keyword=luxury-homes",
      },
      {
        label: "Waterfront properties in United Arab Emirates",
        href: "/featured-explore-properties?keyword=waterfront-properties",
      },
      {
        label: "Beachfront villas in United Arab Emirates",
        href: "/featured-explore-properties?keyword=beachfront-villas",
      },
      {
        label: "Investment properties in United Arab Emirates",
        href: "/featured-explore-properties?keyword=investment-properties",
      },
      {
        label: "Branded residences in United Arab Emirates",
        href: "/featured-explore-properties?keyword=branded-residences",
      },
      {
        label: "Golf course properties in United Arab Emirates",
        href: "/featured-explore-properties?keyword=golf-course-properties",
      },
      {
        label: "Properties with private pool in United Arab Emirates",
        href: "/featured-explore-properties?keyword=private-pool",
      },
      {
        label: "Sea view properties in United Arab Emirates",
        href: "/featured-explore-properties?keyword=sea-view",
      },
      {
        label: "New launch properties in United Arab Emirates",
        href: "/new-projects-in-dubai",
      },
      {
        label: "Ready to move properties in United Arab Emirates",
        href: "/featured-explore-properties?status=1",
      },
    ],
  },
  {
    title: "Lifestyle",
    links: [
      {
        label: "Family-friendly communities in UAE",
        href: "/dubai-lifestyle-properties?keyword=family-friendly",
      },
      {
        label: "Gated communities in UAE",
        href: "/dubai-lifestyle-properties?keyword=gated-communities",
      },
      {
        label: "High ROI areas in UAE",
        href: "/dubai-lifestyle-properties?keyword=high-roi",
      },
      {
        label: "Pet-friendly properties in UAE",
        href: "/dubai-lifestyle-properties?keyword=pet-friendly",
      },
      {
        label: "Properties near metro in Dubai",
        href: "/dubai-lifestyle-properties?keyword=near-metro",
      },
      {
        label: "Branded residences in UAE",
        href: "/dubai-lifestyle-properties?keyword=branded-residences",
      },
    ],
  },
  {
    title: "Property Types",
    links: [
      {
        label: "Apartments for sale in United Arab Emirates",
        href: "/apartments-for-sale-in-dubai",
      },
      {
        label: "Villas for sale in United Arab Emirates",
        href: "/properties-for-sale-dubai?type=villas",
      },
      {
        label: "Townhouses for sale in United Arab Emirates",
        href: "/properties-for-sale-dubai?type=townhouses",
      },
      {
        label: "Penthouses for sale in United Arab Emirates",
        href: "/properties-for-sale-dubai?type=penthouses",
      },
      {
        label: "Duplexes for sale in United Arab Emirates",
        href: "/properties-for-sale-dubai?type=duplexes",
      },
      {
        label: "Mansions for sale in United Arab Emirates",
        href: "/properties-for-sale-dubai?type=mansions",
      },
      {
        label: "Waterfront homes for sale in United Arab Emirates",
        href: "/properties-for-sale-dubai?type=waterfront",
      },
      {
        label: "Off-plan properties in United Arab Emirates",
        href: "/off-plan-properties-in-dubai",
      },
      {
        label: "Luxury homes for sale in United Arab Emirates",
        href: "/featured-explore-properties",
      },
    ],
  },
  {
    title: "Popular Cities",
    links: [
      {
        label: "Properties for sale in Palm Jumeirah, Dubai",
        href: "/neighborhood-guide/palm-jumeirah",
      },
      {
        label: "Properties for sale in Dubai Marina, Dubai",
        href: "/neighborhood-guide/dubai-marina",
      },
      {
        label: "Properties for sale in Downtown Dubai",
        href: "/neighborhood-guide/downtown-dubai",
      },
      {
        label: "Properties for sale in Business Bay, Dubai",
        href: "/neighborhood-guide/business-bay",
      },
      {
        label: "Properties for sale in Dubai Hills Estate",
        href: "/neighborhood-guide/dubai-hills-estate",
      },
      {
        label: "Properties for sale in Palm Jumeirah Bay Island",
        href: "/neighborhood-guide/jumeirah-bay-island",
      },
      {
        label: "Properties for sale in Emirates Hills",
        href: "/neighborhood-guide/emirates-hills",
      },
      {
        label: "Properties for sale in Dubai Harbour",
        href: "/neighborhood-guide/dubai-harbour",
      },
      {
        label: "Properties for sale in Bluewaters Island",
        href: "/neighborhood-guide/bluewaters-island",
      },
      {
        label: "Properties for sale in Al Barari",
        href: "/neighborhood-guide/al-barari",
      },
      {
        label: "Properties for sale in Yas Island, Abu Dhabi",
        href: "/neighborhood-guide/yas-island",
      },
      {
        label: "Properties for sale in Saadiyat Island, Abu Dhabi",
        href: "/neighborhood-guide/saadiyat-island",
      },
      {
        label: "Properties for sale in Al Reem Island, Abu Dhabi",
        href: "/neighborhood-guide/al-reem-island",
      },
      {
        label: "Properties for sale in Al Marjan Island, Ras Al Khaimah",
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