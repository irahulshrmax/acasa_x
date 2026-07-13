// app/api/v1/properties/archive/stats/route.ts 

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

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

// ─── TYPES ─────────────────────────────────────────────────────────────

interface BedroomDistribution {
  bedroom: string;
  count: number;
}

interface PriceStats {
  with_price: number;
  min_price: number | null;
  max_price: number | null;
  avg_price: number | null;
}

interface DateRange {
  earliest: string | null;
  latest: string | null;
}

interface StatusBreakdown {
  status: number;
  label: string;
  color: string;
  count: number;
}

interface ArchiveStats {
  total: number;
  active: number;
  inactive: number;
  archived: number;
  draft: number;
  pending: number;
  rejected: number;
  suspended: number;
  breakdown: StatusBreakdown[];
  archived_price_stats: PriceStats;
  archived_bedroom_distribution: BedroomDistribution[];
  archived_date_range: DateRange;
  percentages: {
    active: number;
    inactive: number;
    archived: number;
  };
  meta: {
    timestamp: string;
  };
}

interface DetailedArchiveStats extends ArchiveStats {
  recent_archived: Array<{
    id: number;
    name: string;
    price: number | null;
    archived_at: string;
  }>;
  activity_last_30_days: Array<{
    date: string;
    count: number;
  }>;
}

// ─── HELPERS ───────────────────────────────────────────────────────────

function mapBedroomDistribution(rows: any[]): BedroomDistribution[] {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((row: any) => ({
    bedroom: String(row.bedroom || 'Unknown'),
    count: Number(row.count || 0)
  }));
}

function mapStatusBreakdown(rows: any[]): StatusBreakdown[] {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((row: any) => ({
    status: Number(row.status || 0),
    label: getStatusLabel(Number(row.status || 0)),
    color: getStatusColor(Number(row.status || 0)),
    count: Number(row.count || 0)
  }));
}

function mapPriceStats(row: any): PriceStats {
  return {
    with_price: Number(row?.with_price || 0),
    min_price: row?.min_price ? Number(row.min_price) : null,
    max_price: row?.max_price ? Number(row.max_price) : null,
    avg_price: row?.avg_price ? Number(row.avg_price) : null,
  };
}

function mapDateRange(row: any): DateRange {
  return {
    earliest: row?.earliest || null,
    latest: row?.latest || null,
  };
}

// ─── MAIN GET HANDLER ──────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const knex = await db();
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    // ─── Check Cache ──────────────────────────────────────────────────
    const cacheKey = 'archive:stats:' + (detailed ? 'detailed' : 'basic');
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        cached: true,
        meta: { ...cachedData.meta, cached_at: new Date().toISOString() }
      });
    }

    // ─── Get counts for all statuses ──────────────────────────────────
    const statusCounts = await knex('properties')
      .select('status')
      .count('* as count')
      .groupBy('status')
      .orderBy('status');

    // ─── Total counts ──────────────────────────────────────────────────
    const [total, active, archived, draft, pending, rejected, suspended] = await Promise.all([
      knex('properties').count('* as total').first(),
      knex('properties').where('status', 5).count('* as total').first(),
      knex('properties').where('status', 0).count('* as total').first(),
      knex('properties').where('status', 1).count('* as total').first(),
      knex('properties').where('status', 2).count('* as total').first(),
      knex('properties').where('status', 4).count('* as total').first(),
      knex('properties').where('status', 6).count('* as total').first(),
    ]);

    // ─── Price stats for archived ─────────────────────────────────────
    const priceStatsRaw = await knex('properties')
      .where('status', 0)
      .whereNotNull('price')
      .where('price', '>', 0)
      .select(
        knex.raw('COUNT(*) as with_price'),
        knex.raw('MIN(price) as min_price'),
        knex.raw('MAX(price) as max_price'),
        knex.raw('AVG(price) as avg_price')
      )
      .first();

    // ─── Bedroom distribution for archived ────────────────────────────
    const bedroomStatsRaw = await knex('properties')
      .where('status', 0)
      .whereNotNull('bedroom')
      .select('bedroom')
      .count('* as count')
      .groupBy('bedroom')
      .orderBy('bedroom');

    // ─── Date range for archived ──────────────────────────────────────
    const dateRangeRaw = await knex('properties')
      .where('status', 0)
      .select(
        knex.raw('MIN(created_at) as earliest'),
        knex.raw('MAX(created_at) as latest')
      )
      .first();

    // ─── Calculate counts ─────────────────────────────────────────────
    const totalCount = Number(total?.total) || 0;
    const activeCount = Number(active?.total) || 0;
    const archivedCount = Number(archived?.total) || 0;
    const draftCount = Number(draft?.total) || 0;
    const pendingCount = Number(pending?.total) || 0;
    const rejectedCount = Number(rejected?.total) || 0;
    const suspendedCount = Number(suspended?.total) || 0;

    const inactiveCount = archivedCount + draftCount + pendingCount + rejectedCount + suspendedCount;

    // ─── Map data with proper types ──────────────────────────────────
    const breakdown = mapStatusBreakdown(statusCounts);
    const priceStats = mapPriceStats(priceStatsRaw);
    const bedroomDistribution = mapBedroomDistribution(bedroomStatsRaw);
    const dateRange = mapDateRange(dateRangeRaw);

    // ─── Build Base Stats ─────────────────────────────────────────────
    const baseStats: ArchiveStats = {
      total: totalCount,
      active: activeCount,
      inactive: inactiveCount,
      archived: archivedCount,
      draft: draftCount,
      pending: pendingCount,
      rejected: rejectedCount,
      suspended: suspendedCount,
      breakdown: breakdown,
      archived_price_stats: priceStats,
      archived_bedroom_distribution: bedroomDistribution,
      archived_date_range: dateRange,
      percentages: {
        active: totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0,
        inactive: totalCount > 0 ? Math.round((inactiveCount / totalCount) * 100) : 0,
        archived: totalCount > 0 ? Math.round((archivedCount / totalCount) * 100) : 0,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    // ─── Build Response ──────────────────────────────────────────────
    let responseData: ArchiveStats | DetailedArchiveStats = baseStats;

    if (detailed) {
      // Get recent archived properties
      const recentArchived = await knex('properties')
        .where('status', 0)
        .orderBy('updated_at', 'desc')
        .limit(10)
        .select('id', 'property_name', 'price', 'updated_at', 'created_at');

      // Get archive activity over time (last 30 days)
      const activity = await knex('properties')
        .where('status', 0)
        .where('updated_at', '>=', knex.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'))
        .select(
          knex.raw('DATE(updated_at) as date'),
          knex.raw('COUNT(*) as count')
        )
        .groupByRaw('DATE(updated_at)')
        .orderBy('date', 'asc');

      const detailedStats: DetailedArchiveStats = {
        ...baseStats,
        recent_archived: recentArchived.map((p: any) => ({
          id: Number(p.id),
          name: String(p.property_name || 'Unknown'),
          price: p.price ? Number(p.price) : null,
          archived_at: String(p.updated_at || new Date().toISOString()),
        })),
        activity_last_30_days: activity.map((a: any) => ({
          date: String(a.date),
          count: Number(a.count || 0),
        })),
      };

      responseData = detailedStats;
    }

    const response = {
      success: true,
      data: responseData,
      cached: false,
      meta: {
        type: 'archive_statistics',
        detailed: detailed,
        timestamp: new Date().toISOString(),
      },
    };

    setCached(cacheKey, response);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Archive Stats Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch archive statistics', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 60;