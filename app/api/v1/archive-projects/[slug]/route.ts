// app/api/v1/archive-projects/[slug]/route.ts

import { NextResponse } from "next/server";
import {
  getArchiveProjectBySlug,
  getArchiveProjectById,
  incrementArchiveProjectViews,
  getRelatedArchiveProjects,
} from "@/lib/models/archive-projects";
import { cache } from "@/lib/cache";

const CACHE_TTL = 600;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const cacheKey = `archive:detail:${slug}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json({
      success: true,
      data: cached,
      meta: { cached: true }
    });
  }

  try {
    let project = await getArchiveProjectBySlug(slug);

    if (!project) {
      const numericId = parseInt(slug, 10);
      if (!isNaN(numericId)) {
        project = await getArchiveProjectById(numericId);
      }
    }

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    await incrementArchiveProjectViews(project.id);

    const relatedProjects = await getRelatedArchiveProjects(project.id, 6);

    const response = {
      id: project.id,
      title: project.ProjectName,
      slug: project.project_slug,
      location: project.LocationName || project.CityName || "Dubai",
      price: project.price_display,
      price_raw: project.price,
      featured_image: project.image_url,
      gallery_images: project.gallery_images,
      beds: project.bedrooms_label,
      beds_raw: project.bedroom,
      sqft: project.area_display,
      sqft_raw: project.area,
      handover: project.handover_display,
      handover_raw: project.completion_date,
      listingType: project.listing_type,
      description: project.description,
      amenities: project.amenities ? project.amenities.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
      refNo: project.ProjectNumber,
      developer: project.developer_name,
      developer_logo: project.developer_logo,
      developer_website: project.developer_website,
      developer_description: project.developer_description,
      map_latitude: project.latitude,
      map_longitude: project.longitude,
      video_url: project.video_url,
      occupancy: project.occupancy,
      exclusive_status: project.exclusive_status,
      property_type: project.property_type,
      status: project.status,
      verified: project.verified === "1" ? 1 : 0,
      featured_project: project.featured_project || "0",
      views: project.views || 0,
      created_at: project.created_at,
      updated_at: project.updated_at,
      developer_id: project.developer_id,
      related_projects: relatedProjects.data.map((p) => ({
        id: p.id,
        title: p.ProjectName,
        slug: p.project_slug,
        image: p.image_url,
        price: p.price_display,
        location: p.LocationName || p.CityName || "Dubai",
      })),
    };

    await cache.set(cacheKey, response, { ttl: CACHE_TTL, tags: ['archive', 'detail', `slug:${slug}`] });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error("Error fetching archive project:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}