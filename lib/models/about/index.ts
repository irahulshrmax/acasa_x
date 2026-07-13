import { db } from '@/lib/database';
import { cache } from '@/lib/cache';

export interface About {
    id: number;
    title: string;
    slug: string;
    heading: string | null;
    imageurl: string | null;
    descriptions: string | null;
    descriptions_other: string | null;
    enable_modules: string | null;
    seo_title: string | null;
    seo_keywork: string | null;
    seo_description: string | null;
    status: number;
    created_at: Date | null;
    updated_at: Date | null;
}

export interface AboutWithRelations extends About {
    image_url?: string;
    image_variations?: string[];
}

// ✅ FIXED: Correct image URL transformation
function transformAbout(row: any): AboutWithRelations {
    let imageUrl = 'https://acasa.ae/upload/no-image.png';
    let variations: string[] = [];

    if (row.imageurl) {
        const cleanImage = row.imageurl.trim();
        
        // If it's already a full URL
        if (cleanImage.startsWith('http://') || cleanImage.startsWith('https://')) {
            imageUrl = cleanImage;
            variations = [cleanImage];
        } 
        // If it starts with /upload/about/ - keep as is but use correct domain
        else if (cleanImage.startsWith('/upload/about/')) {
            imageUrl = `https://acasa.ae${cleanImage}`;
            variations = [imageUrl];
        }
        // If it starts with upload/about/
        else if (cleanImage.startsWith('upload/about/')) {
            imageUrl = `https://acasa.ae/${cleanImage}`;
            variations = [imageUrl];
        }
        // If it starts with /upload/
        else if (cleanImage.startsWith('/upload/')) {
            imageUrl = `https://acasa.ae${cleanImage}`;
            variations = [imageUrl];
        }
        // If it starts with upload/
        else if (cleanImage.startsWith('upload/')) {
            imageUrl = `https://acasa.ae/${cleanImage}`;
            variations = [imageUrl];
        }
        // If it starts with /About/
        else if (cleanImage.startsWith('/About/')) {
            imageUrl = `https://acasa.ae${cleanImage}`;
            variations = [imageUrl];
        }
        // If it's just a filename
        else if (!cleanImage.includes('/')) {
            imageUrl = `https://acasa.ae/About/${cleanImage}`;
            variations = [
                `https://acasa.ae/About/${cleanImage}`,
                `https://acasa.ae/upload/About/${cleanImage}`,
            ];
        }
        // Default: try to construct URL
        else {
            // Remove leading slash if any
            const path = cleanImage.replace(/^\/+/, '');
            imageUrl = `https://acasa.ae/${path}`;
            variations = [imageUrl];
        }
    }

    return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        heading: row.heading,
        imageurl: row.imageurl,
        descriptions: row.descriptions,
        descriptions_other: row.descriptions_other,
        enable_modules: row.enable_modules,
        seo_title: row.seo_title,
        seo_keywork: row.seo_keywork,
        seo_description: row.seo_description,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        image_url: imageUrl,
        image_variations: variations,
    };
}

// ─── CACHED READ OPERATIONS ──────────────────────────────────────────

export async function getAboutBySlug(slug: string): Promise<AboutWithRelations | null> {
    const key = `about:slug:${slug}`;
    
    try {
        return await cache.dedupe<AboutWithRelations | null>(key, async () => {
            const knex = await db();

            const about = await knex('webcontrol')
                .where('slug', slug)
                .where('status', 1)
                .first()
                .select(
                    'id',
                    'title',
                    'slug',
                    'heading',
                    'imageurl',
                    'descriptions',
                    'descriptions_other',
                    'enable_modules',
                    'seo_title',
                    'seo_keywork',
                    'seo_description',
                    'status',
                    'created_at',
                    'updated_at'
                );

            if (!about) return null;

            return transformAbout(about);
        }, { 
            ttl: 300, // 5 minutes
            tags: ['about', `about:slug:${slug}`] 
        });
    } catch (error) {
        console.error('getAboutBySlug error:', error);
        throw error;
    }
}

