// app/api/v1/contacts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  getContactById,
  getContactByCuid,
  getContactByEmail,
  getContactByPhone,
  updateContact,
  deleteContact,
  permanentDeleteContact,
  logActivity,
  updateLeadStatus,
} from '@/lib/models/contact';

// ==================== GET ====================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let contact;

    // Numeric ID ya CUID check karo
    if (!isNaN(parseInt(id))) {
      contact = await getContactById(parseInt(id));
    } else {
      contact = await getContactByCuid(id);
    }

    if (!contact) {
      return NextResponse.json(
        { success: false, message: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contact,
    });
  } catch (error: any) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch contact',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ==================== PUT ====================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id);
    const body = await request.json();

    // Contact exist karta hai ya nahi check karo
    const existing = await getContactById(idNum);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Contact not found' },
        { status: 404 }
      );
    }

    // Duplicate email check karo
    if (body.email && body.email !== existing.email) {
      const duplicate = await getContactByEmail(body.email);
      if (duplicate && duplicate.id !== idNum) {
        return NextResponse.json(
          {
            success: false,
            message: 'Email already in use by another contact',
          },
          { status: 409 }
        );
      }
    }

    // Duplicate phone check karo
    if (body.phone && body.phone !== existing.phone) {
      const duplicate = await getContactByPhone(body.phone);
      if (duplicate && duplicate.id !== idNum) {
        return NextResponse.json(
          {
            success: false,
            message: 'Phone already in use by another contact',
          },
          { status: 409 }
        );
      }
    }

    // Model cache khud handle karta hai
    const contact = await updateContact(idNum, body);

    return NextResponse.json({
      success: true,
      data: contact,
      message: 'Contact updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update contact',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ==================== DELETE ====================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id);
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    // Contact exist karta hai ya nahi check karo
    const existing = await getContactById(idNum);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Contact not found' },
        { status: 404 }
      );
    }

    // Model cache khud handle karta hai
    let result;
    if (permanent) {
      result = await permanentDeleteContact(idNum);
    } else {
      result = await deleteContact(idNum);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: permanent ? 'Contact permanently deleted' : 'Contact archived',
    });
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete contact',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ==================== PATCH ====================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id);
    const body = await request.json();

    // Contact exist karta hai ya nahi check karo
    const existing = await getContactById(idNum);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Contact not found' },
        { status: 404 }
      );
    }

    let result;

    // Lead status update karo
    if (body.lead_status !== undefined) {
      result = await updateLeadStatus(idNum, body.lead_status);
    }

    // Activity log karo
    if (body.activity) {
      result = await logActivity(idNum, body.activity, body.activity_date_time);
    }

    // Partial update karo
    if (body.fields) {
      result = await updateContact(idNum, body.fields);
    }

    // Kuch bhi update nahi hua
    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: 'No valid fields to update. Use lead_status, activity, or fields',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Contact updated successfully',
    });
  } catch (error: any) {
    console.error('Error patching contact:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update contact',
        error: error.message,
      },
      { status: 500 }
    );
  }
}