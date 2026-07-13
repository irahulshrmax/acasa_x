// lib/zoho/deal.ts
import { getZohoAccessToken, isZohoConfigured } from './auth';

const ZOHO_API_BASE = process.env.ZOHO_API_BASE || 'https://www.zohoapis.in/crm/v3';

export interface ZohoDealPayload {
  Deal_Name: string;
  Stage: string;
  Amount?: number;
  Closing_Date?: string;
  Description?: string;
  Property_ID?: string;
  Property_Name?: string;
  Property_Type?: string;
  Enquiry_Type?: string;
  Preferred_Location?: string;
  Budget?: number;
  Contact_Person?: string;
  Contact_Email?: string;
  Contact_Phone?: string;
  Lead_Source?: string;
}

export async function createZohoDeal(data: ZohoDealPayload) {
  console.log('📤 Creating Zoho Deal...');

  if (!isZohoConfigured()) {
    return { success: false, message: 'Zoho not configured' };
  }

  try {
    const accessToken = await getZohoAccessToken();

    const payload = {
      data: [
        {
          Deal_Name: data.Deal_Name,
          Stage: data.Stage || 'Qualification',
          Amount: data.Amount || 0,
          Closing_Date: data.Closing_Date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          Description: data.Description || 'Property enquiry from ACASA website',
          Property_ID: data.Property_ID || '',
          Property_Name: data.Property_Name || '',
          Property_Type: data.Property_Type || '',
          Enquiry_Type: data.Enquiry_Type || '',
          Preferred_Location: data.Preferred_Location || '',
          Budget: data.Budget || 0,
          Contact_Person: data.Contact_Person || '',
          Contact_Email: data.Contact_Email || '',
          Contact_Phone: data.Contact_Phone || '',
          Lead_Source: data.Lead_Source || 'Website',
        },
      ],
    };

    const response = await fetch(`${ZOHO_API_BASE}/Deals`, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('📡 Zoho Deal Response:', JSON.stringify(result, null, 2));

    if (result.data?.[0]?.code === 'SUCCESS') {
      return {
        success: true,
        id: result.data[0].details.id,
        message: 'Deal created in Zoho CRM',
      };
    }

    return {
      success: false,
      message: 'Failed to create deal',
      error: result.data?.[0]?.message || result.message,
    };
  } catch (error: any) {
    console.error('❌ Zoho Deal Error:', error);
    return { success: false, message: 'Failed to create deal', error: error.message };
  }
}

export const DEAL_STAGES = {
  QUALIFICATION: 'Qualification',
  NEEDS_ANALYSIS: 'Needs Analysis',
  VALUE_PROPOSITION: 'Value Proposition',
  IDENTIFIED_DECISION_MAKERS: 'Identified Decision Makers',
  PERCEPTION_ANALYSIS: 'Perception Analysis',
  PROPOSAL_PRICE_QUOTE: 'Proposal/Price Quote',
  NEGOTIATION_REVIEW: 'Negotiation/Review',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
};