// app/api/zoho/route.ts
import { NextRequest, NextResponse } from 'next/server';

// ========================================
// CONFIGURATION
// ========================================

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID!;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET!;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN!;
const ZOHO_ACCOUNTS_URL = process.env.ZOHO_ACCOUNTS_URL!;
const ZOHO_API_BASE = process.env.ZOHO_API_BASE!;

// ========================================
// TOKEN CACHE (Memory)
// ========================================

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  try {
    const res = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: ZOHO_REFRESH_TOKEN,
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    const data = await res.json();

    if (!data.access_token) {
      console.error('Token refresh failed:', data);
      throw new Error(`Token refresh failed: ${data.error || 'Unknown error'}`);
    }

    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    };

    return data.access_token;
  } catch (error: any) {
    console.error('getAccessToken error:', error);
    throw new Error(`Failed to get access token: ${error.message}`);
  }
}

// ========================================
// GET: Fetch Leads or Modules
// ========================================

export async function GET(request: NextRequest) {
  try {
    const token = await getAccessToken();
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'leads';
    const id = searchParams.get('id');

    // ---------- GET MODULES ----------
    if (action === 'modules') {
      const response = await fetch(`${ZOHO_API_BASE}/settings/modules`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Zoho Modules API Error:', data);
        throw new Error(`Zoho API Error: ${data.message || JSON.stringify(data)}`);
      }

      return NextResponse.json({
        success: true,
        modules: data.modules || [],
        message: 'Modules fetched successfully'
      });
    }

    // ---------- GET SINGLE LEAD ----------
    if (id) {
      const fields = [
        'id', 'Last_Name', 'First_Name', 'Email', 'Phone',
        'Description', 'Lead_Source', 'Lead_Status', 'Company',
        'Created_Time', 'Modified_Time', 'Owner'
      ].join(',');

      const response = await fetch(
        `${ZOHO_API_BASE}/Leads/${id}?fields=${fields}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Zoho API Error: ${data.message || JSON.stringify(data)}`);
      }

      return NextResponse.json({
        success: true,
        data: data.data || [],
        message: 'Lead fetched successfully'
      });
    }

    // ---------- GET ALL LEADS ----------
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');
    const fields = [
      'id', 'Last_Name', 'First_Name', 'Email', 'Phone',
      'Description', 'Lead_Source', 'Lead_Status', 'Company',
      'Created_Time', 'Modified_Time'
    ].join(',');

    const response = await fetch(
      `${ZOHO_API_BASE}/Leads?fields=${fields}&page=${page}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Zoho Leads API Error:', data);
      throw new Error(`Zoho API Error: ${data.message || JSON.stringify(data)}`);
    }

    return NextResponse.json({
      success: true,
      data: data.data || [],
      info: data.info || {},
      message: 'Leads fetched successfully'
    });

  } catch (error: any) {
    console.error('Zoho GET Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        details: error.details || null
      },
      { status: 500 }
    );
  }
}

// ========================================
// POST: Create Lead in Zoho CRM
// ========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name && !body.lastName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name or LastName is required'
        },
        { status: 400 }
      );
    }

    const token = await getAccessToken();

    // Build lead data with proper field mapping
    const leadData: any = {
      data: [{
        Last_Name: body.lastName || body.name || 'Unknown',
        Email: body.email || '',
        Phone: body.phone || '',
        Description: body.message || body.description || 'No message provided',
        Lead_Source: body.leadSource || 'Website Inquiry',
        Lead_Status: body.leadStatus || 'New',
        Company: body.company || body.businessName || '',
      }]
    };

    // Add First Name if provided separately
    if (body.firstName || body.name) {
      leadData.data[0].First_Name = body.firstName || body.name || '';
    }

    // Add custom fields if provided
    if (body.propertyType) {
      leadData.data[0].Property_Type__s = body.propertyType;
    }
    if (body.inquiryType) {
      leadData.data[0].Inquiry_Type__s = body.inquiryType;
    }
    if (body.budget) {
      leadData.data[0].Budget__c = body.budget;
    }

    console.log('Creating lead with data:', JSON.stringify(leadData, null, 2));

    const response = await fetch(`${ZOHO_API_BASE}/Leads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Zoho Create Lead Error:', data);
      throw new Error(`Zoho API Error: ${data.message || JSON.stringify(data)}`);
    }

    return NextResponse.json({
      success: true,
      data: data.data || [],
      message: 'Lead created successfully!',
      leadId: data.data?.[0]?.details?.id || null
    });

  } catch (error: any) {
    console.error('Zoho POST Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create lead',
        details: error.details || null
      },
      { status: 500 }
    );
  }
}

// ========================================
// PUT: Update Lead in Zoho CRM
// ========================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lead ID is required for update'
        },
        { status: 400 }
      );
    }

    const token = await getAccessToken();

    // Build update payload
    const leadData: any = {
      data: [{}]
    };

    if (updateData.lastName) leadData.data[0].Last_Name = updateData.lastName;
    if (updateData.firstName) leadData.data[0].First_Name = updateData.firstName;
    if (updateData.email) leadData.data[0].Email = updateData.email;
    if (updateData.phone) leadData.data[0].Phone = updateData.phone;
    if (updateData.message) leadData.data[0].Description = updateData.message;
    if (updateData.leadStatus) leadData.data[0].Lead_Status = updateData.leadStatus;
    if (updateData.leadSource) leadData.data[0].Lead_Source = updateData.leadSource;
    if (updateData.company) leadData.data[0].Company = updateData.company;

    const response = await fetch(`${ZOHO_API_BASE}/Leads/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Zoho Update Lead Error:', data);
      throw new Error(`Zoho API Error: ${data.message || JSON.stringify(data)}`);
    }

    return NextResponse.json({
      success: true,
      data: data.data || [],
      message: 'Lead updated successfully!'
    });

  } catch (error: any) {
    console.error('Zoho PUT Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update lead'
      },
      { status: 500 }
    );
  }
}

// ========================================
// DELETE: Delete Lead from Zoho CRM
// ========================================

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lead ID is required for deletion'
        },
        { status: 400 }
      );
    }

    const token = await getAccessToken();

    const response = await fetch(`${ZOHO_API_BASE}/Leads/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Zoho Delete Lead Error:', data);
      throw new Error(`Zoho API Error: ${data.message || JSON.stringify(data)}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully!'
    });

  } catch (error: any) {
    console.error('Zoho DELETE Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete lead'
      },
      { status: 500 }
    );
  }
}