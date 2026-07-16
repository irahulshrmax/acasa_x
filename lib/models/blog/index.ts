import { db } from '@/lib/database';
import { cache } from '@/lib/cache';
import {
  UPLOAD_BASE_URL,
  getBlogImageCandidates,
  getBlogImageUrl as getBlogImageFromResolver,
  getBlogImageVariations,
  getNoImageUrl,
  isValidImageUrl,
  validateImagePath,
  sanitizeImagePath,
  IMAGE_EXTENSIONS,
  BLOG_IMAGE_DIRS,
} from '@/lib/image-resolver';

export interface Blog {
  id: number;
  title: string;
  slug: string;
  sub_title?: string;
  writer?: string;
  publish_date?: Date | string;
  category: string;
  imageurl?: string;
  descriptions?: string;
  status: number;
  seo_title?: string;
  seo_keywork?: string;
  seo_description?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
  views?: number;
  likes?: number;
  comments_count?: number;
  featured?: boolean;
}

export interface BlogWithRelated extends Blog {
  image_urls: {
    main: string;
    variations: string[];
    thumbnail: string;
    medium: string;
  };
  tags_list: string[];
  author_image_url: string | null;
  excerpt: string;
  formatted_date: string;
  reading_time: number;
}

export interface BlogFilters {
  category?: string;
  status?: number;
  keyword?: string;
  sort_by?: 'newest' | 'oldest' | 'popular' | 'views' | 'likes' | 'comments' | 'title_asc' | 'title_desc';
  page?: number;
  limit?: number;
  featured?: boolean;
  author?: string;
  from_date?: string;
  to_date?: string;
}

export interface BlogMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BlogListResult {
  data: BlogWithRelated[];
  meta: BlogMeta;
}

