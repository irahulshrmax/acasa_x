// app/api/v1/faqs/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET() {
  try {
    const faqs = await query<any[]>(
      `SELECT id, question, answer, order_no, status
       FROM faqs
       WHERE status = 1
       ORDER BY order_no ASC`
    );

    if (faqs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'FAQs not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success : true,
      data    : {
        title : 'Frequently Asked Questions',
        faqs  : faqs.map((faq) => ({
          id       : faq.id,
          question : faq.question,
          answer   : faq.answer,
          order_no : faq.order_no,
        })),
      },
    });

  } catch (error: any) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}