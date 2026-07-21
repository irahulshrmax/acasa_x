// app/luxury-properties/[slug]/page.tsx
import { Metadata } from "next";
import LuxuryPropertyDetailClient from "./LuxeryPropertiesDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Luxury Property in Dubai | ${slug.replace(/-/g, " ")}`,
    description: `Explore luxury properties in Dubai. View details of ${slug.replace(/-/g, " ")}.`,
  };
}

export default async function LuxuryPropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <LuxuryPropertyDetailClient slug={slug} />;
}