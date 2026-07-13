// app/api/properties/buy/search/route.ts - With Knex support
import { NextRequest, NextResponse } from 'next/server';
import { db, query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    console.log("🔍 Search API called with name:", name);
    
    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Name parameter required' },
        { status: 400 }
      );
    }
    
    // Option 1: Using raw query function
    const result = await query<any[]>(
      `SELECT * FROM properties 
       WHERE property_name LIKE ? 
       AND listing_type = 'Off plan'
       AND status = 5
       LIMIT 1`,
      [`%${name}%`]
    );
    
   
   
    return NextResponse.json({
      success: true,
      data: result[0] || null,
      meta: {
        searchTerm: name,
        found: result.length > 0
      }
    });
    
  } catch (error: any) {
    console.error("❌ Search API Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';