// app/api/v1/properties/archive/route.ts - COMPLETE FIXED VERSION

import { NextRequest, NextResponse } from 'next/server';
import { 
  getArchiveProperties, 
  getProperties,
  updateProperty,
  getPropertyById,
  permanentDeleteProperty 
} from '@/lib/models/properties';
import { fixPropertiesPrices, fixPropertyPrice, formatPriceDisplay } from '@/lib/utils/formatPrice';

// ─── CONSTANTS ──────────────────────────────────────────────────────────

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const CACHE_TTL = 60;
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

const STATUS_COLORS: Record<number, string> = {
  0: 'gray',
  1: 'yellow',
  2: 'blue',
  3: 'green',
  4: 'red',
  5: 'emerald',
  6: 'orange',
  7: 'purple',
  8: 'indigo',
};

function getStatusLabel(status: number): string {
  return STATUS_LABELS[status] || `Status ${status}`;
}

function getStatusColor(status: number): string {
  return STATUS_COLORS[status] || 'gray';
}

// ─── STRONG PRICE FIXER FOR ARCHIVE ──────────────────────────────────

function fixArchivePropertyPrice(property: any): any {
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

  // ─── TRY TO GET AMOUNT FROM VARIOUS SOURCES ──────────────────────
  let amount = null;
  
  // Check all possible price fields
  if (price.amount && price.amount !== 'null' && !isNaN(parseFloat(price.amount))) {
    amount = parseFloat(price.amount);
  } else if (price.sale_price && price.sale_price !== 'null' && !isNaN(parseFloat(price.sale_price))) {
    amount = parseFloat(price.sale_price);
  } else if (price.listing_price && price.listing_price !== 'null' && !isNaN(parseFloat(price.listing_price))) {
    amount = parseFloat(price.listing_price);
  } else if (price.rental_price && price.rental_price !== 'null' && !isNaN(parseFloat(price.rental_price))) {
    amount = parseFloat(price.rental_price);
  } else if (price.amount_from && price.amount_from !== 'null' && !isNaN(parseFloat(price.amount_from))) {
    amount = parseFloat(price.amount_from);
  }

  // Store the amount
  price.amount = amount;

  // ─── GET CURRENCY AND SYMBOL ──────────────────────────────────────
  let currency = price.currency || DEFAULT_CURRENCY;
  let symbol = price.symbol || DEFAULT_SYMBOL;

  // Clean up null strings
  if (currency === 'null' || !currency) currency = DEFAULT_CURRENCY;
  if (symbol === 'null' || !symbol) symbol = DEFAULT_SYMBOL;

  price.currency = currency;
  price.symbol = symbol;

  // ─── GENERATE DISPLAY ─────────────────────────────────────────────
  if (amount && amount > 0) {
    // Format the amount with proper locale
    const formattedAmount = Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    // Use symbol if available, otherwise use currency code
    const prefix = (symbol && symbol !== 'null') ? symbol : currency;
    price.display = `${prefix} ${formattedAmount}`;

    // If there's an end amount, add range
    let amountEnd = null;
    if (price.amount_end && price.amount_end !== 'null' && !isNaN(parseFloat(price.amount_end))) {
      amountEnd = parseFloat(price.amount_end);
    } else if (price.amount_to && price.amount_to !== 'null' && !isNaN(parseFloat(price.amount_to))) {
      amountEnd = parseFloat(price.amount_to);
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
    // No valid amount found
    price.display = FALLBACK_DISPLAY;
    price.is_price_on_request = true;
  }

  // ─── FIX AMOUNT_END ───────────────────────────────────────────────
  if (!price.amount_end || price.amount_end === 'null') {
    price.amount_end = null;
  }

  return property;
}

// ─── FIX ARCHIVE PROPERTIES BATCH ─────────────────────────────────────

function fixArchivePropertiesPrices(properties: any[]): any[] {
  if (!properties || !Array.isArray(properties)) return [];
  return properties.map(property => fixArchivePropertyPrice(property));
}

// ─── QUALITY SORTING FOR ARCHIVE ──────────────────────────────────────

type ArchivePropertyQuality = {
  hasPrice: boolean;
  hasImages: boolean;
  hasDescription: boolean;
  hasDeveloper: boolean;
  layer: number;
  score: number;
};

function getArchiveQuality(property: any): ArchivePropertyQuality {
  const hasPrice = !!(property.price?.amount || property.price?.sale_price);
  const hasImages = !!(property.images?.length > 0 || property.gallery_images?.length > 0);
  const hasDescription = !!(property.description && property.description.length > 50);
  const hasDeveloper = !!(property.developer?.name && property.developer?.name !== 'null');

  let layer = 4;
  if (hasPrice && hasImages && hasDescription && hasDeveloper) layer = 1;
  else if (hasPrice && hasImages && hasDescription) layer = 2;
  else if (hasPrice && hasImages) layer = 3;
  else layer = 4;

  let score = 0;
  if (hasPrice) score += 1000;
  if (hasImages) score += 100;
  if (hasDescription) score += 10;
  if (hasDeveloper) score += 1;

  return { hasPrice, hasImages, hasDescription, hasDeveloper, layer, score };
}

function sortArchiveByQuality(properties: any[]): any[] {
  return properties.sort((a, b) => {
    const qualityA = getArchiveQuality(a);
    const qualityB = getArchiveQuality(b);

    if (qualityA.layer !== qualityB.layer) {
      return qualityA.layer - qualityB.layer;
    }

    if (qualityA.score !== qualityB.score) {
      return qualityB.score - qualityA.score;
    }

    const priceA = a.price?.amount || a.price?.sale_price || 0;
    const priceB = b.price?.amount || b.price?.sale_price || 0;
    if (priceA !== priceB) {
      return priceB - priceA;
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

// ─── CACHE ─────────────────────────────────────────────────────────────

const cache = new Map<string, { data: any; timestamp: number }>();

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

function getCacheKey(req: NextRequest): string {
  const url = new URL(req.url);
  return url.pathname + url.search;
}

// ─── MAIN GET HANDLER ──────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    const sort = searchParams.get('sort') || 'newest';
    const keyword = searchParams.get('keyword') || '';
    const showAll = searchParams.get('show_all') === 'true';
    const sortByQuality = searchParams.get('sort_by_quality') === 'true';

    // ─── Status Filter ────────────────────────────────────────────────
    const statusParam = searchParams.get('status');
    let statuses: number[] = [0, 1, 2, 4, 6];

    if (statusParam) {
      statuses = statusParam.split(',').map(Number);
    }

    // ─── Date Range Filter ────────────────────────────────────────────
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    // ─── Price Range Filter ───────────────────────────────────────────
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');

    const effectiveLimit = showAll ? 9999 : Math.min(limit, MAX_LIMIT);
    const validPage = showAll ? 1 : Math.max(1, page);

    // ─── Check Cache ──────────────────────────────────────────────────
    const cacheKey = getCacheKey(request);
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        cached: true,
        meta: { ...cachedData.meta, cached_at: new Date().toISOString() }
      });
    }

    // ─── Build Filters ────────────────────────────────────────────────
    const filters: any = {
      keyword: keyword || undefined,
      sort_by: sort as any,
      page: validPage,
      limit: effectiveLimit,
      status: statuses,
    };

    if (minPrice) filters.min_price = parseInt(minPrice);
    if (maxPrice) filters.max_price = parseInt(maxPrice);

    // ─── Fetch Properties ─────────────────────────────────────────────
    const result = await getArchiveProperties(filters);

    // ─── FIX PRICES ──────────────────────────────────────────────────
    let fixedData = fixArchivePropertiesPrices(result.data);

    // ─── Sort by Quality if requested ────────────────────────────────
    let sortedData = fixedData;
    if (sortByQuality) {
      sortedData = sortArchiveByQuality(fixedData);
    }

    // ─── Status Breakdown ─────────────────────────────────────────────
    const statusBreakdown = result.data.reduce((acc: any, p: any) => {
      const status = p.status !== undefined ? p.status : 'unknown';
      const label = getStatusLabel(status);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    // ─── Build Response ───────────────────────────────────────────────
    const response = {
      success: true,
      data: sortedData,
      meta: {
        ...result.meta,
        type: 'archived',
        show_all: showAll,
        effective_limit: effectiveLimit,
        statuses: statuses,
        status_labels: statuses.map(s => ({ value: s, label: getStatusLabel(s) })),
        breakdown: statusBreakdown,
        filters: {
          keyword: keyword || null,
          sort: sort,
          from_date: fromDate || null,
          to_date: toDate || null,
          min_price: minPrice || null,
          max_price: maxPrice || null,
        },
        quality_sort: sortByQuality,
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
        message: 'Failed to fetch archive properties',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// ─── POST: Move property to archive ────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status = 0 } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Property ID is required' },
        { status: 400 }
      );
    }

    const property = await getPropertyById(parseInt(id));
    if (!property) {
      return NextResponse.json(
        { success: false, message: 'Property not found' },
        { status: 404 }
      );
    }

    if (property.status === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Property is already archived',
          data: { id: property.id, name: property.property_name }
        },
        { status: 400 }
      );
    }

    // Move to archive: Set status to 0
    const updated = await updateProperty(parseInt(id), { status });

    // Fix price after update
    if (updated && updated.price) {
      fixArchivePropertyPrice(updated);
    }

    // Clear cache
    clearCache('archive');
    clearCache('properties');

    return NextResponse.json({
      success: true,
      message: status === 0 ? 'Property archived successfully' : `Property status changed to ${getStatusLabel(status)}`,
      data: updated,
      meta: {
        id: parseInt(id),
        previous_status: property.status,
        previous_label: getStatusLabel(property.status),
        new_status: status,
        new_label: getStatusLabel(status),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Archive POST Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to archive property', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// ─── PUT: Bulk archive/restore multiple properties ────────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, action = 'archive', status = 0 } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Array of property IDs is required' },
        { status: 400 }
      );
    }

    if (ids.length > 100) {
      return NextResponse.json(
        { success: false, message: 'Maximum 100 properties per batch' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];
    const skipped = [];

    for (const id of ids) {
      try {
        const property = await getPropertyById(parseInt(id));
        if (!property) {
          errors.push({ id, error: 'Property not found' });
          continue;
        }

        // Check if action is valid for current status
        if (action === 'archive') {
          if (property.status === 0) {
            skipped.push({ 
              id, 
              name: property.property_name,
              reason: 'Already archived' 
            });
            continue;
          }
          const updated = await updateProperty(parseInt(id), { status });
          // Fix price
          if (updated && updated.price) {
            fixArchivePropertyPrice(updated);
          }
          results.push({ 
            id, 
            action: 'archived', 
            name: property.property_name,
            previous_status: property.status,
          });
        } 
        else if (action === 'restore') {
          if (property.status !== 0) {
            skipped.push({ 
              id, 
              name: property.property_name,
              reason: 'Not archived' 
            });
            continue;
          }
          const updated = await updateProperty(parseInt(id), { status: 5 });
          // Fix price
          if (updated && updated.price) {
            fixArchivePropertyPrice(updated);
          }
          results.push({ 
            id, 
            action: 'restored', 
            name: property.property_name,
            new_status: 5,
          });
        }
        else {
          errors.push({ id, error: `Invalid action: ${action}` });
        }
      } catch (err: any) {
        errors.push({ id, error: err.message });
      }
    }

    // Clear cache
    clearCache('archive');
    clearCache('properties');

    return NextResponse.json({
      success: true,
      message: `${action === 'archive' ? 'Archived' : 'Restored'} ${results.length} properties`,
      data: {
        processed: results,
        skipped: skipped,
        failed: errors,
      },
      meta: {
        total: ids.length,
        successful: results.length,
        skipped: skipped.length,
        failed: errors.length,
        action: action,
        price_fixed: true,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Archive PUT Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process archive action', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// ─── DELETE: Empty archive ─────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm') === 'true';
    const statusParam = searchParams.get('status') || '0';
    const dryRun = searchParams.get('dry_run') === 'true';

    if (!confirm) {
      return NextResponse.json(
        {
          success: false,
          message: '⚠️ Confirmation required. Use ?confirm=true to proceed.',
          action: 'empty_archive',
          required: '?confirm=true',
        },
        { status: 400 }
      );
    }

    const statuses = statusParam.split(',').map(Number);

    // Get all properties with given statuses
    const result = await getProperties({
      status: statuses,
      limit: 9999,
      page: 1,
    });

    const properties = result.data || [];
    const ids = properties.map((p: any) => p.id);

    if (ids.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No properties found to delete',
        data: { deleted: 0, total_checked: 0 },
      });
    }

    // Dry run - just return what would be deleted
    if (dryRun) {
      const fixedProperties = fixArchivePropertiesPrices(properties);
      return NextResponse.json({
        success: true,
        message: `Dry run: ${ids.length} properties would be permanently deleted`,
        data: {
          would_delete: ids.length,
          properties: fixedProperties.map((p: any) => ({
            id: p.id,
            name: p.property_name,
            price: p.price?.display || p.price?.amount || null,
            created_at: p.created_at,
          })),
        },
        meta: {
          dry_run: true,
          statuses: statuses,
          price_fixed: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Permanently delete all
    const deleted = [];
    for (const id of ids) {
      try {
        await permanentDeleteProperty(id);
        deleted.push(id);
      } catch (err: any) {
        console.error(`Failed to delete property ${id}:`, err);
      }
    }

    // Clear cache
    clearCache('archive');
    clearCache('properties');

    return NextResponse.json({
      success: true,
      message: `Permanently deleted ${deleted.length} properties`,
      data: { 
        deleted: deleted,
        total_requested: ids.length,
        failed: ids.length - deleted.length,
      },
      meta: {
        count: deleted.length,
        statuses: statuses,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Archive DELETE Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to empty archive', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// ─── OPTIONS: CORS ─────────────────────────────────────────────────────

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 60;