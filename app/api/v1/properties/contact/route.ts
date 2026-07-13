// app/api/properties/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createContact } from '@/lib/models/properties';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.phone || !body.message) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Name, email, phone, and message are required' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Simple rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    // You can implement rate limiting here if needed

    // Create contact
    const result = await createContact({
      name: body.name,
      email: body.email,
      phone: body.phone,
      message: body.message,
      property_id: body.property_id || undefined,
      property_slug: body.property_slug || undefined,
      source: body.source || 'website',
      user_id: body.user_id || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Contact submitted successfully!',
    });

  } catch (error: any) {
    console.error('Contact error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send message',
        error: error.message 
      },
      { status: 500 }
    );
  }
}