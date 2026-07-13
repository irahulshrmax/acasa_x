// models/contact.ts

import { db } from '@/lib/database';
import { 
  ContactUs, 
  CreateContactUs, 
  ContactFilters, 
  ContactStatistics 
} from '@/types/contact';
import { cache } from '@/lib/cache';

// ==================== CONSTANTS ====================

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const VALID_TYPES = ['B2C', 'request_info', 'download_broucher', 'sales', 'b2b'];
const VALID_SOURCES = ['Property Finder', 'Website Contact Agent', 'Website Contact'];

// ==================== CACHE KEYS ====================

const CACHE_KEYS = {
  contact: (id: number) => `contact:id:${id}`,
  contactByCuid: (cuid: string) => `contact:cuid:${cuid}`,
  contactByEmail: (email: string) => `contact:email:${email}`,
  contactByPhone: (phone: string) => `contact:phone:${phone}`,
  contacts: (filters: string) => `contacts:list:${filters}`,
  statistics: () => `contacts:statistics`,
  byProperty: (propertyId: number, filters: string) => `contacts:property:${propertyId}:${filters}`,
  byAgent: (agentId: number, filters: string) => `contacts:agent:${agentId}:${filters}`,
} as const;

// ==================== CACHE TTL ====================

const CACHE_TTL = {
  contact: 300,        // 5 minutes
  list: 60,            // 1 minute
  statistics: 120,     // 2 minutes
} as const;

// ==================== CACHE TAGS ====================

const CACHE_TAGS = {
  allContacts: 'all-contacts',
  statistics: 'contact-statistics',
  contact: (id: number) => `contact-${id}`,
} as const;

// ==================== HELPER FUNCTIONS ====================

function validateType(type: string | null | undefined): string | null {
  if (!type) return null;
  return VALID_TYPES.includes(type) ? type : null;
}

function validateSource(source: string | null | undefined): string | null {
  if (!source) return null;
  return VALID_SOURCES.includes(source) ? source : null;
}

function generateCuid(): string {
  return 'CUS-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

function sanitizeEmail(email: string | null): string | null {
  if (!email) return null;
  return email.trim().toLowerCase();
}

function sanitizePhone(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/\s/g, '').trim();
}

// Filters ko string mein convert karne ke liye
function serializeFilters(filters: ContactFilters): string {
  return JSON.stringify(
    Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b)) // consistent key order
      .reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>)
  );
}

// Contact ke cache ko invalidate karne ke liye
async function invalidateContactCache(contact: ContactUs): Promise<void> {
  await Promise.all([
    // Single contact caches delete karo
    cache.del(CACHE_KEYS.contact(contact.id)),
    contact.cuid ? cache.del(CACHE_KEYS.contactByCuid(contact.cuid)) : Promise.resolve(),
    contact.email ? cache.del(CACHE_KEYS.contactByEmail(contact.email)) : Promise.resolve(),
    contact.phone ? cache.del(CACHE_KEYS.contactByPhone(contact.phone)) : Promise.resolve(),

    // Tag se list aur statistics cache delete karo
    cache.delByTag(CACHE_TAGS.allContacts),
    cache.delByTag(CACHE_TAGS.statistics),
    cache.delByTag(CACHE_TAGS.contact(contact.id)),
  ]);
}

// ==================== MAIN FUNCTIONS ====================

/**
 * Create a new contact
 */
export async function createContact(data: CreateContactUs): Promise<ContactUs> {
  const knex = await db();

  if (!data.cuid) {
    data.cuid = generateCuid();
  }

  if (data.email) {
    data.email = sanitizeEmail(data.email);
  }
  if (data.phone) {
    data.phone = sanitizePhone(data.phone);
  }

  if (data.status === undefined) {
    data.status = 1;
  }
  if (data.lead_status === undefined) {
    data.lead_status = 1;
  }

  data.type = validateType(data.type) as any;
  data.source = validateSource(data.source) as any;

  const [id] = await knex('contact_us').insert({
    ...data,
    created_at: new Date(),
    updated_at: new Date(),
  });

  const contact = await getContactById(id);
  if (!contact) {
    throw new Error('Failed to create contact');
  }

  // ✅ Naya contact create hone par list aur statistics cache invalidate karo
  await Promise.all([
    cache.delByTag(CACHE_TAGS.allContacts),
    cache.delByTag(CACHE_TAGS.statistics),
  ]);

  return contact;
}

