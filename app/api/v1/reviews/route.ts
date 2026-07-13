import { NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET() {
  try {
    const rows = await query<any[]>(
      `SELECT id, name, designation, testimonial, t_user_image
       FROM testimonials
       ORDER BY id DESC`
    );

    return NextResponse.json({
      success : true,
      data    : rows,
    });

  } catch (error: any) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}