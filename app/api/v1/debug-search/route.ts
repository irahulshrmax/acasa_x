// app/api/v1/debug-search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q') || 'Palm Jumeirah';
  const type = searchParams.get('type') || 'buy';

  try {
    const knex = await db();

    // ─── 1. GET ALL COLUMNS ──────────────────────────────────────────────
    const columns = await knex.raw('SHOW COLUMNS FROM properties');
    const columnNames = columns[0].map((c: any) => c.Field);

    // ─── 2. SEARCH IN MULTIPLE COLUMNS ──────────────────────────────────
    let searchResults: any[] = [];
    
    try {
      const query = knex('properties')
        .select('id', 'property_name', 'listing_type', 'location', 'address', 'keyword', 'description', 'property_slug')
        .where('status', 1);
      
      if (q) {
        // ✅ FIX: Search in ALL possible text columns
        query.where(function (this: any) {
          const searchTerm = `%${q}%`;
          const availableColumns = columnNames;
          
          // Search in all text/varchar columns that might contain location data
          const searchColumns = [
            'property_name', 'location', 'address', 'keyword', 
            'description', 'property_slug', 'title_deep',
            'property_type', 'building', 'landmark', 'property_locations'
          ];
          
          for (const col of searchColumns) {
            if (availableColumns.includes(col)) {
              this.orWhere(col, 'LIKE', searchTerm);
            }
          }
        });
      }
      
      // Type filter
      if (type === 'buy') {
        query.where('listing_type', 'in', ['Sale', 'Off plan', 'Off-plan', 'Offplan']);
      } else if (type === 'rent') {
        query.where('listing_type', 'Rent');
      }
      
      searchResults = await query.limit(50);
      console.log(`📊 Found ${searchResults.length} properties`);
    } catch (err) {
      console.log('⚠️ Error searching:', err);
    }

    // ─── 3. CHECK WHAT'S ACTUALLY IN DATABASE ──────────────────────────
    let allProperties: any[] = [];
    try {
      allProperties = await knex('properties')
        .select('id', 'property_name', 'listing_type', 'location', 'address', 'keyword', 'description')
        .where('status', 1)
        .limit(20);
    } catch (err) {
      console.log('⚠️ Error getting all properties:', err);
    }

    // ─── 4. CHECK PROJECTS ──────────────────────────────────────────────
    let projectResults: any[] = [];
    try {
      projectResults = await knex('project_data')
        .select('id', 'name', 'status')
        .where('status', 1);
      
      if (q) {
        projectResults = projectResults.filter((p: any) => 
          p.name?.toLowerCase().includes(q.toLowerCase())
        );
      }
    } catch (err) {
      console.log('⚠️ Error with projects:', err);
    }

    return NextResponse.json({
      success: true,
      data: {
        search_term: q,
        search_type: type,
        columns_available: columnNames,
        all_properties_sample: allProperties.map((p: any) => ({
          id: p.id,
          name: p.property_name,
          type: p.listing_type,
          location: p.location,
          address: p.address,
          keyword: p.keyword,
          description: p.description?.substring(0, 100),
        })),
        search_results: searchResults.map((p: any) => ({
          id: p.id,
          name: p.property_name,
          type: p.listing_type,
          location: p.location,
          address: p.address,
          slug: p.property_slug,
        })),
        project_results: projectResults,
        summary: {
          total_properties_in_db: allProperties.length,
          total_search_results: searchResults.length,
          total_projects: projectResults.length,
        }
      },
    });

  } catch (error: any) {
    console.error('❌ Debug error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}