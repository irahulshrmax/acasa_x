// types/jobs.ts

// ==================== JOB TYPES ====================

export interface Job {
  id: number;
  full_name: string | null;
  title: string | null;
  description: string | null;
  sub_title: string | null;
  sub_description: string | null;
  about_team: string | null;
  about_company: string | null;
  job_title: string | null;
  city_name: string | null;
  responsibilities: string | null;
  type: string | null;
  link: string | null;
  facilities: string | null;
  social: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keyword: string | null;
  status: number;
  updated_at: string | null;
  created_at: string | null;
  slug: string | null;
}

// ==================== JOB APPLICATION TYPES ====================

export interface JobApplication {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  resume: string | null;
  current_last_employer: string | null;
  current_job_title: string | null;
  employment_status: string | null;
  term: number | null;
  status: number;
  apply_date: string;
  update_date: string;
}

// ==================== CREATE/UPDATE TYPES ====================

export interface CreateJob {
  full_name?: string | null;
  title?: string | null;
  description?: string | null;
  sub_title?: string | null;
  sub_description?: string | null;
  about_team?: string | null;
  about_company?: string | null;
  job_title?: string | null;
  city_name?: string | null;
  responsibilities?: string | null;
  type?: string | null;
  link?: string | null;
  facilities?: string | null;
  social?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keyword?: string | null;
  status?: number;
  updated_at?: string | null;
  created_at?: string | null;
  slug?: string | null;
}

export interface CreateJobApplication {
  job_id: number;
  first_name: string;
  last_name?: string | null;
  email: string;
  phone: string;
  message?: string | null;
  resume?: string | null;
  current_last_employer?: string | null;
  current_job_title?: string | null;
  employment_status?: string | null;
  term?: number | null;
  status?: number;
}

// ==================== FILTERS ====================

export interface JobFilters {
  type?: string;
  city_name?: string;
  status?: number;
  keyword?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at_desc' | 'created_at_asc' | 'updated_at_desc' | 'updated_at_asc';
}

export interface JobApplicationFilters {
  job_id?: number;
  status?: number;
  email?: string;
  phone?: string;
  keyword?: string;
  page?: number;
  limit?: number;
  sort_by?: 'apply_date_desc' | 'apply_date_asc' | 'status';
}

// ==================== STATISTICS ====================

export interface JobStatistics {
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
  jobs_by_type: Array<{ type: string; count: number }>;
  jobs_by_city: Array<{ city_name: string; count: number }>;
  applications_by_status: Array<{ status: number; count: number }>;
  recent_applications: JobApplication[];
  recent_jobs: Job[];
}

// ==================== API RESPONSES ====================

export interface JobsApiResponse<T> {
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