/**
 * Get contact by ID
 */
export async function getContactById(id: number): Promise<ContactUs | null> {
  const cacheKey = CACHE_KEYS.contact(id);

  // ✅ Pehle cache check karo
  const cached = await cache.get<ContactUs>(cacheKey);
  if (cached) {
    return cached;
  }

  // Cache miss - DB se fetch karo
  const knex = await db();
  const contact = await knex('contact_us')
    .where('id', id)
    .first();

  if (contact) {
    // ✅ Cache mein store karo
    await cache.set(cacheKey, contact, {
      ttl: CACHE_TTL.contact,
      tags: [
        CACHE_TAGS.allContacts,
        CACHE_TAGS.contact(id),
      ],
    });
  }

  return contact || null;
}

/**
 * Get contact by CUID
 */
export async function getContactByCuid(cuid: string): Promise<ContactUs | null> {
  const cacheKey = CACHE_KEYS.contactByCuid(cuid);

  // ✅ Cache check karo
  const cached = await cache.get<ContactUs>(cacheKey);
  if (cached) {
    return cached;
  }

  const knex = await db();
  const contact = await knex('contact_us')
    .where('cuid', cuid)
    .first();

  if (contact) {
    // ✅ Cache mein store karo
    await cache.set(cacheKey, contact, {
      ttl: CACHE_TTL.contact,
      tags: [
        CACHE_TAGS.allContacts,
        CACHE_TAGS.contact(contact.id),
      ],
    });
  }

  return contact || null;
}

/**
 * Get contact by email
 */
export async function getContactByEmail(email: string): Promise<ContactUs | null> {
  const sanitized = sanitizeEmail(email)!;
  const cacheKey = CACHE_KEYS.contactByEmail(sanitized);

  // ✅ Cache check karo
  const cached = await cache.get<ContactUs>(cacheKey);
  if (cached) {
    return cached;
  }

  const knex = await db();
  const contact = await knex('contact_us')
    .where('email', sanitized)
    .first();

  if (contact) {
    // ✅ Cache mein store karo
    await cache.set(cacheKey, contact, {
      ttl: CACHE_TTL.contact,
      tags: [
        CACHE_TAGS.allContacts,
        CACHE_TAGS.contact(contact.id),
      ],
    });
  }

  return contact || null;
}

/**
 * Get contact by phone
 */
export async function getContactByPhone(phone: string): Promise<ContactUs | null> {
  const sanitized = sanitizePhone(phone)!;
  const cacheKey = CACHE_KEYS.contactByPhone(sanitized);

  // ✅ Cache check karo
  const cached = await cache.get<ContactUs>(cacheKey);
  if (cached) {
    return cached;
  }

  const knex = await db();
  const contact = await knex('contact_us')
    .where('phone', sanitized)
    .first();

  if (contact) {
    // ✅ Cache mein store karo
    await cache.set(cacheKey, contact, {
      ttl: CACHE_TTL.contact,
      tags: [
        CACHE_TAGS.allContacts,
        CACHE_TAGS.contact(contact.id),
      ],
    });
  }

  return contact || null;
}

/**
 * Get all contacts with filters
 */
