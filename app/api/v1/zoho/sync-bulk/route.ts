// app/api/zoho/sync-bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { syncPendingEnquiries } from '@/lib/zoho/sync';
import { db, query } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const limit = body.limit || 50;

    const results = await syncPendingEnquiries(limit);

    const synced = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} enquiries to Zoho CRM (${failed} failed)`,
      data: {
        total: results.length,
        synced,
        failed,
        results,
      },
    });

  } catch (error: any) {
    console.error('Bulk sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET: Check pending count
export async function GET() {
  try {
    // Option 1: Using db() to get Knex instance (Recommended)
    const knex = await db();
    const [result]: any = await knex('enquire')
      .where('zoho_synced', 0)
      .orWhereNull('zoho_synced')
      .count('* as pending')
      .first();

    return NextResponse.json({
      success: true,
      pending: Number(result?.pending || 0),
    });
  } catch (error: any) {
    console.error('Error checking pending count:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}