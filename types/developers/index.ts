export interface Developer {
  id: number;
  name: string | null;
  year_established: string | null;
  country: string | null;
  website: string | null;
  responsible_agent: string | null;
  ceo_name: string | null;
  email: string | null;
  mobile: string | null;
  address: string | null;
  image: string | null;
  total_project: string | null;
  total_project_withus: string | null;
  total_url: string | null;
  informations: string | null;
  seo_title: string | null;
  seo_keywork: string | null;
  seo_description: string | null;
  created_at: string | null;
  updated_at: string | null;
  status: number;
}

export interface DeveloperSearchFilters {
  name?: string;
  country?: string;
  year_established?: string;
  min_projects?: number;
  max_projects?: number;
  has_email?: boolean;
  has_website?: boolean;
  has_mobile?: boolean;
  has_informations?: boolean;
  keyword?: string;
  status?: number;
  sort_by?: 'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'projects_desc' | 'projects_asc';
  page?: number;
  limit?: number;
}

export interface DeveloperWithRelations extends Developer {
  projects?: any[];
  project_count?: number;
  project_with_us_count?: number;
  image_url: string;
  logo_variations: string[];
}