// app/api/v1/contacts/route.ts - ADD ZOHO INTEGRATION
import { NextRequest, NextResponse } from "next/server";
import {
  getContacts,
  createContact,
  createContactsBatch,
  getContactStatistics,
  getContactByEmail,
  getContactByPhone,
} from "@/lib/models/contact";
import type { ContactFilters } from "@/types/contact";

// ✅ Import Zoho functions
import { createZohoContact, searchZohoContactByEmail } from "@/lib/zoho/contact";
import { isZohoConfigured } from "@/lib/zoho/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ==================== CONSTANTS ====================

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const VALID_TYPES = [
  "B2C",
  "request_info",
  "download_broucher",
  "sales",
  "b2b",
] as const;

const VALID_SOURCES = [
  "Property Finder",
  "Website Contact Agent",
  "Website Contact",
] as const;

const VALID_SORT_OPTIONS = [
  "created_at_desc",
  "created_at_asc",
  "updated_at_desc",
  "updated_at_asc",
] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_REGEX = /^[\p{L}\s'.-]{2,100}$/u;

type FieldError = {
  field: string;
  message: string;
};

// ==================== RESPONSE HELPERS ====================

function successResponse<T>(
  data: T,
  options?: {
    status?: number;
    message?: string;
    meta?: any;
  }
) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(options?.message ? { message: options.message } : {}),
      ...(options?.meta ? { meta: options.meta } : {}),
    },
    { status: options?.status || 200 }
  );
}

function errorResponse(
  message: string,
  status: number = 400,
  errors?: any
) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(errors ? { errors } : {}),
    },
    { status }
  );
}

// ==================== BASIC HELPERS ====================

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function nullableString(value: unknown): string | null {
  const cleaned = cleanString(value);
  return cleaned.length > 0 ? cleaned : null;
}

function normalizeEmail(value: unknown): string {
  return cleanString(value).toLowerCase();
}

function normalizePhone(value: unknown): string {
  return cleanString(value).replace(/[\s\-()]/g, "");
}

function isValidPhone(phone: string): boolean {
  return /^\+?\d{7,15}$/.test(phone);
}

function parsePositiveInt(value: string | null, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
}

function parseLimit(value: string | null): number {
  const parsed = parsePositiveInt(value, DEFAULT_LIMIT);
  return Math.min(Math.max(parsed, 1), MAX_LIMIT);
}

function parseOptionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function normalizeType(value: unknown): string {
  const raw = cleanString(value);

  if (!raw) return "B2C";

  const lower = raw.toLowerCase();

  if (raw === "B2C") return "B2C";
  if (lower === "b2b") return "b2b";
  if (lower === "download_brochure") return "download_broucher";
  if (lower === "download_broucher") return "download_broucher";
  if (lower === "request_info") return "request_info";
  if (lower === "sales") return "sales";

  return "";
}

function normalizeSource(value: unknown): string {
  const source = cleanString(value);
  if (!source) return "Website Contact";

  return VALID_SOURCES.includes(source as any) ? source : "";
}

function hasOnlyParams(
  searchParams: URLSearchParams,
  allowed: string[]
): boolean {
  const keys = Array.from(new Set(Array.from(searchParams.keys())));
  return keys.every((key) => allowed.includes(key));
}

// ==================== VALIDATE + BUILD CONTACT PAYLOAD ====================

