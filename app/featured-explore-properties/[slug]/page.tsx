// app/featured-explore-properties/[slug]/page.tsx
import { Metadata } from "next";
import FeaturedExploreDetailClient from "./FeaturedExploreDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Featured Property in Dubai | ${slug.replace(/-/g, " ")}`,
    description: `Explore featured properties in Dubai. View details of ${slug.replace(/-/g, " ")}.`,
  };
}

export default async function FeaturedExploreDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <FeaturedExploreDetailClient slug={slug} />;
}