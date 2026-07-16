import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const featured = searchParams.get('featured') === 'true';
    const stats = searchParams.get('stats') === 'true';
    const popular = searchParams.get('popular') === 'true';
    const search = searchParams.get('search');
    const stateId = searchParams.get('state_id');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;

    // Get statistics
    if (stats) {
      const [total] = await query(
        'SELECT COUNT(*) as total FROM city_suggestion WHERE status = 1'
      );
      const [states] = await query(
        'SELECT COUNT(DISTINCT state_id) as states FROM city_suggestion WHERE status = 1'
      );
      const [popularCount] = await query(
        'SELECT COUNT(*) as popular FROM city_suggestion WHERE status = 1 AND is_popular = 1'
      );
      
      return NextResponse.json({
        success: true,
        data: {
          total: (total as any)?.total || 0,
          states: (states as any)?.states || 0,
          popular: (popularCount as any)?.popular || 0,
        },
      });
    }

    // Get popular locations
    if (popular) {
      const locations = await query(
        `SELECT id, name, slug, state_id, property_count, is_popular 
         FROM city_suggestion 
         WHERE status = 1 AND is_popular = 1 
         ORDER BY property_count DESC, sort_order ASC 
         LIMIT ?`,
        [limit]
      );
      
      return NextResponse.json({
        success: true,
        data: locations,
      });
    }

    // Get featured locations
    if (featured) {
      const locations = await query(
        `SELECT id, name, slug, state_id, property_count, is_popular 
         FROM city_suggestion 
         WHERE status = 1 
         ORDER BY property_count DESC, sort_order ASC 
         LIMIT ?`,
        [limit]
      );
      
      return NextResponse.json({
        success: true,
        data: locations,
      });
    }

    // Search locations
    if (search) {
      const searchTerm = `%${search}%`;
      const locations = await query(
        `SELECT id, name, slug, state_id, property_count, is_popular 
         FROM city_suggestion 
         WHERE status = 1 
         AND (name LIKE ? OR slug LIKE ?)
         ORDER BY 
           CASE 
             WHEN name LIKE ? THEN 1
             WHEN name LIKE ? THEN 2
             ELSE 3
           END,
           property_count DESC
         LIMIT 20`,
        [searchTerm, searchTerm, `${search}%`, `%${search}%`]
      );
      
      return NextResponse.json({
        success: true,
        data: locations,
        query: search,
      });
    }

    // Filter by state
    if (stateId) {
      const locations = await query(
        `SELECT id, name, slug, state_id, latitude, longitude, property_count, is_popular 
         FROM city_suggestion 
         WHERE status = 1 AND state_id = ?
         ORDER BY is_popular DESC, property_count DESC, sort_order ASC
         LIMIT ? OFFSET ?`,
        [stateId, limit, (page - 1) * limit]
      );

      const [total] = await query(
        'SELECT COUNT(*) as total FROM city_suggestion WHERE status = 1 AND state_id = ?',
        [stateId]
      );

      return NextResponse.json({
        success: true,
        data: locations,
        meta: {
          total: (total as any)?.total || 0,
          page,
          limit,
          totalPages: Math.ceil(((total as any)?.total || 0) / limit),
        },
      });
    }

    // Get all locations with pagination
    const locations = await query(
      `SELECT id, name, slug, state_id, latitude, longitude, property_count, is_popular 
       FROM city_suggestion 
       WHERE status = 1 
       ORDER BY is_popular DESC, property_count DESC, sort_order ASC
       LIMIT ? OFFSET ?`,
      [limit, (page - 1) * limit]
    );

    const [total] = await query(
      'SELECT COUNT(*) as total FROM city_suggestion WHERE status = 1'
    );

    return NextResponse.json({
      success: true,
      data: locations,
      meta: {
        total: (total as any)?.total || 0,
        page,
        limit,
        totalPages: Math.ceil(((total as any)?.total || 0) / limit),
      },
    });

  } catch (error: any) {
    console.error('Error fetching city suggestions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch city suggestions', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.name) {
      return NextResponse.json(
        { success: false, message: 'City name is required' },
        { status: 400 }
      );
    }

    if (!body.state_id) {
      return NextResponse.json(
        { success: false, message: 'State ID is required' },
        { status: 400 }
      );
    }

    if (!body.country_id) {
      return NextResponse.json(
        { success: false, message: 'Country ID is required' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = body.slug || body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug exists
    const existing = await query(
      'SELECT id FROM city_suggestion WHERE slug = ?',
      [slug]
    );

    if ((existing as any[])?.length > 0) {
      return NextResponse.json(
        { success: false, message: 'City with this slug already exists' },
        { status: 400 }
      );
    }

    // Insert city suggestion
    const result = await query(
      `INSERT INTO city_suggestion (
        city_id, country_id, state_id, name, slug, 
        latitude, longitude, property_count, is_popular, 
        sort_order, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.city_id || null,
        body.country_id,
        body.state_id,
        body.name,
        slug,
        body.latitude || null,
        body.longitude || null,
        body.property_count || 0,
        body.is_popular || 0,
        body.sort_order || 0,
        body.status || 1,
      ]
    );

    // Get the created record
    const [newCity] = await query(
      'SELECT * FROM city_suggestion WHERE id = ?',
      [(result as any)?.insertId]
    );

    return NextResponse.json({
      success: true,
      data: newCity,
      message: 'City suggestion created successfully',
    });

  } catch (error: any) {
    console.error('Error creating city suggestion:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create city suggestion', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'City ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if city exists
    const existing = await query(
      'SELECT id FROM city_suggestion WHERE id = ?',
      [id]
    );

    if (!(existing as any[])?.length) {
      return NextResponse.json(
        { success: false, message: 'City suggestion not found' },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name) {
      updates.push('name = ?');
      values.push(body.name);
      
      // Update slug if name changed
      if (!body.slug) {
        const newSlug = body.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        updates.push('slug = ?');
        values.push(newSlug);
      }
    }

    if (body.slug) {
      updates.push('slug = ?');
      values.push(body.slug);
    }

    if (body.latitude !== undefined) {
      updates.push('latitude = ?');
      values.push(body.latitude);
    }

    if (body.longitude !== undefined) {
      updates.push('longitude = ?');
      values.push(body.longitude);
    }

    if (body.property_count !== undefined) {
      updates.push('property_count = ?');
      values.push(body.property_count);
    }

    if (body.is_popular !== undefined) {
      updates.push('is_popular = ?');
      values.push(body.is_popular);
    }

    if (body.sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(body.sort_order);
    }

    if (body.status !== undefined) {
      updates.push('status = ?');
      values.push(body.status);
    }

    if (body.state_id) {
      updates.push('state_id = ?');
      values.push(body.state_id);
    }

    if (body.country_id) {
      updates.push('country_id = ?');
      values.push(body.country_id);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const result = await query(
      `UPDATE city_suggestion SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await query(
      'SELECT * FROM city_suggestion WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'City suggestion updated successfully',
    });

  } catch (error: any) {
    console.error('Error updating city suggestion:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update city suggestion', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'City ID is required' },
        { status: 400 }
      );
    }

    // Check if city exists
    const existing = await query(
      'SELECT id FROM city_suggestion WHERE id = ?',
      [id]
    );

    if (!(existing as any[])?.length) {
      return NextResponse.json(
        { success: false, message: 'City suggestion not found' },
        { status: 404 }
      );
    }

    // Soft delete
    await query(
      'UPDATE city_suggestion SET status = 0, updated_at = NOW() WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'City suggestion deleted successfully',
    });

  } catch (error: any) {
    console.error('Error deleting city suggestion:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete city suggestion', error: error.message },
      { status: 500 }
    );
  }
}