export async function getContacts(filters: ContactFilters = {}) {
  const {
    type,
    source,
    status,
    lead_status,
    property_id,
    agent_id,
    email,
    phone,
    start_date,
    end_date,
    keyword,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    sort_by = 'created_at_desc',
  } = filters;

  const cacheKey = CACHE_KEYS.contacts(serializeFilters(filters));

  // ✅ Cache check karo - dedupe ke saath (multiple same request ek baar hi DB jayegi)
  return cache.dedupe(
    cacheKey,
    async () => {
      const knex = await db();
      const query = knex('contact_us');

      if (type) query.where('type', type);
      if (source) query.where('source', source);
      if (status !== undefined && status !== null) query.where('status', status);
      if (lead_status !== undefined && lead_status !== null) query.where('lead_status', lead_status);
      if (property_id) query.where('property_id', property_id);
      if (agent_id) query.where('agent_id', agent_id);
      if (email) query.where('email', 'like', `%${sanitizeEmail(email)}%`);
      if (phone) query.where('phone', 'like', `%${sanitizePhone(phone)}%`);
      if (start_date) query.where('created_at', '>=', new Date(start_date));
      if (end_date) query.where('created_at', '<=', new Date(end_date));

      if (keyword) {
        query.where(function (this: any) {
          this.where('name', 'like', `%${keyword}%`)
            .orWhere('email', 'like', `%${keyword}%`)
            .orWhere('phone', 'like', `%${keyword}%`)
            .orWhere('company', 'like', `%${keyword}%`)
            .orWhere('message', 'like', `%${keyword}%`);
        });
      }

      switch (sort_by) {
        case 'created_at_asc':
          query.orderBy('created_at', 'asc');
          break;
        case 'updated_at_desc':
          query.orderBy('updated_at', 'desc');
          break;
        case 'updated_at_asc':
          query.orderBy('updated_at', 'asc');
          break;
        case 'created_at_desc':
        default:
          query.orderBy('created_at', 'desc');
      }

      const countQuery = query.clone();
      const [{ total }] = await countQuery.count('* as total');

      const offset = (page - 1) * limit;
      const data = await query.limit(limit).offset(offset);

      return {
        data: data || [],
        meta: {
          total: Number(total) || 0,
          page,
          limit,
          totalPages: Math.ceil(Number(total) / limit) || 0,
        },
      };
    },
    {
      ttl: CACHE_TTL.list,
      tags: [CACHE_TAGS.allContacts],
    }
  );
}

/**
 * Update contact
 */
export async function updateContact(
  id: number,
  data: Partial<CreateContactUs>
): Promise<ContactUs | null> {
  const knex = await db();

  if (data.email) {
    data.email = sanitizeEmail(data.email);
  }
  if (data.phone) {
    data.phone = sanitizePhone(data.phone);
  }
  if (data.type) {
    data.type = validateType(data.type) as any;
  }
  if (data.source) {
    data.source = validateSource(data.source) as any;
  }

  await knex('contact_us')
    .where('id', id)
    .update({
      ...data,
      updated_at: new Date(),
    });

  // ✅ Purana contact fetch karo aur cache invalidate karo
  const updatedContact = await knex('contact_us').where('id', id).first();
  if (updatedContact) {
    await invalidateContactCache(updatedContact);
  }

  return getContactById(id);
}

/**
 * Delete contact (soft delete)
 */
export async function deleteContact(
  id: number
): Promise<{ id: number; deleted: boolean }> {
  const knex = await db();

  // ✅ Delete se pehle contact fetch karo cache invalidation ke liye
  const contact = await knex('contact_us').where('id', id).first();

  await knex('contact_us')
    .where('id', id)
    .update({
      status: 0,
      updated_at: new Date(),
    });

  // ✅ Cache invalidate karo
  if (contact) {
    await invalidateContactCache(contact);
  }

  return { id, deleted: true };
}

/**
 * Permanently delete contact
 */
export async function permanentDeleteContact(
  id: number
): Promise<{ id: number; deleted: boolean }> {
  const knex = await db();

  // ✅ Delete se pehle contact fetch karo cache invalidation ke liye
  const contact = await knex('contact_us').where('id', id).first();

  await knex('contact_us').where('id', id).delete();

  // ✅ Cache invalidate karo
  if (contact) {
    await invalidateContactCache(contact);
  }

  return { id, deleted: true };
}

/**
 * Get contact statistics
 */
