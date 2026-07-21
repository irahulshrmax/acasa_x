// app/api/v1/admin/blog-categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyToken, TokenPayload } from '@/lib/auth/jwt';

interface AuthResult {
  success: boolean;
  message?: string;
  status?: number;
  payload?: TokenPayload;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── AUTH HELPER ────────────────────────────────────────────────────────

async function checkAdminAuth(request: NextRequest): Promise<AuthResult> {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) {
    return { success: false, message: 'Unauthorized', status: 401 };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { success: false, message: 'Invalid token', status: 401 };
  }

  const userType = payload.usertype?.toLowerCase() || '';
  if (userType !== 'admin' && userType !== 'super_admin') {
    return { success: false, message: 'Admin access required', status: 403 };
  }

  return { success: true, payload };
}

// ─── GET ─────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await checkAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status || 401 }
      );
    }

    const rows = await query<any[]>(
      `SELECT 
        category as name,
        COUNT(*) as total_blogs,
        MIN(created_at) as first_used,
        MAX(created_at) as last_used
       FROM blogs 
       WHERE category IS NOT NULL AND category != ''
       GROUP BY category 
       ORDER BY total_blogs DESC`
    );

    const categories = rows.map((row) => ({
      name: row.name,
      slug: generateSlug(row.name),
      total_blogs: row.total_blogs,
      first_used: row.first_used,
      last_used: row.last_used,
    }));

    const distinct = await query<any[]>(
      `SELECT DISTINCT category as name FROM blogs 
       WHERE category IS NOT NULL AND category != '' 
       ORDER BY category ASC`
    );

    return NextResponse.json({
      success: true,
      data: {
        categories: categories,
        list: distinct.map((row) => row.name),
        total: categories.length,
      },
    });

  } catch (error: any) {
    console.error('[Admin Categories GET] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status || 401 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Category name is required (min 2 characters)' },
        { status: 400 }
      );
    }

    const categoryName = name.trim().toLowerCase();

    const existing = await query<any[]>(
      `SELECT COUNT(*) as count FROM blogs WHERE LOWER(category) = ?`,
      [categoryName]
    );

    if (existing[0].count > 0) {
      return NextResponse.json(
        { success: false, message: 'Category already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      data: {
        name: categoryName,
        slug: generateSlug(categoryName),
      },
    });

  } catch (error: any) {
    console.error('[Admin Categories POST] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}

// ─── PUT ─────────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const auth = await checkAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status || 401 }
      );
    }

    const body = await request.json();
    const { old_name, new_name } = body;

    if (!old_name || old_name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Old category name is required' },
        { status: 400 }
      );
    }

    if (!new_name || new_name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'New category name is required (min 2 characters)' },
        { status: 400 }
      );
    }

    const oldCategory = old_name.trim();
    const newCategory = new_name.trim().toLowerCase();

    const existing = await query<any[]>(
      `SELECT COUNT(*) as count FROM blogs WHERE category = ?`,
      [oldCategory]
    );

    if (existing[0].count === 0) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }

    if (oldCategory.toLowerCase() !== newCategory) {
      const duplicate = await query<any[]>(
        `SELECT COUNT(*) as count FROM blogs WHERE LOWER(category) = ?`,
        [newCategory]
      );

      if (duplicate[0].count > 0) {
        return NextResponse.json(
          { success: false, message: 'New category name already exists' },
          { status: 409 }
        );
      }
    }

    await query(
      `UPDATE blogs SET category = ? WHERE category = ?`,
      [newCategory, oldCategory]
    );

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        old_name: oldCategory,
        new_name: newCategory,
        updated_count: existing[0].count,
      },
    });

  } catch (error: any) {
    console.error('[Admin Categories PUT] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const auth = await checkAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status || 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
        { status: 400 }
      );
    }

    const existing = await query<any[]>(
      `SELECT COUNT(*) as count FROM blogs WHERE category = ?`,
      [category]
    );

    if (existing[0].count === 0) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }

    await query(
      `UPDATE blogs SET category = 'Uncategorized' WHERE category = ?`,
      [category]
    );

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
      data: {
        category: category,
        updated_count: existing[0].count,
        moved_to: 'Uncategorized',
      },
    });

  } catch (error: any) {
    console.error('[Admin Categories DELETE] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}