// app/api/v1/properties/archive/[id]/route.ts - COMPLETE FIXED VERSION

import { NextRequest, NextResponse } from 'next/server';
import {
  getPropertyById,
  getPropertyBySlug,
  updateProperty,
  permanentDeleteProperty,
} from '@/lib/models/properties';

// ─── CONSTANTS ──────────────────────────────────────────────────────────

const DEFAULT_CURRENCY = 'AED';
const DEFAULT_SYMBOL = 'AED';
const FALLBACK_DISPLAY = 'Price on Request';

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

// ─── STRONG PRICE FIXER ───────────────────────────────────────────────

function fixPropertyPrice(property: any): any {
  if (!property) return property;

  // If price doesn't exist, create it
  if (!property.price) {
    property.price = {
      amount: null,
      amount_end: null,
      display: FALLBACK_DISPLAY,
      display_end: '',
      currency: DEFAULT_CURRENCY,
      symbol: DEFAULT_SYMBOL,
      is_price_on_request: true,
      sale_price: null,
      listing_price: null,
      rental_price: null,
    };
    return property;
  }

  const price = property.price;

  // ─── TRY TO GET AMOUNT ─────────────────────────────────────────────
  let amount = null;
  
  if (price.amount && price.amount !== 'null' && !isNaN(parseFloat(price.amount))) {
    amount = parseFloat(price.amount);
  } else if (price.sale_price && price.sale_price !== 'null' && !isNaN(parseFloat(price.sale_price))) {
    amount = parseFloat(price.sale_price);
  } else if (price.listing_price && price.listing_price !== 'null' && !isNaN(parseFloat(price.listing_price))) {
    amount = parseFloat(price.listing_price);
  } else if (price.rental_price && price.rental_price !== 'null' && !isNaN(parseFloat(price.rental_price))) {
    amount = parseFloat(price.rental_price);
  }

  price.amount = amount;

  // ─── GET CURRENCY AND SYMBOL ──────────────────────────────────────
  let currency = price.currency || DEFAULT_CURRENCY;
  let symbol = price.symbol || DEFAULT_SYMBOL;

  if (currency === 'null' || !currency) currency = DEFAULT_CURRENCY;
  if (symbol === 'null' || !symbol) symbol = DEFAULT_SYMBOL;

  price.currency = currency;
  price.symbol = symbol;

  // ─── GENERATE DISPLAY ─────────────────────────────────────────────
  if (amount && amount > 0) {
    const formattedAmount = Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const prefix = (symbol && symbol !== 'null') ? symbol : currency;
    price.display = `${prefix} ${formattedAmount}`;

    // Handle amount_end
    let amountEnd = null;
    if (price.amount_end && price.amount_end !== 'null' && !isNaN(parseFloat(price.amount_end))) {
      amountEnd = parseFloat(price.amount_end);
    }

    if (amountEnd && amountEnd > 0 && amountEnd !== amount) {
      const formattedEnd = Number(amountEnd).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      price.display = `${prefix} ${formattedAmount} - ${formattedEnd}`;
      price.display_end = `${prefix} ${formattedEnd}`;
      price.amount_end = amountEnd;
    }

    price.is_price_on_request = false;
  } else {
    price.display = FALLBACK_DISPLAY;
    price.is_price_on_request = true;
  }

  if (!price.amount_end || price.amount_end === 'null') {
    price.amount_end = null;
  }

  return property;
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

    // ─── FIX PRICE ──────────────────────────────────────────────────
    const fixedProperty = fixPropertyPrice(property);

    // ─── Check if property is inactive ───────────────────────────────
    const isInactive = fixedProperty.status === 0 || fixedProperty.status === 1 || 
                       fixedProperty.status === 2 || fixedProperty.status === 4 || 
                       fixedProperty.status === 6;

    if (!isInactive) {
      return NextResponse.json(
        {
          success: false,
          message: 'Property is not archived or inactive',
          data: {
            id: fixedProperty.id,
            name: fixedProperty.property_name,
            status: fixedProperty.status,
            status_label: getStatusLabel(fixedProperty.status),
          },
        },
        { status: 400 }
      );
    }

    // ─── Build Response ──────────────────────────────────────────────
    const response = {
      success: true,
      data: {
        ...fixedProperty,
        status_label: getStatusLabel(fixedProperty.status),
        is_archived: fixedProperty.status === 0,
        is_draft: fixedProperty.status === 1,
        is_pending: fixedProperty.status === 2,
        price_display: fixedProperty.price?.display || FALLBACK_DISPLAY,
      },
      meta: {
        id: fixedProperty.id,
        slug: fixedProperty.property_slug,
        status: fixedProperty.status,
        status_label: getStatusLabel(fixedProperty.status),
        can_restore: fixedProperty.status === 0,
        can_edit: fixedProperty.status === 0 || fixedProperty.status === 1 || fixedProperty.status === 2,
        can_permanently_delete: fixedProperty.status === 0,
        price_fixed: true,
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
    const targetStatus = body.status || 5;

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
    
    // Fix price after update
    const fixedUpdated = fixPropertyPrice(updated);

    // Clear cache
    clearCache('archive');
    clearCache(`archive:item:${id}`);
    clearCache(`archive:item:${property.property_slug}`);
    clearCache('properties');

    return NextResponse.json({
      success: true,
      message: `Property restored successfully to ${getStatusLabel(targetStatus)}`,
      data: fixedUpdated,
      meta: {
        id: idNum,
        restored: true,
        previous_status: 0,
        new_status: targetStatus,
        new_label: getStatusLabel(targetStatus),
        price_fixed: true,
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

    const allowedFields = [
      'property_name', 'description', 'price', 'area', 'bedroom',
      'bathrooms', 'completion_date', 'exclusive_status', 'dld_permit',
      'property_slug', 'video_url', 'whatsapp_url', 'furnishing',
      'parking', 'seo_title', 'meta_description', 'keyword',
      'amenities', 'property_features', 'flooring', 'property_status',
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
    
    // Fix price after update
    const fixedUpdated = fixPropertyPrice(updated);

    // Clear cache
    clearCache('archive');
    clearCache(`archive:item:${id}`);
    clearCache(`archive:item:${property.property_slug}`);

    return NextResponse.json({
      success: true,
      message: 'Property updated successfully',
      data: fixedUpdated,
      meta: {
        id: idNum,
        updated_fields: Object.keys(updateData),
        price_fixed: true,
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