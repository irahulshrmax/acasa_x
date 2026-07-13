// lib/zoho/sync.ts
import { createZohoContact, searchZohoContactByEmail } from './contact';
import { isZohoConfigured } from './auth';
import { query } from '@/lib/database';

// ════════════════════════════════════════════════════════════════
//  TYPES
// ════════════════════════════════════════════════════════════════

export interface UserSyncData {
  first_name  : string;
  last_name?  : string;
  email       : string;
  phone?      : string;
  company?    : string;
  source?     : string;
  nationality?: string;
  designation?: string;
  website?    : string;
  whats_app?  : string;
}

export interface SyncResult {
  success    : boolean;
  message?   : string;
  id?        : string;
  synced?    : boolean;
  existing?  : boolean;
  error?     : string;
  enquiry_id?: number;
}

// ════════════════════════════════════════════════════════════════
//  SYNC USER TO ZOHO
// ════════════════════════════════════════════════════════════════

export async function syncUserToZoho(userData: UserSyncData): Promise<SyncResult> {
  console.log('🔄 Syncing user to Zoho:', userData.email);

  if (!isZohoConfigured()) {
    console.warn('⚠️ Zoho not configured - skipping user sync');
    return {
      success : false,
      message : 'Zoho CRM not configured',
      synced  : false,
    };
  }

  try {
    // ── Check if contact already exists ───────────────────────
    const existing = await searchZohoContactByEmail(userData.email);

    if (existing.success && existing.data && existing.data.length > 0) {
      console.log('✅ User already exists in Zoho CRM');
      return {
        success  : true,
        message  : 'User already exists in Zoho CRM',
        id       : existing.data[0]?.id,
        synced   : true,
        existing : true,
      };
    }

    // ── Create new contact ────────────────────────────────────
    const zohoPayload = {
      First_Name  : userData.first_name,
      Last_Name   : userData.last_name   || '',
      Email       : userData.email,
      Phone       : userData.phone       || '',
      Mobile      : userData.phone       || '',
      Company     : userData.company     || '',
      Description : 'User registered on ACASA Website',
      Source      : userData.source      || 'Website Registration',
      Nationality : userData.nationality || '',
      Designation : userData.designation || '',
      Website     : userData.website     || '',
      WhatsApp    : userData.whats_app   || '',
    };

    const result = await createZohoContact(zohoPayload);

    if (result.success) {
      console.log('✅ User synced to Zoho CRM, ID:', result.id);
    } else {
      console.error('❌ Failed to sync user to Zoho:', result.error);
    }

    return {
      ...result,
      synced: result.success,
    };

  } catch (error: any) {
    console.error('❌ User sync error:', error);
    return {
      success : false,
      message : 'Failed to sync user with Zoho CRM',
      error   : error.message,
      synced  : false,
    };
  }
}

// ════════════════════════════════════════════════════════════════
//  SYNC PENDING ENQUIRIES  ← NEW
// ════════════════════════════════════════════════════════════════

export async function syncPendingEnquiries(
  limit: number = 50
): Promise<SyncResult[]> {
  console.log(`🔄 Syncing pending enquiries (limit: ${limit})`);

  if (!isZohoConfigured()) {
    console.warn('⚠️ Zoho not configured');
    return [];
  }

  // ── Fetch pending enquiries from DB ───────────────────────
  const pending = await query<any[]>(
    `SELECT
       e.id,
       e.message,
       e.type,
       e.source,
       e.lead_source,
       e.property_id,
       e.created_at,
       u.full_name  AS name,
       u.email,
       u.phone
     FROM enquire e
     LEFT JOIN users u ON e.contact_id = u.id
     WHERE (e.zoho_synced = 0 OR e.zoho_synced IS NULL)
       AND e.email IS NOT NULL
     ORDER BY e.created_at ASC
     LIMIT ?`,
    [limit]
  );

  if (!pending.length) {
    console.log('✅ No pending enquiries to sync');
    return [];
  }

  console.log(`📋 Found ${pending.length} pending enquiries`);

  const results: SyncResult[] = [];

  for (const enquiry of pending) {
    try {
      // ── Search or create contact ─────────────────────────
      let zohoContactId: string | null = null;

      const existing = await searchZohoContactByEmail(enquiry.email);

      if (existing.success && existing.data?.length > 0) {
        zohoContactId = existing.data[0].id;
      } else {
        const nameParts = (enquiry.name || 'Unknown').split(' ');
        const contactResult = await createZohoContact({
          First_Name  : nameParts[0]               || 'Unknown',
          Last_Name   : nameParts.slice(1).join(' ')|| '',
          Email       : enquiry.email,
          Phone       : enquiry.phone               || '',
          Mobile      : enquiry.phone               || '',
          Company     : 'ACASA Website',
          Description : enquiry.message             || '',
          Source      : enquiry.lead_source         || 'Website',
          Lead_Status : 'New',
          Website     : 'https://acasa.ae',
        });

        if (contactResult.success) {
          zohoContactId = contactResult.id ?? null;
        }
      }

      if (zohoContactId) {
        // ── Mark as synced in DB ───────────────────────────
        await query(
          `UPDATE enquire
           SET zoho_synced  = 1,
               zoho_lead_id = ?,
               synced_at    = NOW()
           WHERE id = ?`,
          [zohoContactId, enquiry.id]
        );

        results.push({
          success    : true,
          id         : zohoContactId,
          synced     : true,
          enquiry_id : enquiry.id,
          message    : 'Synced successfully',
        });

        console.log(`✅ Enquiry #${enquiry.id} synced → ${zohoContactId}`);
      } else {
        // ── Mark as failed ─────────────────────────────────
        await query(
          `UPDATE enquire
           SET zoho_synced = 2
           WHERE id = ?`,
          [enquiry.id]
        );

        results.push({
          success    : false,
          synced     : false,
          enquiry_id : enquiry.id,
          message    : 'Failed to create/find Zoho contact',
        });

        console.error(`❌ Enquiry #${enquiry.id} sync failed`);
      }

    } catch (error: any) {
      console.error(`❌ Error syncing enquiry #${enquiry.id}:`, error.message);

      results.push({
        success    : false,
        synced     : false,
        enquiry_id : enquiry.id,
        error      : error.message,
        message    : 'Unexpected error during sync',
      });
    }
  }

  const synced = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`📊 Sync complete: ${synced} synced, ${failed} failed`);

  return results;
}