// app/api/v1/press/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // ── Get press release by slug ─────────────────────────────
    const rows = await query<any[]>(
      `SELECT
         id,
         title,
         slug,
         descriptions  AS excerpt,
         descriptions  AS content,
         imageurl      AS featured_image,
         category,
         publish_date,
         writer        AS author,
         status,
         meta_title,
         meta_description
       FROM blogs
       WHERE slug = ? AND status = 1 AND category = 'market-news'
       LIMIT 1`,
      [slug]
    );

    const press = rows[0];

    if (!press) {
      return NextResponse.json(
        { success: false, message: 'Press release not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success : true,
      data    : {
        ...press,
        image_url: press.featured_image
          ? press.featured_image.startsWith('http')
            ? press.featured_image
            : `/upload/blogs/${press.featured_image}`
          : null,
      },
    });

  } catch (error: any) {
    console.error('Error fetching press release:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}