const CACHE_KEYS = {
  blogList: (filters: BlogFilters) => `blogs:list:${JSON.stringify(filters)}`,
  blogSlug: (slug: string) => `blogs:slug:${slug}`,
  blogId: (id: number) => `blogs:id:${id}`,
  categories: () => `blogs:categories`,
  stats: () => `blogs:stats`,
  latest: (limit: number) => `blogs:latest:${limit}`,
  related: (slug: string, limit: number) => `blogs:related:${slug}:${limit}`,
  categoryBlogs: (cat: string, limit: number) => `blogs:cat:${cat}:${limit}`,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────

function stripUploadPrefix(val: string): string {
  return val.replace(/^upload\//i, '').replace(/^\/+/, '');
}

function isAbsoluteUrl(val: string): boolean {
  return /^https?:\/\//i.test(val);
}

// ✅ Using all imported image resolver functions
export function getBlogImageUrl(rawPath: string | null | undefined): {
  main: string;
  variations: string[];
  thumbnail: string;
  medium: string;
} {
  // ✅ 1. Validate image path
  if (!rawPath || !validateImagePath(rawPath)) {
    return {
      main: getNoImageUrl(),
      variations: [getNoImageUrl()],
      thumbnail: getNoImageUrl(),
      medium: getNoImageUrl(),
    };
  }

  // ✅ 2. Sanitize the path
  const sanitized = sanitizeImagePath(rawPath);
  if (!sanitized) {
    return {
      main: getNoImageUrl(),
      variations: [getNoImageUrl()],
      thumbnail: getNoImageUrl(),
      medium: getNoImageUrl(),
    };
  }

  // ✅ 3. Check if it's a full URL
  if (isAbsoluteUrl(sanitized)) {
    return {
      main: sanitized,
      variations: [sanitized],
      thumbnail: sanitized,
      medium: sanitized,
    };
  }

  // ✅ 4. Use image resolver to get all candidates
  const candidates = getBlogImageCandidates(sanitized);
  const main = candidates.length > 0 ? candidates[0] : getNoImageUrl();
  const variations = candidates.length > 0 ? candidates : [main];

  // ✅ 5. Validate final URLs
  const validMain = isValidImageUrl(main) ? main : getNoImageUrl();
  const validVariations = variations.filter((url) => isValidImageUrl(url));
  const finalVariations = validVariations.length > 0 ? validVariations : [getNoImageUrl()];

  // ✅ 6. Generate thumbnail and medium versions
  const clean = stripUploadPrefix(sanitized);
  const baseName = clean.replace(/\.[^.]+$/, '');
  
  return {
    main: validMain,
    variations: finalVariations,
    thumbnail: `${UPLOAD_BASE_URL}/media/thumbnail/${baseName}.webp`,
    medium: `${UPLOAD_BASE_URL}/media/medium/${baseName}.webp`,
  };
}

export async function getBlogById(id: number): Promise<BlogWithRelated | null> {
  const cacheKey = CACHE_KEYS.blogId(id);
  const cached = await cache.get<BlogWithRelated>(cacheKey);
  if (cached) return cached;

  const knex = await db();
  const blog = await knex('blogs').where('id', id).first();

  if (!blog) return null;

  const result = transformBlog(blog);
  await cache.set(cacheKey, result, { ttl: 600, tags: ['blogs', `blog:${id}`] });
  return result;
}

export async function getBlogs(filters: BlogFilters = {}): Promise<BlogListResult> {
  const {
    category,
    status = 1,
    keyword,
    sort_by = 'newest',
    page = 1,
    limit = 12,
    featured,
    author,
    from_date,
    to_date,
  } = filters;

  const cacheKey = CACHE_KEYS.blogList(filters);
  const cached = await cache.get<BlogListResult>(cacheKey);
  if (cached) return cached;

  const knex = await db();
  const query = knex('blogs').where('status', status);

  if (category && category !== 'all') query.where('category', category);
  if (featured !== undefined) query.where('featured', featured ? 1 : 0);
  if (author) query.where('writer', author);
  if (from_date) query.where('publish_date', '>=', from_date);
  if (to_date) query.where('publish_date', '<=', to_date);

  if (keyword) {
    query.where(function (this: any) {
      this.where('title', 'like', `%${keyword}%`)
        .orWhere('descriptions', 'like', `%${keyword}%`)
        .orWhere('category', 'like', `%${keyword}%`)
        .orWhere('writer', 'like', `%${keyword}%`);
    });
  }

  const sortMap: Record<string, [string, 'asc' | 'desc']> = {
    newest: ['publish_date', 'desc'],
    oldest: ['publish_date', 'asc'],
    popular: ['publish_date', 'desc'], // fallback
    views: ['publish_date', 'desc'], // fallback
    likes: ['publish_date', 'desc'], // fallback
    comments: ['publish_date', 'desc'], // fallback
    title_asc: ['title', 'asc'],
    title_desc: ['title', 'desc'],
  };
  const [sortCol, sortDir] = sortMap[sort_by] || sortMap.newest;
  query.orderBy(sortCol, sortDir).orderBy('id', 'desc');

  const countKey = `blogs:count:${JSON.stringify({ 
    category, status, keyword, featured, author 
  })}`;
  
  let total = await cache.get<number>(countKey);

  if (total === null) {
    const countQuery = knex('blogs').where('status', status);
    if (category && category !== 'all') countQuery.where('category', category);
    if (keyword) countQuery.where('title', 'like', `%${keyword}%`);
    const [{ count }] = await countQuery.count('* as count');
    total = Number(count);
    await cache.set(countKey, total, { ttl: 60, tags: ['blogs', 'count'] });
  }

  const offset = (page - 1) * limit;
  query.limit(limit).offset(offset);

  // ✅ FIX: Remove views, likes, comments_count, featured from select
  const blogs = await query.select(
    'id', 'title', 'slug', 'sub_title', 'writer', 'publish_date',
    'category', 'imageurl', 'descriptions', 'status',
    'seo_title', 'seo_keywork', 'seo_description',
    'created_at', 'updated_at'
  );

  const result: BlogListResult = {
    data: blogs.map(transformBlog),
    meta: {
      total: total ?? 0,
      page,
      limit,
      totalPages: Math.ceil((total ?? 0) / limit),
    },
  };

  const tags = ['blogs', 'list'];
  if (category) tags.push(`category:${category}`);
  if (featured) tags.push('featured');

  await cache.set(cacheKey, result, { ttl: 120, tags });
  return result;
}

export async function getBlogBySlug(slug: string): Promise<BlogWithRelated | null> {
  const cacheKey = CACHE_KEYS.blogSlug(slug);
  const cached = await cache.get<BlogWithRelated>(cacheKey);
  if (cached) return cached;

  const knex = await db();
  const blog = await knex('blogs')
    .where('slug', slug)
    .where('status', 1)
    .first();

  if (!blog) return null;

  const result = transformBlog(blog);
  await cache.set(cacheKey, result, { ttl: 600, tags: ['blogs', `slug:${slug}`] });
  return result;
}

export async function getRelatedBlogs(
  slug: string,
  limit: number = 3
): Promise<BlogWithRelated[]> {
  const cacheKey = CACHE_KEYS.related(slug, limit);
  const cached = await cache.get<BlogWithRelated[]>(cacheKey);
  if (cached) return cached;

  const knex = await db();
  const current = await knex('blogs')
    .where('slug', slug)
    .first()
    .select('category', 'id');

  if (!current) return [];

  const related = await knex('blogs')
    .where('category', current.category)
    .whereNot('id', current.id)
    .where('status', 1)
    .orderBy('publish_date', 'desc')
    .limit(limit)
    .select(
      'id', 'title', 'slug', 'category',
      'imageurl', 'descriptions', 'publish_date'
    );

  const result = related.map(transformBlog);
  await cache.set(cacheKey, result, { ttl: 300, tags: ['blogs', 'related'] });
  return result;
}

export async function getBlogCategories(): Promise<
  { category: string; count: number }[]
> {
  const cacheKey = CACHE_KEYS.categories();
  const cached = await cache.get<{ category: string; count: number }[]>(cacheKey);
  if (cached) return cached;

  const knex = await db();
  const categories = await knex('blogs')
    .where('status', 1)
    .select('category')
    .count('* as count')
    .groupBy('category')
    .orderBy('count', 'desc');

  const result = categories.map((c: any) => ({
    category: c.category,
    count: parseInt(c.count),
  }));

  await cache.set(cacheKey, result, { ttl: 600, tags: ['blogs', 'categories'] });
  return result;
}

export async function getBlogStatistics() {
  const cacheKey = CACHE_KEYS.stats();
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const knex = await db();

  const [
    totalResult,
    publishedResult,
    draftResult,
    featuredResult,
    viewsResult,
    likesResult,
    commentsResult,
    categoriesResult,
    authorsResult,
    monthlyResult,
  ] = await Promise.all([
    knex('blogs').count('* as count').first(),
    knex('blogs').where('status', 1).count('* as count').first(),
    knex('blogs').where('status', 0).count('* as count').first(),
    knex('blogs').where('featured', 1).count('* as count').first(),
    knex('blogs').sum('views as total').first(),
    knex('blogs').sum('likes as total').first(),
    knex('blogs').sum('comments_count as total').first(),
    knex('blogs')
      .where('status', 1)
      .select('category')
      .count('* as count')
      .groupBy('category'),
    knex('blogs')
      .where('status', 1)
      .whereNotNull('writer')
      .select('writer')
      .count('* as count')
      .groupBy('writer')
      .orderBy('count', 'desc')
      .limit(5),
    knex.raw(`
      SELECT DATE_FORMAT(publish_date, '%Y-%m') as month, COUNT(*) as count 
      FROM blogs WHERE status = 1 AND publish_date IS NOT NULL 
      GROUP BY month ORDER BY month DESC LIMIT 12
    `),
  ]);

  const result = {
    total: Number(totalResult?.count || 0),
    total_published: Number(publishedResult?.count || 0),
    total_draft: Number(draftResult?.count || 0),
    total_featured: Number(featuredResult?.count || 0),
    total_views: Number(viewsResult?.total || 0),
    total_likes: Number(likesResult?.total || 0),
    total_comments: Number(commentsResult?.total || 0),
    categories: categoriesResult || [],
    authors: authorsResult || [],
    monthly_posts: monthlyResult?.[0] || [],
  };

  await cache.set(cacheKey, result, { ttl: 300, tags: ['blogs', 'stats'] });
  return result;
}

export async function getLatestBlogs(limit: number = 6): Promise<BlogWithRelated[]> {
  const cacheKey = CACHE_KEYS.latest(limit);
  const cached = await cache.get<BlogWithRelated[]>(cacheKey);
  if (cached) return cached;

  const knex = await db();
  const blogs = await knex('blogs')
    .where('status', 1)
    .orderBy('publish_date', 'desc')
    .limit(limit)
    .select(
      'id', 'title', 'slug', 'category', 'imageurl', 'descriptions',
      'publish_date', 'writer'
    );

  const result = blogs.map(transformBlog);
  await cache.set(cacheKey, result, { ttl: 120, tags: ['blogs', 'latest'] });
  return result;
}

export async function getFeaturedBlogs(limit: number = 6): Promise<BlogWithRelated[]> {
  const cacheKey = `blogs:featured:${limit}`;
  const cached = await cache.get<BlogWithRelated[]>(cacheKey);
  if (cached) return cached;

  const knex = await db();
  const blogs = await knex('blogs')
    .where('status', 1)
    .where('featured', 1)
    .orderBy('publish_date', 'desc')
    .limit(limit)
    .select(
      'id', 'title', 'slug', 'category', 'imageurl', 'descriptions',
      'publish_date', 'writer'
    );

  const result = blogs.map(transformBlog);
  await cache.set(cacheKey, result, { ttl: 120, tags: ['blogs', 'featured'] });
  return result;
}

export async function createBlog(data: Partial<Blog>): Promise<BlogWithRelated | null> {
  const knex = await db();

  if (!data.slug && data.title) {
    data.slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  if (data.slug) {
    const existing = await knex('blogs').where('slug', data.slug).first();
    if (existing) data.slug = `${data.slug}-${Date.now()}`;
  }

  const [id] = await knex('blogs').insert({
    ...data,
    status: data.status ?? 1,
    publish_date: data.publish_date || new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  });

  await cache.delPattern('blogs:list');
  await cache.delPattern('blogs:stats');
  await cache.delPattern('blogs:categories');
  await cache.delPattern('blogs:latest');

  return getBlogById(id);
}

export async function updateBlogById(
  id: number,
  data: Partial<Blog>
): Promise<BlogWithRelated | null> {
  const knex = await db();

  await knex('blogs').where('id', id).update({
    ...data,
    updated_at: new Date(),
  });

  const blog = await knex('blogs').where('id', id).first();
  if (blog) {
    await cache.del(CACHE_KEYS.blogSlug(blog.slug));
    await cache.del(CACHE_KEYS.blogId(id));
  }
  await cache.delPattern('blogs:list');
  await cache.delPattern('blogs:stats');

  return getBlogById(id);
}

export async function deleteBlogById(id: number): Promise<{ id: number; deleted: boolean }> {
  const knex = await db();
  const blog = await knex('blogs').where('id', id).first();

  await knex('blogs').where('id', id).update({
    status: 0,
  });

  if (blog) {
    await cache.del(CACHE_KEYS.blogSlug(blog.slug));
    await cache.del(CACHE_KEYS.blogId(id));
  }
  await cache.delPattern('blogs:list');

  return { id, deleted: true };
}

export async function permanentDeleteBlogById(id: number): Promise<{ id: number; deleted: boolean }> {
  const knex = await db();
  await knex('blogs').where('id', id).delete();
  await cache.del(CACHE_KEYS.blogId(id));
  await cache.delPattern('blogs:list');
  return { id, deleted: true };
}

export async function getBlogsByCategory(
  category: string,
  limit: number = 12
): Promise<BlogWithRelated[]> {
  const cacheKey = `blogs:category:${category}:${limit}`;
  const cached = await cache.get<BlogWithRelated[]>(cacheKey);
  if (cached) return cached;

  const knex = await db();
  const blogs = await knex('blogs')
    .where('category', category)
    .where('status', 1)
    .orderBy('publish_date', 'desc')
    .limit(limit)
    .select(
      'id', 'title', 'slug', 'category', 'imageurl', 'descriptions',
      'publish_date', 'writer'
    );

  const result = blogs.map(transformBlog);
  await cache.set(cacheKey, result, { ttl: 300, tags: ['blogs', 'category', `category:${category}`] });
  return result;
}

function transformBlog(row: any): BlogWithRelated {
  // ✅ Using all imported image resolver functions
  const imageUrl = row.imageurl;
  
  // ✅ 1. Validate and sanitize image path
  const validatedPath = validateImagePath(imageUrl) ? sanitizeImagePath(imageUrl) : null;
  
  // ✅ 2. Get image URLs using resolver
  const imageUrls = getBlogImageUrl(validatedPath || imageUrl);

  return {
    ...row,
    image_urls: imageUrls,
    tags_list: row.category
      ? row.category.split(',').map((t: string) => t.trim()).filter(Boolean)
      : [],
    author_image_url: null,
    excerpt: getExcerpt(row.descriptions || ''),
    formatted_date: formatDate(row.publish_date),
    reading_time: getReadingTime(row.descriptions || ''),
  };
}

function formatDate(date: Date | string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getExcerpt(content: string, maxLength: number = 160): string {
  if (!content) return '';
  const clean = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.length <= maxLength
    ? clean
    : clean.substring(0, maxLength).trim() + '...';
}

function getReadingTime(content: string): number {
  if (!content) return 1;
  const words = content
    .replace(/<[^>]*>/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
  return Math.max(1, Math.ceil(words.length / 200));
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────

export default {
  getBlogs,
  getBlogById,
  getBlogBySlug,
  getRelatedBlogs,
  getBlogCategories,
  getBlogStatistics,
  getLatestBlogs,
  getFeaturedBlogs,
  getBlogsByCategory,
  createBlog,
  updateBlogById,
  deleteBlogById,
  permanentDeleteBlogById,
  getBlogImageUrl,
  // ✅ Export resolver functions too
  isValidImageUrl,
  validateImagePath,
  sanitizeImagePath,
  IMAGE_EXTENSIONS,
  BLOG_IMAGE_DIRS,
};