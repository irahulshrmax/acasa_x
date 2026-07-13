// types/contact.ts

// ==================== BASE TYPES ====================

export interface ContactUs {
  id: number;
  cuid: string | null;
  property_id: number | null;
  agent_id: number | null;
  individualid: number | null;
  compnayid: number | null;
  developerid: number | null;
  connected_agent: string | null;
  connected_agency: string | null;
  connected_employee: string | null;
  sharing_with: string | null;
  item_type: string | null;
  sub_item_type: string | null;
  type: 'B2C' | 'request_info' | 'download_broucher' | 'sales' | 'b2b' | null;
  represent_type: string | null;
  source: 'Property Finder' | 'Website Contact Agent' | 'Website Contact' | null;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  surname: string | null;
  salutaion: string | null;
  drip_marketing: string | null;
  designation: string | null;
  company: string | null;
  nationality: string | null;
  whats_app: string | null;
  facebook: string | null;
  insta: string | null;
  linkedin: string | null;
  brn_number: string | null;
  mortgage: string | null;
  landline: string | null;
  profile: string | null;
  priority: string | null;
  contact_type: string | null;
  agent_activity: string | null;
  admin_activity: string | null;
  email: string | null;
  email_status: 'yes' | 'no';
  phone: string | null;
  cell_status: 'yes' | 'no';
  verified: string | null;
  property_type: string | null;
  website: string | null;
  message: string | null;
  resume: string | null;
  job_role: string | null;
  third_party_client_name: string | null;
  third_party_client_commission: number | null;
  third_party_client_email: string | null;
  third_party_client_mobile: string | null;
  status: 0 | 1;
  contact_date: string | null;
  created_at: Date;
  lead_status: number;
  updated_at: Date;
  last_activity_logged: string | null;
  last_activity_date_time: string | null;
}

// ==================== CREATE/UPDATE TYPES ====================

export interface CreateContactUs {
  cuid?: string;
  property_id?: number | null;
  agent_id?: number | null;
  individualid?: number | null;
  compnayid?: number | null;
  developerid?: number | null;
  connected_agent?: string | null;
  connected_agency?: string | null;
  connected_employee?: string | null;
  sharing_with?: string | null;
  item_type?: string | null;
  sub_item_type?: string | null;
  type?: 'B2C' | 'request_info' | 'download_broucher' | 'sales' | 'b2b' | null;
  represent_type?: string | null;
  source?: 'Property Finder' | 'Website Contact Agent' | 'Website Contact' | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  surname?: string | null;
  salutaion?: string | null;
  drip_marketing?: string | null;
  designation?: string | null;
  company?: string | null;
  nationality?: string | null;
  whats_app?: string | null;
  facebook?: string | null;
  insta?: string | null;
  linkedin?: string | null;
  brn_number?: string | null;
  mortgage?: string | null;
  landline?: string | null;
  profile?: string | null;
  priority?: string | null;
  contact_type?: string | null;
  agent_activity?: string | null;
  admin_activity?: string | null;
  email?: string | null;
  email_status?: 'yes' | 'no';
  phone?: string | null;
  cell_status?: 'yes' | 'no';
  verified?: string | null;
  property_type?: string | null;
  website?: string | null;
  message?: string | null;
  resume?: string | null;
  job_role?: string | null;
  third_party_client_name?: string | null;
  third_party_client_commission?: number | null;
  third_party_client_email?: string | null;
  third_party_client_mobile?: string | null;
  status?: 0 | 1;
  contact_date?: string | null;
  lead_status?: number;
  last_activity_logged?: string | null;
  last_activity_date_time?: string | null;
}

// ==================== FILTERS ====================

export interface ContactFilters {
  type?: string;
  source?: string;
  status?: 0 | 1;
  lead_status?: number;
  property_id?: number;
  agent_id?: number;
  email?: string;
  phone?: string;
  start_date?: string;
  end_date?: string;
  keyword?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at_desc' | 'created_at_asc' | 'updated_at_desc' | 'updated_at_asc';
}

// ==================== STATISTICS ====================

export interface ContactStatistics {
  total: number;
  by_type: Array<{ type: string; count: number }>;
  by_source: Array<{ source: string; count: number }>;
  by_status: Array<{ status: number; count: number }>;
  by_lead_status: Array<{ lead_status: number; count: number }>;
  today: number;
  this_week: number;
  this_month: number;
}

// ==================== API RESPONSES ====================

export interface ContactApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}