function validateAndBuildContactPayload(raw: any): {
  payload?: Record<string, any>;
  errors: FieldError[];
} {
  const errors: FieldError[] = [];

  if (!isObject(raw)) {
    return {
      errors: [
        {
          field: "body",
          message: "Request body must be a JSON object",
        },
      ],
    };
  }

  const firstNameRaw = cleanString(raw.first_name);
  const lastNameRaw = cleanString(raw.last_name);
  const nameRaw = cleanString(raw.name);

  const finalFirstName =
    firstNameRaw || (nameRaw ? nameRaw.split(/\s+/)[0] : "");

  const finalLastName = lastNameRaw;

  const finalName =
    nameRaw || `${finalFirstName} ${finalLastName}`.trim();

  if (!finalFirstName && !finalName) {
    errors.push({
      field: "first_name",
      message: "First name or name is required",
    });
  }

  if (finalFirstName && !NAME_REGEX.test(finalFirstName)) {
    errors.push({
      field: "first_name",
      message: "First name must be 2-100 characters and contain valid characters",
    });
  }

  if (finalLastName && !NAME_REGEX.test(finalLastName)) {
    errors.push({
      field: "last_name",
      message: "Last name must contain valid characters",
    });
  }

  const email = normalizeEmail(raw.email);

  if (!email) {
    errors.push({
      field: "email",
      message: "Email is required",
    });
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push({
      field: "email",
      message: "Invalid email format",
    });
  }

  const phone = normalizePhone(raw.phone);

  if (!phone) {
    errors.push({
      field: "phone",
      message: "Phone is required",
    });
  } else if (!isValidPhone(phone)) {
    errors.push({
      field: "phone",
      message: "Invalid phone format. Use 7-15 digits",
    });
  }

  const type = normalizeType(raw.type);

  if (!type) {
    errors.push({
      field: "type",
      message: `Invalid type. Valid values: ${VALID_TYPES.join(", ")}`,
    });
  }

  const source = normalizeSource(raw.source);

  if (!source) {
    errors.push({
      field: "source",
      message: `Invalid source. Valid values: ${VALID_SOURCES.join(", ")}`,
    });
  }

  const status =
    raw.status === undefined || raw.status === null || raw.status === ""
      ? 1
      : Number(raw.status);

  if (status !== 0 && status !== 1) {
    errors.push({
      field: "status",
      message: "Status must be 0 or 1",
    });
  }

  const leadStatus =
    raw.lead_status === undefined ||
    raw.lead_status === null ||
    raw.lead_status === ""
      ? 1
      : Number(raw.lead_status);

  if (!Number.isInteger(leadStatus) || leadStatus < 0) {
    errors.push({
      field: "lead_status",
      message: "Lead status must be a valid positive number",
    });
  }

  const message = nullableString(raw.message);

  if (message && message.length > 5000) {
    errors.push({
      field: "message",
      message: "Message must be less than 5000 characters",
    });
  }

  const company = nullableString(raw.company);
  if (company && company.length > 200) {
    errors.push({
      field: "company",
      message: "Company must be less than 200 characters",
    });
  }

  const website = nullableString(raw.website);
  if (website) {
    try {
      new URL(website);
    } catch {
      errors.push({
        field: "website",
        message: "Website must be a valid URL",
      });
    }
  }

  const thirdPartyEmail = nullableString(raw.third_party_client_email);
  if (thirdPartyEmail && !EMAIL_REGEX.test(thirdPartyEmail.toLowerCase())) {
    errors.push({
      field: "third_party_client_email",
      message: "Third party client email is invalid",
    });
  }

  if (errors.length > 0) {
    return { errors };
  }

  const payload: Record<string, any> = {
    first_name: finalFirstName,
    last_name: finalLastName || null,
    name: finalName || finalFirstName,
    email,
    phone,
    type,
    source,
    status,
    lead_status: leadStatus,
  };

  // Optional string fields - only add if value exists
  const optionalStringFields = [
    "message",
    "company",
    "nationality",
    "property_type",
    "contact_type",
    "designation",
    "website",
    "whats_app",
    "facebook",
    "insta",
    "linkedin",
    "landline",
    "mortgage",
    "brn_number",
    "job_role",
    "priority",
    "profile",
    "third_party_client_name",
    "third_party_client_email",
    "third_party_client_mobile",
    "sharing_with",
    "connected_agent",
    "connected_agency",
    "connected_employee",
    "item_type",
    "sub_item_type",
    "represent_type",
    "email_status",
    "cell_status",
    "verified",
  ];

  for (const field of optionalStringFields) {
    const value = nullableString(raw[field]);
    if (value !== null) {
      payload[field] = value;
    }
  }

  // Optional number fields - only add if valid
  const optionalNumberFields = [
    "property_id",
    "agent_id",
    "developerid",
    "individualid",
    "compnayid",
  ];

  for (const field of optionalNumberFields) {
    const value = parseOptionalNumber(raw[field]);
    if (value !== null) {
      payload[field] = value;
    }
  }

  return { payload, errors: [] };
}