export async function getAboutById(id: number): Promise<AboutWithRelations | null> {
    const key = `about:id:${id}`;
    
    try {
        return await cache.dedupe<AboutWithRelations | null>(key, async () => {
            const knex = await db();

            const about = await knex('webcontrol')
                .where('id', id)
                .where('status', 1)
                .first()
                .select(
                    'id',
                    'title',
                    'slug',
                    'heading',
                    'imageurl',
                    'descriptions',
                    'descriptions_other',
                    'enable_modules',
                    'seo_title',
                    'seo_keywork',
                    'seo_description',
                    'status',
                    'created_at',
                    'updated_at'
                );

            if (!about) return null;

            return transformAbout(about);
        }, { 
            ttl: 300, // 5 minutes
            tags: ['about', `about:id:${id}`] 
        });
    } catch (error) {
        console.error('getAboutById error:', error);
        throw error;
    }
}

export async function getAboutUs(): Promise<AboutWithRelations | null> {
    return getAboutBySlug('about-us');
}

export async function getHomeAbout(): Promise<AboutWithRelations | null> {
    return getAboutBySlug('home');
}

export async function getAboutPages(): Promise<AboutWithRelations[]> {
    const key = 'about:pages';
    
    try {
        return await cache.dedupe<AboutWithRelations[]>(key, async () => {
            const knex = await db();

            const pages = await knex('webcontrol')
                .where('status', 1)
                .select(
                    'id',
                    'title',
                    'slug',
                    'heading',
                    'imageurl',
                    'descriptions',
                    'descriptions_other',
                    'enable_modules',
                    'seo_title',
                    'seo_keywork',
                    'seo_description',
                    'status',
                    'created_at',
                    'updated_at'
                )
                .orderBy('id', 'asc');

            return pages.map(transformAbout);
        }, { 
            ttl: 300, // 5 minutes
            tags: ['about', 'about:pages'] 
        });
    } catch (error) {
        console.error('getAboutPages error:', error);
        throw error;
    }
}

export async function getAboutStatistics() {
    const key = 'about:statistics';
    
    try {
        return await cache.dedupe(key, async () => {
            const knex = await db();

            const [totalResult, activeResult] = await Promise.all([
                knex('webcontrol').count('* as total').first(),
                knex('webcontrol').where('status', 1).count('* as active').first(),
            ]);

            return {
                total: Number(totalResult?.total || 0),
                active: Number(activeResult?.active || 0),
                inactive: Number(totalResult?.total || 0) - Number(activeResult?.active || 0),
            };
        }, { 
            ttl: 60, // 1 minute for statistics
            tags: ['about', 'about:statistics'] 
        });
    } catch (error) {
        console.error('getAboutStatistics error:', error);
        throw error;
    }
}

// ─── WRITE OPERATIONS WITH CACHE INVALIDATION ────────────────────────

export async function updateAbout(
    id: number,
    data: Partial<About>
): Promise<AboutWithRelations> {
    const knex = await db();

    // Get existing record to know old slug
    const existing = await knex('webcontrol')
        .where('id', id)
        .first()
        .select('id', 'slug');

    if (!existing) {
        throw new Error('About page not found');
    }

    const oldSlug = existing.slug;
    const newSlug = data.slug ?? oldSlug;

    await knex('webcontrol')
        .where('id', id)
        .update({
            ...data,
            updated_at: new Date(),
        });

    // ✅ INVALIDATE CACHE
    // 1. Delete by ID
    await cache.del(`about:id:${id}`);
    
    // 2. Delete by old slug (if changed)
    if (oldSlug !== newSlug) {
        await cache.del(`about:slug:${oldSlug}`);
    }
    
    // 3. Delete by new slug
    await cache.del(`about:slug:${newSlug}`);
    
    // 4. Delete pages list cache
    await cache.del('about:pages');
    
    // 5. Delete statistics cache (in case status changed)
    await cache.del('about:statistics');

    // Fetch fresh data (will be cached automatically by getAboutById)
    const about = await getAboutById(id);
    if (!about) throw new Error('About page not found after update');
    
    return about;
}

// Optional: Add a function to manually clear all about cache if needed
export async function clearAboutCache(): Promise<void> {
    await cache.delPattern('about:*');
}