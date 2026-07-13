// lib/zoho/lead.ts - Zoho Lead Operations

import { getZohoAccessToken } from './auth';

const ZOHO_API_BASE = process.env.ZOHO_API_BASE || 'https://www.zohoapis.in/crm/v3';

export interface ZohoLeadData {
  First_Name?: string;
  Last_Name?: string;
  Email?: string;
  Phone?: string;
  Mobile?: string;
  Company?: string;
  Description?: string;
  Lead_Source?: string;
  Lead_Status?: string;
  Property_ID?: string;
  Property_Name?: string;
  Enquiry_Type?: string;
  Preferred_Location?: string;
  Budget?: string;
}

export async function createZohoLead(leadData: ZohoLeadData): Promise<any> {
  try {
    const accessToken = await getZohoAccessToken();

    const payload = {
      data: [
        {
          First_Name: leadData.First_Name || '',
          Last_Name: leadData.Last_Name || '',
          Email: leadData.Email || '',
          Phone: leadData.Phone || '',
          Mobile: leadData.Mobile || '',
          Company: leadData.Company || '',
          Description: leadData.Description || '',
          Lead_Source: leadData.Lead_Source || 'Website',
          Lead_Status: leadData.Lead_Status || 'New',
          Property_ID: leadData.Property_ID || '',
          Property_Name: leadData.Property_Name || '',
          Enquiry_Type: leadData.Enquiry_Type || 'General',
          Preferred_Location: leadData.Preferred_Location || '',
          Budget: leadData.Budget || '',
        },
      ],
    };

    const response = await fetch(`${ZOHO_API_BASE}/Leads`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.data?.[0]?.code === 'SUCCESS') {
      return {
        success: true,
        id: data.data[0].details.id,
        message: 'Lead created successfully',
        data: data.data[0],
      };
    }

    return {
      success: false,
      error: data.data?.[0]?.message || 'Failed to create lead',
    };
  } catch (error: any) {
    console.error('Zoho Lead Create Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}