// ==================== ZOHO SYNC HELPER ====================

async function syncToZoho(payload: Record<string, any>) {
  console.log('📤 Syncing to Zoho...');
  
  if (!isZohoConfigured()) {
    console.warn('⚠️ Zoho not configured');
    return {
      success: false,
      message: 'Zoho CRM not configured',
    };
  }

  try {
    // Check if contact exists
    const existing = await searchZohoContactByEmail(payload.email);
    
    if (existing.success && existing.data && existing.data.length > 0) {
      console.log('✅ Contact already exists in Zoho');
      return {
        success: true,
        message: 'Contact already exists in Zoho CRM',
        id: existing.data[0]?.id,
      };
    }

    // Create new contact
    const zohoPayload = {
      First_Name: payload.first_name,
      Last_Name: payload.last_name || '',
      Email: payload.email,
      Phone: payload.phone || '',
      Mobile: payload.phone || '',
      Company: payload.company || '',
      Description: payload.message || 'Contact from ACASA Website',
      Source: payload.source || 'Website',
      Enquiry_Type: payload.enquiryType || payload.enquiry_type || '',
      Preferred_Location: payload.location || '',
      Property_Type: payload.property_type || '',
      Nationality: payload.nationality || '',
      Designation: payload.designation || '',
      Website: payload.website || '',
      WhatsApp: payload.whats_app || '',
      Facebook: payload.facebook || '',
      Instagram: payload.insta || '',
      LinkedIn: payload.linkedin || '',
      Landline: payload.landline || '',
      Mortgage: payload.mortgage || '',
      BRN_Number: payload.brn_number || '',
      Priority: payload.priority || '',
    };

    const result = await createZohoContact(zohoPayload);
    console.log('📡 Zoho sync result:', result);
    
    return result;
  } catch (error: any) {
    console.error('❌ Zoho sync error:', error);
    return {
      success: false,
      message: 'Failed to sync with Zoho CRM',
      error: error.message,
    };
  }
}

// ==================== FILTER PARSER ====================

