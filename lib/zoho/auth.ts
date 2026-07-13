// lib/zoho/auth.ts - SAFER VERSION
const ZOHO_CONFIG = {
  CLIENT_ID: process.env.ZOHO_CLIENT_ID!,
  CLIENT_SECRET: process.env.ZOHO_CLIENT_SECRET!,
  REFRESH_TOKEN: process.env.ZOHO_REFRESH_TOKEN!,
  API_DOMAIN: process.env.ZOHO_ACCOUNTS_URL || process.env.ZOHO_API_DOMAIN || 'https://accounts.zoho.in',
  API_BASE: process.env.ZOHO_API_BASE || 'https://www.zohoapis.in/crm/v3',
};

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getZohoAccessToken(): Promise<string> {
  console.log('🔑 Getting Zoho access token...');
  
  // ✅ FIX: Proper null check with explicit return
  if (cachedToken !== null && Date.now() < tokenExpiry) {
    console.log('✅ Using cached token');
    return cachedToken as string; // ✅ Type assertion
  }

  try {
    console.log('🔄 Refreshing Zoho token...');
    
    const response = await fetch(`${ZOHO_CONFIG.API_DOMAIN}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: ZOHO_CONFIG.REFRESH_TOKEN,
        client_id: ZOHO_CONFIG.CLIENT_ID,
        client_secret: ZOHO_CONFIG.CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zoho Auth Failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.access_token) {
      throw new Error('No access token received from Zoho');
    }

    // ✅ Cache the token
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;

    // ✅ Return with type assertion
    return cachedToken as string;

  } catch (error) {
    console.error('❌ Zoho Auth Error:', error);
    throw error;
  }
}

// Helper to check if credentials are configured
export function isZohoConfigured(): boolean {
  const configured = !!(
    process.env.ZOHO_CLIENT_ID &&
    process.env.ZOHO_CLIENT_SECRET &&
    process.env.ZOHO_REFRESH_TOKEN
  );
  console.log(`🔍 Zoho configured: ${configured}`);
  return configured;
}