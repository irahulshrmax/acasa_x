// ============================================
// TYPES/BLOG/INDEX.TS - FIXED
// ============================================

export interface Blog {
    id: number;
    blog_id: string | null;
    title: string;
    slug: string;
    category: string;
    sub_category: string | null;
    tags: string | null;
    descriptions: string | null;
    long_description: string | null;
    image: string | null;
    banner_image: string | null;
    author: string | null;
    author_image: string | null;
    author_designation: string | null;
    author_bio: string | null;
    featured: number;
    status: number;
    views: number;
    likes: number;
    comments_count: number;
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    canonical_url: string | null;
    read_time: string | null;
    published_at: Date | null;
    created_at: Date | null;
    updated_at: Date | null;
    deleted_at: Date | null;
}

export interface BlogFilters {
    category?: string;
    sub_category?: string;
    tags?: string[];
    status?: number;
    featured?: boolean;
    keyword?: string;
    author?: string;
    from_date?: string;
    to_date?: string;
    sort_by?: 'newest' | 'oldest' | 'popular' | 'views' | 'likes' | 'comments' | 'title_asc' | 'title_desc';
    page?: number;
    limit?: number;
}

export interface BlogCategory {
    category: string;
    count: number;
}

export interface BlogAuthor {
    author: string;
    count: number;
}

export interface MonthlyPost {
    month: string;
    count: number;
}

export interface BlogStatistics {
    total: number;
    total_published: number;
    total_draft: number;
    total_archived: number;
    total_featured: number;
    total_views: number;
    total_likes: number;
    total_comments: number;
    categories: BlogCategory[];
    authors: BlogAuthor[];
    monthly_posts: MonthlyPost[];
    avg_read_time: number;
}

export interface BlogImageUrls {
    main: string;
    variations: string[];
    thumbnail: string;
    medium: string;
}

export interface BlogWithRelated extends Blog {
    related: Blog[];
    image_urls: BlogImageUrls;
    tags_list: string[];
    author_image_url: string | null;
    excerpt: string;
}

export interface BlogResponse {
    success: boolean;
    data?: Blog | Blog[] | BlogWithRelated | BlogStatistics | BlogCategory[] | any;
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    message?: string;
    error?: string;
    cached?: boolean;
}

export interface CreateBlogInput {
    title: string;
    slug?: string;
    category: string;
    sub_category?: string;
    tags?: string;
    descriptions: string;
    long_description?: string;
    image?: string;
    banner_image?: string;
    author?: string;
    author_image?: string;
    author_designation?: string;
    author_bio?: string;
    featured?: number;
    status?: number;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    canonical_url?: string;
    read_time?: string;
    published_at?: Date;
}

export interface UpdateBlogInput extends Partial<CreateBlogInput> {
    id?: number;
}

export interface BulkOperationInput {
    action: 'delete' | 'restore' | 'permanent_delete' | 'publish' | 'draft' | 'feature' | 'unfeature' | 'update_category';
    ids: number[];
    data?: {
        category?: string;
    };
}

export interface InteractionInput {
    action: 'like' | 'unlike';
}

export interface InteractionResponse {
    likes: number;
}