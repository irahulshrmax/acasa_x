// app/api/projects/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createProjectContact } from '@/lib/models/projects';
import { db } from '@/lib/database';
import { createZohoDeal } from '@/lib/zoho/deal';
import { searchZohoContactByEmail, createZohoContact } from '@/lib/zoho/contact';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('📥 Project contact request:', body);

    // ─── Validation ──────────────────────────────────────────────
    if (!body.name || !body.email || !body.phone) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and phone are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    const knex = await db();

    // ─── Check if project exists ──────────────────────────────
    let projectName = null;
    if (body.project_id) {
      const [project] = await knex('project_listing')
        .where('id', body.project_id)
        .select('id', 'ProjectName as name');
      if (project) {
        projectName = project.name;
        console.log(`✅ Project found: ${project.id} - ${projectName}`);
      }
    }

    // ─── 1. SAVE TO DATABASE ──────────────────────────────────
    const result = await createProjectContact({
      name: body.name,
      email: body.email,
      phone: body.phone,
      message: body.message || null,
      project_id: body.project_id || null,
      user_id: body.user_id || null,
    });

    console.log('✅ Project contact saved to DB, ID:', result.id);

    // ─── 2. SYNC TO ZOHO CRM ──────────────────────────────────
    let zohoContactResult = null;
    let zohoDealResult = null;

    try {
      // ─── Check if contact exists ──────────────────────────────
      const existingContact = await searchZohoContactByEmail(body.email);

      if (existingContact.success && existingContact.data && existingContact.data.length > 0) {
        zohoContactResult = {
          success: true,
          id: existingContact.data[0].id,
          existing: true,
          message: 'Contact already exists in Zoho',
        };
        console.log('✅ Contact exists in Zoho:', existingContact.data[0].id);
      } else {
        // ─── Create new contact ──────────────────────────────────
        const firstName = body.name.split(' ')[0] || body.name;
        const lastName = body.name.split(' ').slice(1).join(' ') || '';

        zohoContactResult = await createZohoContact({
          First_Name: firstName,
          Last_Name: lastName,
          Email: body.email,
          Phone: body.phone,
          Mobile: body.phone,
          Company: 'ACASA Website',
          Description: `Project contact from ACASA website\nProject: ${projectName || body.project_id || 'N/A'}\nMessage: ${body.message || 'N/A'}`,
          Source: 'Website - Project Contact',
          Lead_Status: 'New',
          Website: 'https://acasa.ae',
        });
        console.log('📡 Zoho contact result:', zohoContactResult);
      }

      // ─── Create Deal ───────────────────────────────────────────
      if (body.project_id) {
        const dealName = `${body.name} - ${projectName || 'Project Contact'}`;

        zohoDealResult = await createZohoDeal({
          Deal_Name: dealName,
          Stage: 'Qualification',
          Amount: 0,
          Description: body.message || `Project contact from ACASA website\nProject: ${projectName || body.project_id || 'N/A'}`,
          Property_ID: body.project_id ? String(body.project_id) : '',
          Property_Name: projectName || '',
          Enquiry_Type: 'Project Contact',
          Contact_Person: body.name,
          Contact_Email: body.email,
          Contact_Phone: body.phone,
          Lead_Source: 'Website - Project Contact',
        });
        console.log('📡 Zoho deal result:', zohoDealResult);
      }

    } catch (zohoError: any) {
      console.error('❌ Zoho sync error:', zohoError.message);
    }

    // ─── 3. RESPONSE ──────────────────────────────────────────
    return NextResponse.json({
      success: true,
      message: 'Contact submitted successfully',
      data: {
        contact: result,
        project: {
          id: body.project_id,
          name: projectName,
        },
        zoho: {
          contact: zohoContactResult,
          deal: zohoDealResult,
        },
      },
    });

  } catch (error: any) {
    console.error('❌ Project contact error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit contact' },
      { status: 500 }
    );
  }
}