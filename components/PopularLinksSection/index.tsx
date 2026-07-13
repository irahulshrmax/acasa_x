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
        href: "/properties?keyword=luxury-homes-for-sale-in-united-arab-emirates",
      },
      {
        label: "Waterfront properties in United Arab Emirates",
        href: "/properties?keyword=waterfront-properties-in-united-arab-emirates",
      },
      {
        label: "Beachfront villas in United Arab Emirates",
        href: "/properties?keyword=beachfront-villas-in-united-arab-emirates",
      },
      {
        label: "Investment properties in United Arab Emirates",
        href: "/properties?keyword=investment-properties-in-united-arab-emirates",
      },
      {
        label: "Branded residences in United Arab Emirates",
        href: "/properties?keyword=branded-residences-in-united-arab-emirates",
      },
      {
        label: "Golf course properties in United Arab Emirates",
        href: "/properties?keyword=golf-course-properties-in-united-arab-emirates",
      },
      {
        label: "Properties with private pool in United Arab Emirates",
        href: "/properties?keyword=properties-with-private-pool-in-united-arab-emirates",
      },
      {
        label: "Sea view properties in United Arab Emirates",
        href: "/properties?keyword=sea-view-properties-in-united-arab-emirates",
      },
      {
        label: "New launch properties in United Arab Emirates",
        href: "/properties?keyword=new-launch-properties-in-united-arab-emirates",
      },
      {
        label: "Ready to move properties in United Arab Emirates",
        href: "/properties?keyword=ready-to-move-properties-in-united-arab-emirates",
      },
    ],
  },
  {
    title: "Lifestyle",
    links: [
      {
        label: "Family-friendly communities in UAE",
        href: "/properties?keyword=family-friendly-communities-in-uae",
      },
      {
        label: "Gated communities in UAE",
        href: "/properties?keyword=gated-communities-in-uae",
      },
      {
        label: "High ROI areas in UAE",
        href: "/properties?keyword=high-roi-areas-in-uae",
      },
      {
        label: "Pet-friendly properties in UAE",
        href: "/properties?keyword=pet-friendly-properties-in-uae",
      },
      {
        label: "Properties near metro in Dubai",
        href: "/properties?keyword=properties-near-metro-in-dubai",
      },
      {
        label: "Branded residences in UAE",
        href: "/properties?keyword=branded-residences-in-uae",
      },
    ],
  },
  {
    title: "Property Types",
    links: [
      {
        label: "Apartments for sale in United Arab Emirates",
        href: "/properties?type=apartments-for-sale-in-united-arab-emirates",
      },
      {
        label: "Villas for sale in United Arab Emirates",
        href: "/properties?type=villas-for-sale-in-united-arab-emirates",
      },
      {
        label: "Townhouses for sale in United Arab Emirates",
        href: "/properties?type=townhouses-for-sale-in-united-arab-emirates",
      },
      {
        label: "Penthouses for sale in United Arab Emirates",
        href: "/properties?type=penthouses-for-sale-in-united-arab-emirates",
      },
      {
        label: "Duplexes for sale in United Arab Emirates",
        href: "/properties?type=duplexes-for-sale-in-united-arab-emirates",
      },
      {
        label: "Mansions for sale in United Arab Emirates",
        href: "/properties?type=mansions-for-sale-in-united-arab-emirates",
      },
      {
        label: "Waterfront homes for sale in United Arab Emirates",
        href: "/properties?type=waterfront-homes-for-sale-in-united-arab-emirates",
      },
      {
        label: "Off-plan properties in United Arab Emirates",
        href: "/properties?type=off-plan-properties-in-united-arab-emirates",
      },
      {
        label: "Luxury homes for sale in United Arab Emirates",
        href: "/properties?type=luxury-homes-for-sale-in-united-arab-emirates",
      },
    ],
  },
  {
    title: "Popular Cities",
    links: [
      {
        label: "Properties for sale in Palm Jumeirah, Dubai",
        href: "/properties?location=palm-jumeirah-dubai",
      },
      {
        label: "Properties for sale in Dubai Marina, Dubai",
        href: "/properties?location=dubai-marina-dubai",
      },
      {
        label: "Properties for sale in Downtown Dubai",
        href: "/properties?location=downtown-dubai",
      },
      {
        label: "Properties for sale in Business Bay, Dubai",
        href: "/properties?location=business-bay-dubai",
      },
      {
        label: "Properties for sale in Dubai Hills Estate",
        href: "/properties?location=dubai-hills-estate",
      },
      {
        label: "Properties for sale in Palm Jumeirah Bay Island",
        href: "/properties?location=palm-jumeirah-bay-island",
      },
      {
        label: "Properties for sale in Palm Emirates Hills",
        href: "/properties?location=emirates-hills",
      },
      {
        label: "Properties for sale in Palm Dubai Harbour",
        href: "/properties?location=dubai-harbour",
      },
      {
        label: "Properties for sale in Palm Bluewaters Island",
        href: "/properties?location=bluewaters-island",
      },
      {
        label: "Properties for sale in Palm Al Barari",
        href: "/properties?location=al-barari",
      },
      {
        label: "Properties for sale in Yas Island, Abu Dhabi",
        href: "/properties?location=yas-island-abu-dhabi",
      },
      {
        label: "Properties for sale in Saadiyat Island, Abu Dhabi",
        href: "/properties?location=saadiyat-island-abu-dhabi",
      },
      {
        label: "Properties for sale in Al Reem Island, Abu Dhabi",
        href: "/properties?location=al-reem-island-abu-dhabi",
      },
      {
        label: "Properties for sale in Al Marjan Island, Ras Al Khaimah",
        href: "/properties?location=al-marjan-island-ras-al-khaimah",
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