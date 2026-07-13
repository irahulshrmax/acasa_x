// lib/zoho/contact.ts - ADD USER SYNC FUNCTIONS
import { getZohoAccessToken, isZohoConfigured } from './auth';

const ZOHO_API_BASE = process.env.ZOHO_API_BASE || 'https://www.zohoapis.in/crm/v3';

export interface ZohoContactPayload {
  First_Name: string;
  Last_Name?: string;
  Email: string;
  Phone?: string;
  Mobile?: string;
  Company?: string;
  Description?: string;
  Lead_Source?: string;
  Lead_Status?: string;
  // Custom fields
  Property_Type?: string;
  Enquiry_Type?: string;
  Preferred_Location?: string;
  Nationality?: string;
  Designation?: string;
  Website?: string;
  WhatsApp?: string;
  Facebook?: string;
  Instagram?: string;
  LinkedIn?: string;
  Landline?: string;
  Mortgage?: string;
  BRN_Number?: string;
  Priority?: string;
  Source?: string;
}

// ─── Create Zoho Contact ──────────────────────────────────────────────────────

export async function createZohoContact(data: ZohoContactPayload) {
  console.log('📤 Creating Zoho contact...');
  console.log('📧 Email:', data.Email);
  
  if (!isZohoConfigured()) {
    console.warn('⚠️ Zoho not configured - skipping sync');
    return {
      success: false,
      message: 'Zoho CRM not configured',
    };
  }

  try {
    const accessToken = await getZohoAccessToken();
    console.log('✅ Access token obtained');

    // Clean data - only include fields with values
    const cleanData: any = {
      First_Name: data.First_Name || '',
      Last_Name: data.Last_Name || '',
      Email: data.Email || '',
      Phone: data.Phone || '',
      Mobile: data.Mobile || data.Phone || '',
      Company: data.Company || '',
      Description: data.Description || 'User registered on ACASA Website',
      Lead_Source: data.Source || 'Website Registration',
      Lead_Status: 'New',
    };

    // Add optional fields only if they have values
    const optionalFields = {
      Enquiry_Type: data.Enquiry_Type,
      Preferred_Location: data.Preferred_Location,
      Property_Type: data.Property_Type,
      Nationality: data.Nationality,
      Designation: data.Designation,
      Website: data.Website,
      WhatsApp: data.WhatsApp,
      Facebook: data.Facebook,
      Instagram: data.Instagram,
      LinkedIn: data.LinkedIn,
      Landline: data.Landline,
      Mortgage: data.Mortgage,
      BRN_Number: data.BRN_Number,
      Priority: data.Priority,
    };

    for (const [key, value] of Object.entries(optionalFields)) {
      if (value && value !== '') {
        cleanData[key] = value;
      }
    }

    console.log('📦 Zoho Payload:', JSON.stringify(cleanData, null, 2));

    const payload = { data: [cleanData] };
    const url = `${ZOHO_API_BASE}/Contacts`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('📡 Zoho Response:', JSON.stringify(result, null, 2));

    if (result.data?.[0]?.code === 'SUCCESS') {
      return {
        success: true,
        id: result.data[0].details.id,
        message: 'Contact created in Zoho CRM',
        data: result.data[0],
      };
    }

    const errorMessage = result.data?.[0]?.message || 
                        result.message || 
                        'Failed to create Zoho contact';
    
    console.error('❌ Zoho Error:', errorMessage);
    return {
      success: false,
      message: 'Failed to sync with Zoho CRM',
      error: errorMessage,
    };

  } catch (error: any) {
    console.error('❌ Zoho Exception:', error);
    return {
      success: false,
      message: 'Failed to sync with Zoho CRM',
      error: error.message,
    };
  }
}

export async function searchZohoContactByEmail(email: string) {
  console.log('🔍 Searching Zoho contact:', email);
  
  if (!isZohoConfigured()) {
    return { success: false, message: 'Zoho not configured', data: [] };
  }

  try {
    const accessToken = await getZohoAccessToken();
    const url = `${ZOHO_API_BASE}/Contacts/search?email=${encodeURIComponent(email)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('📡 Search result:', result.data?.length || 0, 'found');

    return {
      success: true,
      data: result.data || [],
    };
  } catch (error: any) {
    console.error('❌ Search Error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export const createContact = createZohoContact; 