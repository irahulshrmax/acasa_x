// app/api/properties/enquire/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { createZohoDeal } from '@/lib/zoho/deal';
import { searchZohoContactByEmail, createZohoContact } from '@/lib/zoho/contact';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('📥 Enquiry request body:', body);

    // ─── Validate Required Fields ──────────────────────────────
    if (!body.name || !body.email || !body.phone) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Name, email, and phone are required' 
        },
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

    // ─── Check if property exists ──────────────────────────────
    let propertyExists = false;
    let propertyName = null;
    let propertyData = null;
    
    if (body.property_id) {
      const [property] = await knex('properties')
        .where('id', body.property_id)
        .select('id', 'property_name', 'status', 'price');
      
      if (property) {
        propertyExists = true;
        propertyName = property.property_name;
        propertyData = property;
        console.log(`✅ Property found: ${property.id} - ${propertyName}`);
      }
    }

    // ─── Check if user exists ──────────────────────────────────
    let userId = null;
    const [existingUser] = await knex('users')
      .where('email', body.email.toLowerCase())
      .select('id', 'full_name');
    
    if (existingUser) {
      userId = existingUser.id;
      console.log('✅ Existing user found:', userId);
    }

    // ─── 1. SAVE TO DATABASE ──────────────────────────────────
    const [enquiryId] = await knex('property_enquiries').insert({
      name: body.name,
      email: body.email.toLowerCase(),
      phone: body.phone,
      message: body.message || null,
      enquiry_type: body.enquiry_type || 'Property Enquiry',
      source: body.source || 'Website',
      property_id: propertyExists ? body.property_id : null,
      property_name: propertyName || body.property_name || null,
      property_slug: body.property_slug || null,
      user_id: userId,
      status: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log('✅ Enquiry saved to DB, ID:', enquiryId);

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
          Description: `Property enquiry from ACASA website\nProperty: ${propertyName || body.property_id || 'N/A'}\nMessage: ${body.message || 'N/A'}`,
          Source: body.source || 'Website',
          Lead_Status: 'New',
          Website: 'https://acasa.ae',
        });
        console.log('📡 Zoho contact result:', zohoContactResult);
      }

      // ─── Create Deal in Zoho ────────────────────────────────
      if (propertyExists || body.property_id) {
        const dealName = `${body.name} - ${propertyName || 'Property Enquiry'}`;
        
        zohoDealResult = await createZohoDeal({
          Deal_Name: dealName,
          Stage: 'Qualification',
          Amount: propertyData?.price?.amount || propertyData?.price?.sale_price || 0,
          Description: body.message || `Property enquiry from ACASA website\nProperty ID: ${body.property_id}\nProperty Name: ${propertyName || 'N/A'}`,
          Property_ID: body.property_id ? String(body.property_id) : '',
          Property_Name: propertyName || '',
          Enquiry_Type: body.enquiry_type || 'Property Enquiry',
          Contact_Person: body.name,
          Contact_Email: body.email,
          Contact_Phone: body.phone,
          Lead_Source: body.source || 'Website',
        });
        console.log('📡 Zoho deal result:', zohoDealResult);
      } else {
        console.log('ℹ️ No property ID provided, skipping deal creation');
      }

    } catch (zohoError: any) {
      console.error('❌ Zoho sync error:', zohoError.message);
      // Don't fail the request
    }

    // ─── 3. RESPONSE ──────────────────────────────────────────

    return NextResponse.json({
      success: true,
      message: 'Enquiry submitted successfully!',
      data: {
        enquiry_id: enquiryId,
        property_id: body.property_id || null,
        property_exists: propertyExists,
        property_name: propertyName,
        zoho: {
          contact: zohoContactResult,
          deal: zohoDealResult,
        },
      },
    });

  } catch (error: any) {
    console.error('❌ Enquiry error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to submit enquiry',
        error: error.message 
      },
      { status: 500 }
    );
  }
}