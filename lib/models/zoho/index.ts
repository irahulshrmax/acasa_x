// lib/models/zoho/index.ts - PRODUCTION GRADE

import { query } from '@/lib/database';
import { cache } from '@/lib/cache';
import { createZohoContact, searchZohoContactByEmail } from '@/lib/zoho/contact';
import { isZohoConfigured } from '@/lib/zoho/auth';

// ════════════════════════════════════════════════════════════════
//  TYPES
// ════════════════════════════════════════════════════════════════

export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface ZohoSyncRecord {
  id: number;
  user_id: number;
  zoho_id: string;
  zoho_module: string;
  email: string;
  phone: string | null;
  sync_status: SyncStatus;
  sync_attempts: number;
  last_sync_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ZohoSyncStats {
  total_syncs: number;
  total_synced: number;
  total_failed: number;
  total_pending: number;
}

export interface ZohoUserData {
  id: number;
  full_name: string;
  name: string;
  email: string;
  phone?: string | null;
  usertype: string;
  status: number;
  photo?: string | null;
  first_login?: number | null;
  provider?: string | null;
  provider_id?: string | null;
}

export interface ZohoSyncResult {
  success: boolean;
  zohoId?: string;
  message: string;
  error?: string;
  existing?: boolean;
  skipped?: boolean;
}

export interface SaveSyncRecordInput {
  user_id: number;
  zoho_id: string;
  zoho_module: string;
  email: string;
  phone?: string | null;
  sync_status: SyncStatus;
  sync_attempts: number;
  last_sync_at: Date;
  error_message?: string | null;
}

// ════════════════════════════════════════════════════════════════
//  CACHE KEYS
// ════════════════════════════════════════════════════════════════

const CACHE = {
  syncRecord : (userId: number)  => `zoho:sync:user:${userId}`,
  syncStats  : ()                => `zoho:stats:global`,
  zohoExists : (email: string)   => `zoho:exists:${email}`,
} as const;

const TTL = {
  syncRecord : 300,   // 5 min
  syncStats  : 120,   // 2 min
  zohoExists : 600,   // 10 min
} as const;

// ════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════

function buildErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

async function invalidateSyncCaches(userId: number): Promise<void> {
  await Promise.allSettled([
    cache.del(CACHE.syncRecord(userId)),
    cache.del(CACHE.syncStats()),
  ]);
}

// ════════════════════════════════════════════════════════════════
//  SAVE SYNC RECORD  (upsert)
// ════════════════════════════════════════════════════════════════

export async function saveZohoSyncRecord(
  data: SaveSyncRecordInput
): Promise<void> {
  const existing: ZohoSyncRecord[] = await query<ZohoSyncRecord[]>(
    `SELECT id
     FROM zoho_sync
     WHERE user_id = ? AND zoho_module = ?
     LIMIT 1`,
    [data.user_id, data.zoho_module]
  );

  if (existing.length > 0) {
    // ── UPDATE ────────────────────────────────────────────────
    await query(
      `UPDATE zoho_sync
       SET zoho_id        = ?,
           email          = ?,
           phone          = ?,
           sync_status    = ?,
           sync_attempts  = sync_attempts + 1,
           last_sync_at   = ?,
           error_message  = ?,
           updated_at     = NOW()
       WHERE user_id = ? AND zoho_module = ?`,
      [
        data.zoho_id,
        data.email,
        data.phone   ?? null,
        data.sync_status,
        data.last_sync_at,
        data.error_message ?? null,
        data.user_id,
        data.zoho_module,
      ]
    );
  } else {
    // ── INSERT ────────────────────────────────────────────────
    await query(
      `INSERT INTO zoho_sync
         (user_id, zoho_id, zoho_module, email, phone,
          sync_status, sync_attempts, last_sync_at,
          error_message, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.user_id,
        data.zoho_id,
        data.zoho_module,
        data.email,
        data.phone   ?? null,
        data.sync_status,
        data.sync_attempts,
        data.last_sync_at,
        data.error_message ?? null,
      ]
    );
  }

  await invalidateSyncCaches(data.user_id);
}

// ════════════════════════════════════════════════════════════════
//  GET SYNC RECORD
// ════════════════════════════════════════════════════════════════

export async function getZohoSyncRecord(
  userId: number
): Promise<ZohoSyncRecord | null> {
  const cacheKey = CACHE.syncRecord(userId);

  const cached = await cache.get<ZohoSyncRecord>(cacheKey);
  if (cached) return cached;

  const rows = await query<ZohoSyncRecord[]>(
    `SELECT *
     FROM zoho_sync
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (!rows.length) return null;

  const record = rows[0];
  await cache.set(cacheKey, record, {
    ttl  : TTL.syncRecord,
    tags : ['zoho', `user:${userId}`],
  });

  return record;
}

// ════════════════════════════════════════════════════════════════
//  GET SYNC STATS
// ════════════════════════════════════════════════════════════════

export async function getZohoSyncStats(): Promise<ZohoSyncStats> {
  const cacheKey = CACHE.syncStats();

  const cached = await cache.get<ZohoSyncStats>(cacheKey);
  if (cached) return cached;

  // Single query - multiple COUNT with CASE (faster than 4 queries)
  const rows = await query<Array<{
    total_syncs  : string;
    total_synced : string;
    total_failed : string;
    total_pending: string;
  }>>(
    `SELECT
       COUNT(*)                                          AS total_syncs,
       SUM(sync_status = 'synced')                      AS total_synced,
       SUM(sync_status = 'failed')                      AS total_failed,
       SUM(sync_status = 'pending')                     AS total_pending
     FROM zoho_sync`
  );

  const row = rows[0];

  const stats: ZohoSyncStats = {
    total_syncs  : Number(row?.total_syncs   || 0),
    total_synced : Number(row?.total_synced  || 0),
    total_failed : Number(row?.total_failed  || 0),
    total_pending: Number(row?.total_pending || 0),
  };

  await cache.set(cacheKey, stats, {
    ttl  : TTL.syncStats,
    tags : ['zoho', 'stats'],
  });

  return stats;
}

// ════════════════════════════════════════════════════════════════
//  CHECK IF ALREADY SYNCED  (internal helper)
// ════════════════════════════════════════════════════════════════

async function isAlreadySynced(
  userId: number
): Promise<{ synced: boolean; zohoId?: string }> {
  const record = await getZohoSyncRecord(userId);

  if (
    record &&
    record.sync_status === 'synced' &&
    record.zoho_id
  ) {
    return { synced: true, zohoId: record.zoho_id };
  }

  return { synced: false };
}

// ════════════════════════════════════════════════════════════════
//  MARK SYNC FAILED  (internal helper)
// ════════════════════════════════════════════════════════════════

async function markSyncFailed(
  user: ZohoUserData,
  errorMsg: string
): Promise<void> {
  await saveZohoSyncRecord({
    user_id      : user.id,
    zoho_id      : '',
    zoho_module  : 'Contacts',
    email        : user.email,
    phone        : user.phone ?? null,
    sync_status  : 'failed',
    sync_attempts: 1,
    last_sync_at : new Date(),
    error_message: errorMsg,
  }).catch((e) => {
    console.error('❌ [Zoho] Failed to save error record:', e);
  });
}

// ════════════════════════════════════════════════════════════════
//  MAIN SYNC FUNCTION
// ════════════════════════════════════════════════════════════════

export async function syncUserToZoho(
  user: ZohoUserData
): Promise<ZohoSyncResult> {
  const tag = `[Zoho:${user.email}]`;

  // ── 1. Config check ─────────────────────────────────────────
  if (!isZohoConfigured()) {
    console.warn(`⚠️  ${tag} Zoho not configured - skipping`);
    return {
      success : false,
      message : 'Zoho CRM not configured',
      error   : 'Missing credentials',
      skipped : true,
    };
  }

  // ── 2. Already synced check (DB cache) ──────────────────────
  const { synced, zohoId: existingZohoId } = await isAlreadySynced(user.id);
  if (synced && existingZohoId) {
    console.log(`✅ ${tag} Already synced → ${existingZohoId}`);
    return {
      success  : true,
      zohoId   : existingZohoId,
      message  : 'User already synced',
      existing : true,
    };
  }

  try {
    // ── 3. Search in Zoho CRM ──────────────────────────────────
    console.log(`🔍 ${tag} Searching in Zoho...`);
    const searchResult = await searchZohoContactByEmail(user.email);

    if (
      searchResult.success &&
      searchResult.data?.length > 0
    ) {
      const zohoId = searchResult.data[0].id as string;
      console.log(`✅ ${tag} Found in Zoho → ${zohoId}`);

      await saveZohoSyncRecord({
        user_id      : user.id,
        zoho_id      : zohoId,
        zoho_module  : 'Contacts',
        email        : user.email,
        phone        : user.phone ?? null,
        sync_status  : 'synced',
        sync_attempts: 1,
        last_sync_at : new Date(),
        error_message: null,
      });

      return {
        success  : true,
        zohoId,
        message  : 'User already exists in Zoho',
        existing : true,
      };
    }

    // ── 4. Create contact in Zoho ──────────────────────────────
    console.log(`📤 ${tag} Creating contact in Zoho...`);

    const nameParts  = (user.full_name || user.name || 'User').trim().split(' ');
    const firstName  = nameParts[0] ?? 'User';
    const lastName   = nameParts.slice(1).join(' ') || '';

    const createResult = await createZohoContact({
      First_Name   : firstName,
      Last_Name    : lastName,
      Email        : user.email,
      Phone        : user.phone ?? '',
      Mobile       : user.phone ?? '',
      Company      : 'ACASA Website',
      Description  : [
        `Registered on ACASA Website`,
        `Name     : ${user.full_name || user.name}`,
        `Email    : ${user.email}`,
        `UserType : ${user.usertype}`,
        `Provider : ${user.provider ?? 'email'}`,
      ].join('\n'),
      Source       : user.provider === 'google'
        ? 'Google Registration'
        : 'Website Registration',
      Lead_Status  : 'New',
      Website      : 'https://acasa.ae',
    });

    // ── 5. Handle create result ────────────────────────────────
    if (createResult.success && createResult.id) {
      const zohoId = createResult.id as string;
      console.log(`✅ ${tag} Created in Zoho → ${zohoId}`);

      await saveZohoSyncRecord({
        user_id      : user.id,
        zoho_id      : zohoId,
        zoho_module  : 'Contacts',
        email        : user.email,
        phone        : user.phone ?? null,
        sync_status  : 'synced',
        sync_attempts: 1,
        last_sync_at : new Date(),
        error_message: null,
      });

      return {
        success  : true,
        zohoId,
        message  : 'User synced successfully',
        existing : false,
      };
    }

    // ── 6. Create failed ───────────────────────────────────────
    const errMsg = createResult.error ?? 'Zoho create returned no ID';
    console.error(`❌ ${tag} Create failed:`, errMsg);
    await markSyncFailed(user, errMsg);

    return {
      success : false,
      message : 'Failed to sync user to Zoho',
      error   : errMsg,
    };

  } catch (error) {
    const errMsg = buildErrorMessage(error);
    console.error(`❌ ${tag} Unexpected error:`, errMsg);
    await markSyncFailed(user, errMsg);

    return {
      success : false,
      message : 'Unexpected error during Zoho sync',
      error   : errMsg,
    };
  }
}

// ════════════════════════════════════════════════════════════════
//  BULK SYNC  (admin / cron use)
// ════════════════════════════════════════════════════════════════

export interface BulkSyncResult {
  total    : number;
  synced   : number;
  failed   : number;
  skipped  : number;
  results  : Array<{
    userId  : number;
    email   : string;
    success : boolean;
    message : string;
  }>;
}

export async function bulkSyncUsersToZoho(
  users     : ZohoUserData[],
  batchSize : number = 5,          // Zoho rate limit handle karne ke liye
  delayMs   : number = 500,        // batch ke beech delay
): Promise<BulkSyncResult> {
  const result: BulkSyncResult = {
    total  : users.length,
    synced : 0,
    failed : 0,
    skipped: 0,
    results: [],
  };

  // Process in batches
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map((user) => syncUserToZoho(user))
    );

    for (let j = 0; j < batch.length; j++) {
      const user      = batch[j];
      const settled   = batchResults[j];

      if (settled.status === 'fulfilled') {
        const r = settled.value;

        if (r.skipped) {
          result.skipped++;
        } else if (r.success) {
          result.synced++;
        } else {
          result.failed++;
        }

        result.results.push({
          userId  : user.id,
          email   : user.email,
          success : r.success,
          message : r.message,
        });
      } else {
        result.failed++;
        result.results.push({
          userId  : user.id,
          email   : user.email,
          success : false,
          message : buildErrorMessage(settled.reason),
        });
      }
    }

    // Delay between batches (except last)
    if (i + batchSize < users.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  console.log(
    `📊 [Zoho Bulk] total=${result.total} ` +
    `synced=${result.synced} ` +
    `failed=${result.failed} ` +
    `skipped=${result.skipped}`
  );

  // Invalidate stats cache after bulk sync
  await cache.del(CACHE.syncStats());

  return result;
}

// ════════════════════════════════════════════════════════════════
//  RETRY FAILED SYNCS  (cron job ke liye)
// ════════════════════════════════════════════════════════════════

export async function retryFailedSyncs(
  maxAttempts : number = 3,
  limit       : number = 50
): Promise<BulkSyncResult> {
  // Failed records fetch karo jo max attempts se kam hain
  const failedRecords = await query<Array<{
    user_id       : number;
    email         : string;
    sync_attempts : number;
  }>>(
    `SELECT user_id, email, sync_attempts
     FROM zoho_sync
     WHERE sync_status   = 'failed'
       AND sync_attempts < ?
     ORDER BY updated_at ASC
     LIMIT ?`,
    [maxAttempts, limit]
  );

  if (!failedRecords.length) {
    console.log('✅ [Zoho Retry] No failed syncs to retry');
    return {
      total  : 0,
      synced : 0,
      failed : 0,
      skipped: 0,
      results: [],
    };
  }

  console.log(`🔄 [Zoho Retry] Retrying ${failedRecords.length} failed syncs`);

  // Minimal user objects banao retry ke liye
  const usersToRetry: ZohoUserData[] = failedRecords.map((r) => ({
    id        : r.user_id,
    full_name : '',
    name      : '',
    email     : r.email,
    usertype  : 'User',
    status    : 1,
  }));

  return bulkSyncUsersToZoho(usersToRetry, 3, 1000);
}

// ════════════════════════════════════════════════════════════════
//  DEFAULT EXPORT
// ════════════════════════════════════════════════════════════════

export default {
  syncUserToZoho,
  bulkSyncUsersToZoho,
  retryFailedSyncs,
  getZohoSyncRecord,
  getZohoSyncStats,
  saveZohoSyncRecord,
};