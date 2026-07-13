// types/projects.ts

export interface Project {
  id: number;
  user_id: number | null;
  state_id: string | null;
  city_id: string | null;
  community_id: string | null;
  sub_community_id: string | null;
  listing_type: string | null;
  occupancy: string | null;
  qc: string | null;
  completion_date: string | null;
  vacating_date: string | null;
  exclusive_status: string | null;
  property_ids: string | null;
  floor_media_ids: string | null;
  gallery_media_ids: string | null;
  developer_id: number | null;
  ProjectId: string | null;
  ProjectNumber: string | null;
  MemberId: number | null;
  ProjectName: string | null;
  Description: string | null;
  featured_project: string | null;
  dld_permit: string | null;
  views: string | null;
  title_deep: string | null;
  Spa_number: string | null;
  from_duration: string | null;
  to_duration: string | null;
  availability_type: string | null;
  price: string | null;
  price_end: string | null;
  askprice: string | null;
  currency_id: number | null;
  property_type: string | null;
  unit: string | null;
  bedroom: string | null;
  area: string | null;
  area_end: string | null;
  area_size: string | null;
  agent_id: string | null;
  Specifications: string | null;
  StartDate: string | null;
  EndDate: string | null;
  BuildingName: string | null;
  StreetName: string | null;
  LocationName: string | null;
  CityName: string | null;
  StateName: string | null;
  PinCode: string | null;
  LandMark: string | null;
  country: string | null;
  floors: number | null;
  rooms: number | null;
  total_building: number | null;
  kitchen_type: string | null;
  amenities: string | null;
  Vaastu: number | null;
  Lift: number | null;
  Club: number | null;
  RainWaterHaresting: number | null;
  PowerBackup: number | null;
  GasConnection: number | null;
  SwimmingPool: number | null;
  Parking: number | null;
  Security: number | null;
  InternetConnection: number | null;
  Gym: number | null;
  ServantQuarters: number | null;
  Balcony: number | null;
  PlayArea: number | null;
  CCTV: number | null;
  ReservedPark: number | null;
  Intercom: number | null;
  Lawn: number | null;
  Terrace: number | null;
  Garden: number | null;
  EarthquakeConstruction: number | null;
  LogoUrl: string | null;
  Url: string | null;
  video_url: string | null;
  whatsapp_url: string | null;
  featured_image: string | null;
  IsFeatured: string | null;
  LastUpdated: string | null;
  keyword: string | null;
  seo_title: string | null;
  meta_description: string | null;
  canonical_tags: string | null;
  project_slug: string | null;
  listing_agent_id: string | null;
  identifying_channel: string | null;
  marketing_channel: string | null;
  contact_channel: string | null;
  owner_id: string | null;
  owner_developer_id: string | null;
  owner_agreement: string | null;
  owner_commision: string | null;
  owner_creation_date: string | null;
  owner_listing_date: string | null;
  documents_id: string | null;
  status: number | null;
  verified: number | null;
  template: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProjectSpecs {
  id: number;
  project_id: number | null;
  ReraNumber: string | null;
  EmployeeName: string | null;
  EmployeeMobile: string | null;
  EmployeeEmail: string | null;
  MemberName: string | null;
  MemberMobile: string | null;
  ReplyEmail: string | null;
  ReplyMobile: string | null;
  Title: string | null;
  CompanyName: string | null;
  MaxArea: string | null;
  MinArea: string | null;
  MaxPrice: string | null;
  MinPrice: string | null;
  ProjectPlanText: string | null;
  TotalRoomCsv: string | null;
  PropertyTypeCsv: string | null;
  Latitude: string | null;
  Longitude: string | null;
  WebsiteKeyword: string | null;
  DeveloperName: string | null;
  OtherAmenities: string | null;
  TransactionName: string | null;
  PossessionName: string | null;
  VirtualTour: string | null;
  YouTubeUrl: string | null;
  TotalRecords: number | null;
  IsCommencement: number | null;
  IsOccupancy: string | null;
  ApprovedBy: string | null;
  TotalArea: string | null;
  OpenSpace: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProjectGallery {
  id: number;
  project_id: number | null;
  Url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProjectContact {
  id: number;
  project_id: number | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProjectData {
  id: number;
  sub_community_id: number;
  name: string | null;
  status: number;
}

export interface ProjectMediaRecord {
  id: number;
  path: string | null;
  title: string | null;
  featured: number | null;
  media_order: number | null;
  full_url: string;
}

export interface ProjectWithRelations extends Project {
  specs: ProjectSpecs | null;
  gallery: ProjectGallery[];
  contacts: ProjectContact[];
  data: ProjectData | null;
  total_gallery_images: number;
  image_url: string;
  image_variations: string[];
  logo_url: string;
  gallery_images: string[];
  image_candidates: string[];
  media_records: ProjectMediaRecord[];
}

export interface ProjectSearchFilters {
  listing_type?: string;
  city_id?: number;
  community_id?: number;
  sub_community_id?: number;
  min_price?: number;
  max_price?: number;
  bedroom?: string;
  status?: number;
  featured?: boolean;
  keyword?: string;
  sort_by?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
  property_type?: string;
}

export interface ProjectEnquiryData {
  project_id: number;
  name: string;
  email: string;
  phone: string;
  message?: string | null;
  user_id?: number | null;
}

export interface ProjectContactData {
  project_id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
}