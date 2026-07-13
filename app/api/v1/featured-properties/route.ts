import { NextResponse } from "next/server";
import { getProperties } from '@/lib/models/properties';

/**
 * GET /api/public/featured-properties
 * 
 * Fetches featured properties from the database using the property model
 * Returns a standardized response with transformed data
 */
export async function GET() {
  try {
    // Fetch featured properties with status 1 (active) instead of 5
    const result = await getProperties({
      featured: true,
      status: 1, // Changed from default 5 to 1
      limit: 10,
      sort_by: 'newest'
    });
    
    // Validate result structure
    if (!result || !result.data) {
      return NextResponse.json(
        {
          success: false,
          message: "No data received from database",
          data: [],
          meta: { total: 0 },
        },
        { status: 404 }
      );
    }

    // Transform the rich property data to a flat structure for the frontend
    const transformedData = result.data.map((property: any) => ({
      id: property.id || null,
      name: property.name || "Untitled Property",
      slug: property.slug || "",
      listing_type: property.listing_type || null,
      price: property.price?.amount ?? property.price?.display ?? null,
      bedroom: property.bedrooms || null,
      area: property.area?.value || property.area?.display || null,
      completion_date: property.completion_date || null,
      featured_image: property.featured_image_url || property.image || null,
      description: property.description || null,
      status: property.status ?? 1,
      city_name: property.location?.city || null,
      developer_name: property.developer?.name || null,
      currency: property.price?.currency || "AED",
      price_display: property.price?.display || null,
      image_variations: property.image_variations || [],
      gallery_preview: property.gallery_preview || [],
    }));

    // Return successful response with pagination metadata
    return NextResponse.json(
      {
        success: true,
        data: transformedData,
        meta: {
          total: result.meta?.total || transformedData.length,
          limit: result.meta?.limit || 10,
          page: result.meta?.page || 1,
          totalPages: result.meta?.totalPages || 1,
        },
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        }
      }
    );
  } catch (error: unknown) {
    // Log the error for debugging
    console.error("[Featured Properties API Error]:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // Return a user-friendly error response
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred while fetching featured properties",
        data: [],
        meta: { total: 0 },
      },
      { 
        status: error instanceof Error && error.message.includes("Connection") ? 503 : 500 
      }
    );
  }
}