function parseFilters(searchParams: URLSearchParams): {
  filters: ContactFilters;
  errors: FieldError[];
} {
  const errors: FieldError[] = [];

  const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE);
  const limit = parseLimit(searchParams.get("limit"));

  const typeRaw = cleanString(searchParams.get("type"));
  const type = typeRaw ? normalizeType(typeRaw) : undefined;

  if (typeRaw && !type) {
    errors.push({
      field: "type",
      message: `Invalid type. Valid values: ${VALID_TYPES.join(", ")}`,
    });
  }

  const sourceRaw = cleanString(searchParams.get("source"));
  const source = sourceRaw ? normalizeSource(sourceRaw) : undefined;

  if (sourceRaw && !source) {
    errors.push({
      field: "source",
      message: `Invalid source. Valid values: ${VALID_SOURCES.join(", ")}`,
    });
  }

  const statusRaw = searchParams.get("status");
  let status: 0 | 1 | undefined = undefined;

  if (statusRaw !== null) {
    const parsed = Number(statusRaw);
    if (parsed !== 0 && parsed !== 1) {
      errors.push({
        field: "status",
        message: "Status must be 0 or 1",
      });
    } else {
      status = parsed as 0 | 1;
    }
  }

  const leadStatusRaw = searchParams.get("lead_status");
  let lead_status: number | undefined = undefined;

  if (leadStatusRaw !== null) {
    const parsed = Number(leadStatusRaw);
    if (!Number.isInteger(parsed) || parsed < 0) {
      errors.push({
        field: "lead_status",
        message: "Lead status must be a valid number",
      });
    } else {
      lead_status = parsed;
    }
  }

  const sortBy =
    cleanString(searchParams.get("sort_by")) || "created_at_desc";

  if (!VALID_SORT_OPTIONS.includes(sortBy as any)) {
    errors.push({
      field: "sort_by",
      message: `Invalid sort_by. Valid values: ${VALID_SORT_OPTIONS.join(", ")}`,
    });
  }

  const startDate = cleanString(searchParams.get("start_date"));
  const endDate = cleanString(searchParams.get("end_date"));

  if (startDate && Number.isNaN(new Date(startDate).getTime())) {
    errors.push({
      field: "start_date",
      message: "Invalid start_date",
    });
  }

  if (endDate && Number.isNaN(new Date(endDate).getTime())) {
    errors.push({
      field: "end_date",
      message: "Invalid end_date",
    });
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    errors.push({
      field: "date_range",
      message: "start_date cannot be greater than end_date",
    });
  }

  const propertyIdRaw = searchParams.get("property_id");
  const agentIdRaw = searchParams.get("agent_id");

  const property_id = propertyIdRaw
    ? parsePositiveInt(propertyIdRaw, 0) || undefined
    : undefined;

  const agent_id = agentIdRaw
    ? parsePositiveInt(agentIdRaw, 0) || undefined
    : undefined;

  const keyword = cleanString(searchParams.get("keyword"));

  if (keyword && keyword.length < 2) {
    errors.push({
      field: "keyword",
      message: "Keyword must be at least 2 characters",
    });
  }

  const filters: ContactFilters = {
    page,
    limit,
    type: type as any,
    source: source as any,
    status,
    lead_status,
    property_id,
    agent_id,
    email: cleanString(searchParams.get("email")) || undefined,
    phone: cleanString(searchParams.get("phone")) || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    keyword: keyword || undefined,
    sort_by: sortBy as any,
  };

  return { filters, errors };
}

// ==================== DUPLICATE CHECK ====================

async function checkDuplicateContact(payload: Record<string, any>) {
  if (payload.email) {
    const existingEmail = await getContactByEmail(payload.email);

    if (existingEmail) {
      return {
        field: "email",
        message: "Contact with this email already exists",
        existing_id: existingEmail.id,
        existing_cuid: existingEmail.cuid,
      };
    }
  }

  if (payload.phone) {
    const existingPhone = await getContactByPhone(payload.phone);

    if (existingPhone) {
      return {
        field: "phone",
        message: "Contact with this phone already exists",
        existing_id: existingPhone.id,
        existing_cuid: existingPhone.cuid,
      };
    }
  }

  return null;
}

// ==================== GET ====================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Stats
    if (searchParams.get("stats") === "true") {
      const stats = await getContactStatistics();
      return successResponse(stats);
    }

    // Single email lookup
    const emailLookup = normalizeEmail(searchParams.get("email"));

    if (
      emailLookup &&
      hasOnlyParams(searchParams, ["email"])
    ) {
      if (!EMAIL_REGEX.test(emailLookup)) {
        return errorResponse("Invalid email format", 422);
      }

      const contact = await getContactByEmail(emailLookup);

      if (!contact) {
        return errorResponse("Contact not found", 404);
      }

      return successResponse(contact);
    }

    // Single phone lookup
    const phoneLookup = normalizePhone(searchParams.get("phone"));

    if (
      phoneLookup &&
      hasOnlyParams(searchParams, ["phone"])
    ) {
      if (!isValidPhone(phoneLookup)) {
        return errorResponse("Invalid phone format", 422);
      }

      const contact = await getContactByPhone(phoneLookup);

      if (!contact) {
        return errorResponse("Contact not found", 404);
      }

      return successResponse(contact);
    }

    // List contacts
    const { filters, errors } = parseFilters(searchParams);

    if (errors.length > 0) {
      return errorResponse("Validation failed", 422, errors);
    }

    const result = await getContacts(filters);

    return successResponse(result?.data || [], {
      meta: result?.meta || {
        total: 0,
        page: filters.page || DEFAULT_PAGE,
        limit: filters.limit || DEFAULT_LIMIT,
        totalPages: 0,
      },
    });
  } catch (error: any) {
    console.error("GET /api/v1/contacts error:", error);

    return errorResponse(
      "Failed to fetch contacts",
      500,
      error?.message || "Unknown error"
    );
  }
}

