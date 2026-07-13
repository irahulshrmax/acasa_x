// app/api/v1/zoho/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createZohoContact, searchZohoContactByEmail } from '@/lib/zoho/contact';
import { isZohoConfigured } from '@/lib/zoho/auth';

// ✅ Import your actual DB model
import { createContact as createDBContact } from '@/lib/models/contact';

export async function POST(request: NextRequest) {
  console.log('🚀 Zoho Contact API called');
  
  try {
    const body = await request.json();
    console.log('📦 Request body:', JSON.stringify(body, null, 2));

    // ─── Validation ──────────────────────────────────
    if (!body.first_name || !body.email) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'First name and email are required',
          errors: {
            first_name: !body.first_name ? 'First name is required' : undefined,
            email: !body.email ? 'Email is required' : undefined,
          }
        },
        { status: 400 }
      );
    }

    // ─── 1. Save to Database ────────────────────────
    let dbResult;
    try {
      // ✅ Convert to DB format
      const dbPayload = {
        first_name: body.first_name,
        last_name: body.last_name || null,
        email: body.email.toLowerCase(),
        phone: body.phone || '',
        type: body.type || 'B2C',
        source: body.source || 'Website Contact',
        status: body.status || 1,
        lead_status: body.lead_status || 1,
        message: body.message || '',
        enquiryType: body.enquiryType || '',
        location: body.location || '',
        company: body.company || null,
        nationality: body.nationality || null,
        property_type: body.property_type || null,
        contact_type: body.contact_type || null,
        designation: body.designation || null,
        website: body.website || null,
        whats_app: body.whats_app || null,
        facebook: body.facebook || null,
        insta: body.insta || null,
        linkedin: body.linkedin || null,
        landline: body.landline || null,
        mortgage: body.mortgage || null,
        brn_number: body.brn_number || null,
        job_role: body.job_role || null,
        priority: body.priority || null,
        profile: body.profile || null,
        third_party_client_name: body.third_party_client_name || null,
        third_party_client_email: body.third_party_client_email || null,
        third_party_client_mobile: body.third_party_client_mobile || null,
      };
      
      console.log('💾 Saving to DB:', JSON.stringify(dbPayload, null, 2));
      dbResult = await createDBContact(dbPayload);
      console.log('✅ DB Result:', dbResult);
      
    } catch (dbError: any) {
      console.error('❌ DB Error:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to save contact in database',
          error: dbError.message 
        },
        { status: 500 }
      );
    }

    // ─── 2. Sync to Zoho CRM ────────────────────────
    let zohoResult = null;
    const zohoConfigured = isZohoConfigured();
    console.log(`🔍 Zoho configured: ${zohoConfigured}`);

    if (zohoConfigured) {
      try {
        // Check if contact already exists in Zoho
        console.log('🔍 Checking existing contact in Zoho...');
        const existing = await searchZohoContactByEmail(body.email);

        if (existing.success && existing.data && existing.data.length > 0) {
          console.log('✅ Contact already exists in Zoho');
          zohoResult = {
            success: true,
            message: 'Contact already exists in Zoho CRM',
            id: existing.data[0]?.id,
            data: existing.data[0],
          };
        } else {
          console.log('📤 Creating new contact in Zoho...');
          
          // ✅ Clean Zoho payload - only include fields with values
          const zohoPayload: any = {
            First_Name: body.first_name,
            Last_Name: body.last_name || '',
            Email: body.email,
            Phone: body.phone || '',
            Mobile: body.phone || '',
            Company: body.company || '',
            Description: body.message || 'Contact from ACASA Website',
            Lead_Source: body.source || 'Website',
            Lead_Status: 'New',
          };

          // ✅ Add optional fields only if they have values
          const optionalZohoFields = {
            Enquiry_Type: body.enquiryType,
            Preferred_Location: body.location,
            Property_Type: body.property_type,
            Nationality: body.nationality,
            Designation: body.designation,
            Website: body.website,
            WhatsApp: body.whats_app,
            Facebook: body.facebook,
            Instagram: body.insta,
            LinkedIn: body.linkedin,
            Landline: body.landline,
            Mortgage: body.mortgage,
            BRN_Number: body.brn_number,
            Priority: body.priority,
          };

          for (const [key, value] of Object.entries(optionalZohoFields)) {
            if (value && value !== '') {
              zohoPayload[key] = value;
            }
          }

          console.log('📦 Zoho Payload:', JSON.stringify(zohoPayload, null, 2));
          zohoResult = await createZohoContact(zohoPayload);
          console.log('📡 Zoho Result:', zohoResult);
        }
      } catch (zohoError: any) {
        console.error('❌ Zoho sync error:', zohoError);
        zohoResult = {
          success: false,
          error: zohoError.message,
          message: 'Contact saved in database but Zoho sync failed',
        };
      }
    } else {
      console.warn('⚠️ Zoho not configured - skipping sync');
      zohoResult = {
        success: false,
        message: 'Zoho CRM not configured - contact saved only in database',
      };
    }

    // ─── 3. Return Response ──────────────────────────
    const response = {
      success: true,
      message: 'Contact saved successfully',
      data: {
        db: dbResult,
        zoho: zohoResult,
      },
    };
    
    console.log('✅ Sending response:', JSON.stringify(response, null, 2));
    
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Contact API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to save contact',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}