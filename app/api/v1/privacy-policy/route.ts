// app/api/v1/privacy-policy/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET() {
  try {
    const rows = await query<any[]>(
      `SELECT
         id,
         title,
         slug,
         descriptions,
         descriptions_other,
         seo_title,
         seo_keywork,
         seo_description,
         status
       FROM webcontrol
       WHERE slug = 'privacy-policy' AND status = 1
       LIMIT 1`
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Privacy policy not found' },
        { status: 404 }
      );
    }

    const data = rows[0];

    return NextResponse.json({
      success : true,
      data    : {
        id              : data.id,
        title           : data.title,
        slug            : data.slug,
        content         : data.descriptions_other || data.descriptions || '',
        seo_title       : data.seo_title,
        seo_keywork     : data.seo_keywork,
        seo_description : data.seo_description,
      },
    });

  } catch (error: any) {
    console.error('Error fetching privacy policy:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}