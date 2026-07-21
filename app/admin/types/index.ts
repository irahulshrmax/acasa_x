export interface Blog {
  id: number;
  title: string;
  slug: string;
  category: string;
  status: number;
  views: number;
  created_at: string;
  publish_date?: string;
  author?: string;
  imageurl?: string;
  descriptions?: string;
  featured?: boolean;
}

export interface Developer {
  id: number;
  name: string;
  slug: string;
  status: number;
  projects_count: number;
  image?: string;
  logo?: string;
  website?: string;
  country?: string;
  description?: string;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  created_at: string;
  last_login?: string;
  phone?: string;
  avatar?: string;
}

export interface Property {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  community: string;
  developer: string;
  created_at: string;
  featured: boolean;
}

export interface Community {
  id: number;
  name: string;
  slug: string;
  city: string;
  type: string;
  properties_count: number;
  image?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface SubCommunity {
  id: number;
  name: string;
  slug: string;
  community_id: number;
  community_name: string;
  properties_count: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Career {
  id: number;
  title: string;
  slug: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract';
  status: 'open' | 'closed';
  created_at: string;
  applications_count: number;
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}

export interface Review {
  id: number;
  name: string;
  email: string;
  rating: number;
  comment: string;
  property_id?: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Document {
  id: number;
  title: string;
  slug: string;
  type: string;
  file_url: string;
  size: string;
  downloads: number;
  status: 'published' | 'draft';
  created_at: string;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  order: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface DashboardStats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalDevelopers: number;
  totalUsers: number;
  totalViews: number;
  totalProperties: number;
  totalCommunities: number;
  totalSubCommunities: number;
  totalCareers: number;
  totalContacts: number;
  totalReviews: number;
  totalDocuments: number;
  totalFAQs: number;
  recentBlogs: Blog[];
  recentProperties: Property[];
  recentContacts: Contact[];
}