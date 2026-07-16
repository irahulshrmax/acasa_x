// types/jobs.ts

export interface Job {
  id: number;
  title: string;
  description: string;
  sub_description: string | null;
  sub_title: string | null;
  type: string;
  link: string;
  city_name: string | null;
  status: number;
  created_at: string | null;
  updated_at: string | null;
  slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keyword: string | null;
  about_team: string | null;
  about_company: string | null;
  responsibilities: string | null;
  social: string | null;
  full_name: string | null;
  job_title: string | null;
  facilities: string | null;
}

export interface CreateJob {
  title: string;
  description?: string;
  sub_description?: string | null;
  sub_title?: string | null;
  type?: string;
  link?: string;
  city_name?: string | null;
  status?: number;
  slug?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keyword?: string | null;
  about_team?: string | null;
  about_company?: string | null;
  responsibilities?: string | null;
  social?: string | null;
  full_name?: string | null;
  job_title?: string | null;
  facilities?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface JobApplication {
  id: number;
  job_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
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

export interface CreateJobApplication {
  job_id: number;
  first_name: string;
  last_name?: string;
  email: string;
  phone: string;
  message?: string | null;
  resume?: string | null;
  cover_letter?: string | null;
  resume_url?: string | null;
  current_last_employer?: string | null;
  current_job_title?: string | null;
  employment_status?: string | null;
  term?: number | null;
  status?: number;
}

export interface JobFilters {
  type?: string;
  city_name?: string;
  status?: number;
  keyword?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at_desc' | 'created_at_asc' | 'updated_at_desc' | 'updated_at_asc' | 'title_asc' | 'title_desc';
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