// types/community.ts

export interface Community {
  id: number;
  community_id: number | null;
  name: string;
  country_id: number;
  state_id: number | null;
  city_id: number;
  slug: string | null;
  latitude: string | null;
  longitude: string | null;
  img: string | null;
  school_img: string | null;
  hotel_img: string;
  hospital_img: string | null;
  train_img: string | null;
  bus_img: string | null;
  description: string | null;
  top_community: string | null;
  top_projects: string | null;
  featured_project: string | null;
  related_blog: string | null;
  properties: string | null;
  similar_location: string | null;
  sales_diretor: string | null;
  seo_slug: string | null;
  seo_title: string | null;
  seo_keywork: string | null;
  seo_description: string | null;
  featured: number | null;
  status: number;
}

export interface CommunityWithRelations extends Community {
  city_name?: string;
  city_slug?: string;
  state_name?: string;
  country_name?: string;
  property_count?: number;
  top_community_names?: string[];
  top_projects_names?: string[];
  featured_project_names?: string[];
  related_blog_names?: string[];
  properties_details?: any[];
  similar_location_names?: string[];
  image_variations?: string[];
  image_url?: string;
}

export interface CommunityFilters {
  city_id?: number;
  state_id?: number;
  country_id?: number;
  status?: number;
  featured?: boolean;
  keyword?: string;
  sort_by?: 'name_asc' | 'name_desc' | 'featured_desc' | 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}