// app/api/projects/enquire/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createProjectEnquiry } from '@/lib/models/projects';
import { db } from '@/lib/database';
import { createZohoDeal } from '@/lib/zoho/deal';
import { searchZohoContactByEmail, createZohoContact } from '@/lib/zoho/contact';
import { syncUserToZoho } from '@/lib/models/zoho';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('📥 Project enquiry request:', body);

    // ─── Validation ──────────────────────────────────────────────
    if (!body.project_id) {
      return NextResponse.json(
        { success: false, message: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!body.name) {
      return NextResponse.json(
        { success: false, message: 'Name is required' },
        { status: 400 }
      );
    }

    if (!body.email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    if (!body.phone) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    const knex = await db();

    // ─── Check if project exists ──────────────────────────────
    let projectExists = false;
    let projectName = null;
    let projectData = null;

    if (body.project_id) {
      const [project] = await knex('project_listing')
        .where('id', body.project_id)
        .select('id', 'ProjectName as name', 'status', 'ProjectPrice as price');

      if (project) {
        projectExists = true;
        projectName = project.name;
        projectData = project;
        console.log(`✅ Project found: ${project.id} - ${projectName}`);
      } else {
        console.warn(`⚠️ Project ${body.project_id} not found in database`);
      }
    }

    // ─── Check if user exists ──────────────────────────────────
    let userId = body.user_id || null;
    const [existingUser] = await knex('users')
      .where('email', body.email.toLowerCase())
      .select('id', 'full_name', 'email', 'phone', 'usertype');

    if (existingUser) {
      userId = existingUser.id;
      console.log('✅ Existing user found:', userId);
    }

    // ─── 1. SAVE TO DATABASE ──────────────────────────────────
    const result = await createProjectEnquiry({
      project_id: body.project_id,
      name: body.name,
      email: body.email,
      phone: body.phone,
      message: body.message || null,
      user_id: userId,
    });

    console.log('✅ Project enquiry saved to DB, ID:', result.id);

    // ─── 2. SYNC TO ZOHO CRM ──────────────────────────────────
    let zohoContactResult = null;
    let zohoDealResult = null;

    try {
      // ─── Check if contact exists in Zoho ────────────────────
      const existingContact = await searchZohoContactByEmail(body.email);

      if (existingContact.success && existingContact.data && existingContact.data.length > 0) {
        zohoContactResult = {
          success: true,
          id: existingContact.data[0].id,
          message: 'Contact already exists in Zoho',
          existing: true,
        };
        console.log('✅ Contact exists in Zoho:', existingContact.data[0].id);
      } else {
        // ─── Create new contact in Zoho ──────────────────────
        const firstName = body.name.split(' ')[0] || body.name;
        const lastName = body.name.split(' ').slice(1).join(' ') || '';

        zohoContactResult = await createZohoContact({
          First_Name: firstName,
          Last_Name: lastName,
          Email: body.email,
          Phone: body.phone,
          Mobile: body.phone,
          Company: 'ACASA Website',
          Description: `Project enquiry from ACASA website\nProject: ${projectName || body.project_id || 'N/A'}\nMessage: ${body.message || 'N/A'}`,
          Source: 'Website - Project Enquiry',
          Lead_Status: 'New',
          Website: 'https://acasa.ae',
        });
        console.log('📡 Zoho contact result:', zohoContactResult);
      }

      // ─── Create Deal in Zoho ────────────────────────────────
      if (projectExists || body.project_id) {
        const dealName = `${body.name} - ${projectName || 'Project Enquiry'}`;

        zohoDealResult = await createZohoDeal({
          Deal_Name: dealName,
          Stage: 'Qualification',
          Amount: projectData?.price || 0,
          Description: body.message || `Project enquiry from ACASA website\nProject ID: ${body.project_id}\nProject Name: ${projectName || 'N/A'}`,
          Property_ID: body.project_id ? String(body.project_id) : '',
          Property_Name: projectName || '',
          Enquiry_Type: 'Project Enquiry',
          Contact_Person: body.name,
          Contact_Email: body.email,
          Contact_Phone: body.phone,
          Lead_Source: 'Website - Project Enquiry',
        });
        console.log('📡 Zoho deal result:', zohoDealResult);
      } else {
        console.log('ℹ️ No project ID provided, skipping deal creation');
      }

    } catch (zohoError: any) {
      console.error('❌ Zoho sync error:', zohoError.message);
      // Don't fail the request if Zoho fails
    }

    // ─── 3. RESPONSE ──────────────────────────────────────────
    return NextResponse.json({
      success: true,
      message: 'Enquiry submitted successfully',
      data: {
        enquiry: result,
        project: {
          id: body.project_id,
          name: projectName,
          exists: projectExists,
        },
        zoho: {
          contact: zohoContactResult,
          deal: zohoDealResult,
        },
      },
    });

  } catch (error: any) {
    console.error('❌ Project enquiry error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit enquiry' },
      { status: 500 }
    );
  }
}