// ==================== POST ====================

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      return errorResponse("Content-Type must be application/json", 415);
    }

    let body: any;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    // Batch create
    if (Array.isArray(body)) {
      if (body.length === 0) {
        return errorResponse("Batch body cannot be empty", 400);
      }

      if (body.length > 50) {
        return errorResponse("Maximum 50 contacts allowed in one batch", 400);
      }

      const payloads: Record<string, any>[] = [];
      const validationErrors: any[] = [];

      body.forEach((item, index) => {
        const { payload, errors } = validateAndBuildContactPayload(item);

        if (errors.length > 0 || !payload) {
          validationErrors.push({
            index,
            errors,
          });
        } else {
          payloads.push(payload);
        }
      });

      if (validationErrors.length > 0) {
        return errorResponse(
          "Validation failed for some contacts",
          422,
          validationErrors
        );
      }

      // Duplicate inside batch
      const seenEmails = new Map<string, number>();
      const seenPhones = new Map<string, number>();

      for (let i = 0; i < payloads.length; i++) {
        const email = payloads[i].email;
        const phone = payloads[i].phone;

        if (email) {
          if (seenEmails.has(email)) {
            return errorResponse("Duplicate email found in batch", 409, {
              email,
              first_index: seenEmails.get(email),
              duplicate_index: i,
            });
          }

          seenEmails.set(email, i);
        }

        if (phone) {
          if (seenPhones.has(phone)) {
            return errorResponse("Duplicate phone found in batch", 409, {
              phone,
              first_index: seenPhones.get(phone),
              duplicate_index: i,
            });
          }

          seenPhones.set(phone, i);
        }
      }

      // Duplicate in DB
      for (let i = 0; i < payloads.length; i++) {
        const duplicate = await checkDuplicateContact(payloads[i]);

        if (duplicate) {
          return errorResponse("Duplicate contact found", 409, {
            index: i,
            ...duplicate,
          });
        }
      }

      const contacts = await createContactsBatch(payloads as any);

      // ✅ Zoho Sync for batch (optional - you can sync all)
      let zohoResults = [];
      if (isZohoConfigured()) {
        for (const contact of contacts) {
          const result = await syncToZoho(contact);
          zohoResults.push(result);
        }
      }

      return successResponse(contacts, {
        status: 201,
        message: `${contacts.length} contacts created successfully`,
        meta: {
          total: contacts.length,
          zoho_synced: zohoResults.filter(r => r?.success).length,
        },
      });
    }

    // ─── SINGLE CONTACT CREATE ──────────────────────

    const { payload, errors } = validateAndBuildContactPayload(body);

    if (errors.length > 0 || !payload) {
      return errorResponse("Validation failed", 422, errors);
    }

    const duplicate = await checkDuplicateContact(payload);

    if (duplicate) {
      return errorResponse("Duplicate contact found", 409, duplicate);
    }

    // Save to database
    const contact = await createContact(payload as any);

    // ✅ Sync to Zoho CRM
    let zohoResult = null;
    if (isZohoConfigured()) {
      zohoResult = await syncToZoho(payload);
    } else {
      zohoResult = {
        success: false,
        message: 'Zoho CRM not configured - contact saved only in database',
      };
    }

    // Return response with Zoho status
    return successResponse(contact, {
      status: 201,
      message: "Contact created successfully",
      meta: {
        zoho: zohoResult,
      },
    });

  } catch (error: any) {
    console.error("POST /api/v1/contacts error:", error);

    return errorResponse(
      "Failed to create contact",
      500,
      error?.message || "Unknown error"
    );
  }
}