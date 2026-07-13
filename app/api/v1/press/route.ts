// app/api/v1/press/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit    = Math.min(100, parseInt(searchParams.get('limit')  || '12'));
    const offset   =               parseInt(searchParams.get('offset') || '0');
    const featured = searchParams.get('featured');

    // ── Base SQL ──────────────────────────────────────────────
    let sql = `
      SELECT
        id,
        title,
        slug,
        descriptions   AS excerpt,
        imageurl       AS featured_image,
        category,
        publish_date,
        writer         AS author,
        status
      FROM blogs
      WHERE status = 1 AND category = 'market-news'
    `;
    let countSql = `
      SELECT COUNT(*) AS total
      FROM blogs
      WHERE status = 1 AND category = 'market-news'
    `;

    if (featured === 'true') {
      sql      += ' AND is_featured = 1';
      countSql += ' AND is_featured = 1';
    }

    sql += ' ORDER BY publish_date DESC, id DESC LIMIT ? OFFSET ?';

    // ── Execute both queries in parallel ──────────────────────
    const [rows, countResult] = await Promise.all([
      query<any[]>(sql, [limit, offset]),
      query<any[]>(countSql),
    ]);

    const data = rows.map((item) => ({
      id             : item.id,
      title          : item.title,
      slug           : item.slug,
      excerpt        : item.excerpt,
      category       : item.category,
      publish_date   : item.publish_date,
      author         : item.author,
      featured_image : item.featured_image,
      image_url      : item.featured_image
        ? item.featured_image.startsWith('http')
          ? item.featured_image
          : `/upload/blogs/${item.featured_image}`
        : null,
    }));

    return NextResponse.json({
      success    : true,
      data,
      pagination : {
        total  : countResult[0]?.total || 0,
        limit,
        offset,
      },
    });

  } catch (error: any) {
    console.error('Error fetching press releases:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}