export async function getContactStatistics(): Promise<ContactStatistics> {
  const cacheKey = CACHE_KEYS.statistics();

  // ✅ Statistics cache - dedupe ke saath
  return cache.dedupe(
    cacheKey,
    async () => {
      const knex = await db();

      const [totalResult] = await knex('contact_us').count('* as total');

      const byType = await knex('contact_us')
        .select('type')
        .count('* as count')
        .whereNotNull('type')
        .groupBy('type');

      const bySource = await knex('contact_us')
        .select('source')
        .count('* as count')
        .whereNotNull('source')
        .groupBy('source');

      const byStatus = await knex('contact_us')
        .select('status')
        .count('* as count')
        .groupBy('status');

      const byLeadStatus = await knex('contact_us')
        .select('lead_status')
        .count('* as count')
        .groupBy('lead_status');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [todayResult] = await knex('contact_us')
        .where('created_at', '>=', today)
        .count('* as total');

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const [weekResult] = await knex('contact_us')
        .where('created_at', '>=', weekStart)
        .count('* as total');

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const [monthResult] = await knex('contact_us')
        .where('created_at', '>=', monthStart)
        .count('* as total');

      return {
        total: Number(totalResult?.total || 0),
        by_type: byType.map((item: any) => ({
          type: item.type || 'NULL',
          count: Number(item.count),
        })),
        by_source: bySource.map((item: any) => ({
          source: item.source || 'NULL',
          count: Number(item.count),
        })),
        by_status: byStatus.map((item: any) => ({
          status: Number(item.status),
          count: Number(item.count),
        })),
        by_lead_status: byLeadStatus.map((item: any) => ({
          lead_status: Number(item.lead_status),
          count: Number(item.count),
        })),
        today: Number(todayResult?.total || 0),
        this_week: Number(weekResult?.total || 0),
        this_month: Number(monthResult?.total || 0),
      };
    },
    {
      ttl: CACHE_TTL.statistics,
      tags: [CACHE_TAGS.statistics],
    }
  );
}

/**
 * Batch create contacts
 */
export async function createContactsBatch(
  data: CreateContactUs[]
): Promise<ContactUs[]> {
  const results: ContactUs[] = [];

  for (const item of data) {
    const contact = await createContact(item);
    results.push(contact);
  }

  // ✅ Batch complete hone ke baad ek baar invalidate karo
  await Promise.all([
    cache.delByTag(CACHE_TAGS.allContacts),
    cache.delByTag(CACHE_TAGS.statistics),
  ]);

  return results;
}

/**
 * Get contacts by property ID
 */
export async function getContactsByProperty(
  propertyId: number,
  filters: ContactFilters = {}
) {
  return getContacts({
    ...filters,
    property_id: propertyId,
  });
}

/**
 * Get contacts by agent ID
 */
export async function getContactsByAgent(
  agentId: number,
  filters: ContactFilters = {}
) {
  return getContacts({
    ...filters,
    agent_id: agentId,
  });
}

/**
 * Update lead status
 */
export async function updateLeadStatus(
  id: number,
  leadStatus: number
): Promise<ContactUs | null> {
  const knex = await db();

  await knex('contact_us')
    .where('id', id)
    .update({
      lead_status: leadStatus,
      updated_at: new Date(),
    });

  // ✅ Cache invalidate karo
  const updated = await knex('contact_us').where('id', id).first();
  if (updated) {
    await invalidateContactCache(updated);
  }

  return getContactById(id);
}

/**
 * Log activity for contact
 */
export async function logActivity(
  id: number,
  activity: string,
  dateTime?: string
): Promise<ContactUs | null> {
  const knex = await db();

  await knex('contact_us')
    .where('id', id)
    .update({
      last_activity_logged: activity,
      last_activity_date_time: dateTime || new Date().toISOString(),
      updated_at: new Date(),
    });

  // ✅ Cache invalidate karo
  await Promise.all([
    cache.del(CACHE_KEYS.contact(id)),
    cache.delByTag(CACHE_TAGS.contact(id)),
  ]);

  return getContactById(id);
}