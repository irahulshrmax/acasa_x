// app/api/v1/properties/archive/[id]/route.ts - FIXED VERSION

import { NextRequest, NextResponse } from 'next/server';
import {
  getPropertyById,
  getPropertyBySlug,
  updateProperty,
  permanentDeleteProperty,
} from '@/lib/models/properties';

// ─── STATUS LABELS ──────────────────────────────────────────────────────

const STATUS_LABELS: Record<number, string> = {
  0: 'Archived',
  1: 'Draft',
  2: 'Pending Review',
  3: 'Sold',
  4: 'Rejected',
  5: 'Active',
  6: 'Suspended',
  7: 'Under Offer',
  8: 'Reserved',
};

function getStatusLabel(status: number): string {
  return STATUS_LABELS[status] || `Status ${status}`;
}

// ─── CACHE ─────────────────────────────────────────────────────────────

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60;

function getCached(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL * 1000) {
    cache.delete(key);
    return null;
  }
  return cached.data;
}

function setCached(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function clearCache(pattern?: string): void {
  if (pattern) {
    const keys = Array.from(cache.keys());
    for (const key of keys) {
      if (key.includes(pattern)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
}

// ─── GET: Get single archived property ────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idOrSlug } = await params;
    const { searchParams } = new URL(request.url);
    const includeSimilar = searchParams.get('similar') === 'true';

    // ─── Check Cache ──────────────────────────────────────────────────
    const cacheKey = `archive:item:${idOrSlug}`;
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        cached: true,
        meta: { ...cachedData.meta, cached_at: new Date().toISOString() }
      });
    }

    // ─── Fetch Property ──────────────────────────────────────────────
    let property = null;

    if (!isNaN(parseInt(idOrSlug))) {
      property = await getPropertyById(parseInt(idOrSlug));
    }

    if (!property) {
      property = await getPropertyBySlug(idOrSlug);
    }

    if (!property) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Archive property not found',
          error: `Property with ID/Slug "${idOrSlug}" not found`,
        },
        { status: 404 }
      );
    }

    // ─── Check if property is inactive ───────────────────────────────
    const isInactive = property.status === 0 || property.status === 1 || property.status === 2 || property.status === 4 || property.status === 6;

    if (!isInactive) {
      return NextResponse.json(
        {
          success: false,
          message: 'Property is not archived or inactive',
          data: {
            id: property.id,
            name: property.property_name,
            status: property.status,
            status_label: getStatusLabel(property.status),
          },
        },
        { status: 400 }
      );
    }

    // ─── Build Response ──────────────────────────────────────────────
    const response = {
      success: true,
      data: {
        ...property,
        status_label: getStatusLabel(property.status),
        is_archived: property.status === 0,
        is_draft: property.status === 1,
        is_pending: property.status === 2,
      },
      meta: {
        id: property.id,
        slug: property.property_slug,
        status: property.status,
        status_label: getStatusLabel(property.status),
        can_restore: property.status === 0,
        can_edit: property.status === 0 || property.status === 1 || property.status === 2,
        can_permanently_delete: property.status === 0,
        timestamp: new Date().toISOString(),
      },
      cached: false,
    };

    setCached(cacheKey, response);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Archive GET Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch archive property', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// ─── PUT: Restore archive property ─────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id);
    const body = await request.json();
    const targetStatus = body.status || 5; // Default restore to Active

    const property = await getPropertyById(idNum);
    if (!property) {
      return NextResponse.json(
        { success: false, message: 'Property not found' },
        { status: 404 }
      );
    }

    // Only archived (status 0) can be restored
    if (property.status !== 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Only archived properties (status: 0) can be restored',
          data: { 
            id: property.id, 
            status: property.status,
            status_label: getStatusLabel(property.status)
          },
        },
        { status: 400 }
      );
    }

    const updated = await updateProperty(idNum, { status: targetStatus });

    // Clear cache
    clearCache('archive');
    clearCache(`archive:item:${id}`);
    clearCache(`archive:item:${property.property_slug}`);
    clearCache('properties');

    return NextResponse.json({
      success: true,
      message: `Property restored successfully to ${getStatusLabel(targetStatus)}`,
      data: updated,
      meta: {
        id: idNum,
        restored: true,
        previous_status: 0,
        new_status: targetStatus,
        new_label: getStatusLabel(targetStatus),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Archive PUT Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to restore property', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// ─── PATCH: Update archive property details ───────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id);
    const body = await request.json();

    const property = await getPropertyById(idNum);
    if (!property) {
      return NextResponse.json(
        { success: false, message: 'Property not found' },
        { status: 404 }
      );
    }

    // Only allow updates for inactive properties
    const isInactive = property.status === 0 || property.status === 1 || property.status === 2;
    if (!isInactive) {
      return NextResponse.json(
        {
          success: false,
          message: 'Only archived/inactive properties can be updated',
          data: { 
            id: property.id, 
            status: property.status,
            status_label: getStatusLabel(property.status)
          },
        },
        { status: 400 }
      );
    }

    // Allowed fields to update
    const allowedFields = [
      'property_name',
      'description',
      'price',
      'area',
      'bedroom',
      'bathrooms',
      'completion_date',
      'exclusive_status',
      'dld_permit',
      'property_slug',
      'video_url',
      'whatsapp_url',
      'furnishing',
      'parking',
      'seo_title',
      'meta_description',
      'keyword',
      'amenities',
      'property_features',
      'flooring',
      'property_status',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updated = await updateProperty(idNum, updateData);

    // Clear cache
    clearCache('archive');
    clearCache(`archive:item:${id}`);
    clearCache(`archive:item:${property.property_slug}`);

    return NextResponse.json({
      success: true,
      message: 'Property updated successfully',
      data: updated,
      meta: {
        id: idNum,
        updated_fields: Object.keys(updateData),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Archive PATCH Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update property', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// ─── DELETE: Permanently delete archive property ─────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id);
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm') === 'true';

    const property = await getPropertyById(idNum);
    if (!property) {
      return NextResponse.json(
        { success: false, message: 'Property not found' },
        { status: 404 }
      );
    }

    if (property.status !== 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Only archived properties (status: 0) can be permanently deleted',
          data: { 
            id: property.id, 
            status: property.status,
            status_label: getStatusLabel(property.status)
          },
        },
        { status: 400 }
      );
    }

    if (!confirm) {
      return NextResponse.json(
        {
          success: false,
          message: '⚠️ Confirmation required. Use ?confirm=true to permanently delete.',
          data: { 
            id: property.id,
            name: property.property_name,
            status: property.status,
          },
          required: '?confirm=true',
        },
        { status: 400 }
      );
    }

    const result = await permanentDeleteProperty(idNum);

    // Clear cache
    clearCache('archive');
    clearCache(`archive:item:${id}`);
    clearCache(`archive:item:${property.property_slug}`);
    clearCache('properties');

    return NextResponse.json({
      success: true,
      message: 'Property permanently deleted',
      data: result,
      meta: {
        id: idNum,
        deleted: true,
        permanent: true,
        name: property.property_name,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Archive DELETE Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete property', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 60;