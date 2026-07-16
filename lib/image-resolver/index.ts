// ============================================================
// COMPLETE IMAGE RESOLVER - FIXED VERSION
// ============================================================

export const UPLOAD_BASE_URL = 'https://acasa.ae/upload';

export const IMAGE_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.avif'];

export const PROPERTY_IMAGE_DIRS = [
    'media',
    'properties',
    'property',
    'thumbnail',
    'thumbnails',
    'gallery',
    'uploads/properties',
    'uploads/property',
];

export const PROJECT_IMAGE_DIRS = [
    'media',
    'projects',
    'project',
    'project_gallery',
    'project-gallery',
    'gallery',
    'upload/projects',
    'upload/project',
    'uploads/projects',
    'uploads/project',
];

export const PROJECT_GALLERY_DIRS = [
    'project_gallery',
    'project-gallery',
    'gallery',
    'projects',
    'project',
    'media',
    'media/gallery',
    'uploads/projects/gallery',
    'uploads/project/gallery',
];

export const PROJECT_LOGO_DIRS = [
    'projects',
    'project',
    'developers',
    'developer',
    'media',
    'logos',
    'uploads/projects',
    'uploads/project',
    'uploads/developers',
];

export const DEVELOPER_IMAGE_DIRS = [
    'developers',
    'developer',
    'media',
    'logos',
    'uploads/developers',
    'uploads/developer',
];

export const USER_IMAGE_DIRS = [
    'members',
    'member',
    'users',
    'user',
    'uploads/members',
    'uploads/users',
    'media/members',
    'media/users',
];

export const COMMUNITY_IMAGE_DIRS = [
    'locations',
    'locations/medium',
    'locations/menu',
    'locations/thumbnail',
    'communities',
    'community',
    'uploads/communities',
    'uploads/community',
    'media/communities',
    'media/community',
    'media',
    'media/thumbnail',
];

export const AGENT_IMAGE_DIRS = [
    'agents',
    'agent',
    'users',
    'user',
    'members',
    'member',
    'uploads/agents',
    'uploads/users',
    'uploads/members',
    'media/agents',
    'media/users',
];

export const BLOG_IMAGE_DIRS = [
    'blogs',
    'blog',
    'posts',
    'articles',
    'media',
    'media/thumbnail',
    'uploads/blogs',
    'uploads/blog',
    'uploads/posts',
    'media/blogs',
    'media/posts',
    'upload/blogs',
    'upload/blog',
];

export const TESTIMONIAL_IMAGE_DIRS = [
    'testimonials',
    'testimonial',
    'media',
    'uploads/testimonials',
    'media/testimonials',
];

// ─── HELPERS ──────────────────────────────────────────────────────────────

function cleanFilename(filename: string): string {
    return filename.replace(/\\/g, '/').trim().replace(/^\/+/, '');
}

function hasExtension(filename: string): boolean {
    return /\.(webp|jpg|jpeg|png|gif|svg|avif)$/i.test(filename);
}

function isFullUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
}

function stripUploadPrefix(value: string): string {
    return cleanFilename(value)
        .replace(/^upload\//i, '')
        .replace(/^\/+/, '');
}

function uniqueStrings(values: string[]): string[] {
    return [...new Set(values.filter(Boolean))];
}

function isInvalidValue(value: string): boolean {
    const lower = value.toLowerCase().trim();
    return (
        lower === 'null' ||
        lower === 'undefined' ||
        lower === 'NULL' ||
        lower === '' ||
        lower === 'no-image' ||
        lower === 'none'
    );
}

// ─── CORE CANDIDATE BUILDER ───────────────────────────────────────────────

function buildCandidates(rawPath: string | null, dirs: string[]): string[] {
    if (!rawPath) return [];

    const original = rawPath.trim();
    if (!original) return [];

    // Already full URL
    if (isFullUrl(original)) return [original];

    const clean = stripUploadPrefix(original);
    if (!clean) return [];

    // Invalid string check
    if (isInvalidValue(clean)) return [];

    const alreadyHasFolder = clean.includes('/');
    const alreadyHasExt = hasExtension(clean);
    const candidates: string[] = [];

    if (alreadyHasFolder) {
        if (alreadyHasExt) {
            // Exact path with extension — direct use
            candidates.push(`${UPLOAD_BASE_URL}/${clean}`);
        } else {
            // Has folder but no extension — try all extensions
            for (const ext of IMAGE_EXTENSIONS) {
                candidates.push(`${UPLOAD_BASE_URL}/${clean}${ext}`);
            }
        }
        return uniqueStrings(candidates);
    }

    // No folder in path
    if (alreadyHasExt) {
        // Has extension but no folder — try all dirs
        for (const dir of dirs) {
            candidates.push(`${UPLOAD_BASE_URL}/${dir}/${clean}`);
        }
        // Also try root
        candidates.push(`${UPLOAD_BASE_URL}/${clean}`);
    } else {
        // ✅ No folder, no extension — try all dirs + all extensions
        // webp first (most common modern format)
        for (const dir of dirs) {
            for (const ext of IMAGE_EXTENSIONS) {
                candidates.push(`${UPLOAD_BASE_URL}/${dir}/${clean}${ext}`);
            }
        }
        // Also try root with extensions
        for (const ext of IMAGE_EXTENSIONS) {
            candidates.push(`${UPLOAD_BASE_URL}/${clean}${ext}`);
        }
    }

    return uniqueStrings(candidates);
}

// ─── THUMB URL BUILDER ───────────────────────────────────────────────────

function buildThumbUrl(filename: string | null, dirs: string[]): string {
    if (!filename) return `${UPLOAD_BASE_URL}/no-image.png`;

    const original = filename.trim();
    if (!original) return `${UPLOAD_BASE_URL}/no-image.png`;

    if (isFullUrl(original)) return original;

    const clean = stripUploadPrefix(original);
    if (!clean || isInvalidValue(clean)) return `${UPLOAD_BASE_URL}/no-image.png`;

    const primaryDir = dirs[0];

    if (clean.includes('/')) {
        // Has folder path
        const parts = clean.split('/');
        const basename = parts[parts.length - 1];
        const folder = parts.slice(0, -1).join('/');

        if (hasExtension(basename)) {
            return `${UPLOAD_BASE_URL}/${folder}/thumb_${basename}`;
        }
        return `${UPLOAD_BASE_URL}/${folder}/thumb_${basename}.webp`;
    }

    // No folder
    if (hasExtension(clean)) {
        return `${UPLOAD_BASE_URL}/${primaryDir}/thumb_${clean}`;
    }

    // ✅ No extension — add .webp (most common)
    return `${UPLOAD_BASE_URL}/${primaryDir}/thumb_${clean}.webp`;
}

// ─── PROPERTY IMAGES ─────────────────────────────────────────────────────

export function getPropertyImageCandidates(rawPath: string | null): string[] {
    return buildCandidates(rawPath, PROPERTY_IMAGE_DIRS);
}

export function getImageUrl(filename: string | null): string {
    const urls = getPropertyImageCandidates(filename);
    return urls[0] || `${UPLOAD_BASE_URL}/no-image.png`;
}

export function getImageUrlVariations(filename: string | null): string[] {
    const urls = getPropertyImageCandidates(filename);
    return urls.length ? urls : [`${UPLOAD_BASE_URL}/no-image.png`];
}

export function getImageThumbUrl(filename: string | null): string {
    return buildThumbUrl(filename, PROPERTY_IMAGE_DIRS);
}

export function getFeaturedImage(
    featuredImage: string | null,
    galleryPaths: string[] = []
): string {
    const featuredCandidates = getPropertyImageCandidates(featuredImage);
    if (featuredCandidates.length > 0) return featuredCandidates[0];
    if (galleryPaths.length > 0) return galleryPaths[0];
    return `${UPLOAD_BASE_URL}/no-image.png`;
}

// ─── DEVELOPER IMAGES ────────────────────────────────────────────────────

export function getDeveloperImageCandidates(rawPath: string | null): string[] {
    return buildCandidates(rawPath, DEVELOPER_IMAGE_DIRS);
}

export function getDeveloperImageUrl(filename: string | null): string {
    const urls = getDeveloperImageCandidates(filename);
    return urls[0] || `${UPLOAD_BASE_URL}/no-image.png`;
}

export function getDeveloperImageVariations(filename: string | null): string[] {
    const urls = getDeveloperImageCandidates(filename);
    return urls.length ? urls : [`${UPLOAD_BASE_URL}/no-image.png`];
}

export function getDeveloperImageThumb(filename: string | null): string {
    return buildThumbUrl(filename, DEVELOPER_IMAGE_DIRS);
}

export function getDeveloperLogoUrl(
    image: string | null,
    developerId?: number
): string[] {
    const urls = buildCandidates(image, DEVELOPER_IMAGE_DIRS);
    return urls.length ? urls : [`${UPLOAD_BASE_URL}/no-image.png`];
}

// ─── PROJECT IMAGES ──────────────────────────────────────────────────────

export function getProjectImageCandidates(rawPath: string | null): string[] {
    return buildCandidates(rawPath, PROJECT_IMAGE_DIRS);
}

export function getProjectImageUrl(filename: string | null): string {
    const urls = getProjectImageCandidates(filename);
    return urls[0] || `${UPLOAD_BASE_URL}/no-image.png`;
}

export function getProjectImageVariations(filename: string | null): string[] {
    const urls = getProjectImageCandidates(filename);
    return urls.length ? urls : [`${UPLOAD_BASE_URL}/no-image.png`];
}

export function getProjectImageThumb(filename: string | null): string {
    return buildThumbUrl(filename, PROJECT_IMAGE_DIRS);
}

export function getProjectImageWithSize(
    rawPath: string | null,
    size: 'thumbnail' | 'medium' | 'large' | 'original' = 'original'
): string {
    const baseUrl = getProjectImageUrl(rawPath);
    if (baseUrl.includes('no-image')) return baseUrl;
    if (size === 'original') return baseUrl;

    const sizeDirs: Record<string, string[]> = {
        thumbnail: ['media/thumbnail', 'thumbnail', 'thumbnails'],
        medium: ['media/medium', 'medium'],
        large: ['media/large', 'large'],
    };

    const dirs = sizeDirs[size] || [];
    const candidates = buildCandidates(rawPath, dirs);
    return candidates[0] || baseUrl;
}

export function getProjectGalleryImageCandidates(rawPath: string | null): string[] {
    return buildCandidates(rawPath, PROJECT_GALLERY_DIRS);
}

export function getProjectGalleryImageUrl(filename: string | null): string {
    const urls = getProjectGalleryImageCandidates(filename);
    return urls[0] || `${UPLOAD_BASE_URL}/no-image.png`;
}

export function getProjectGalleryImages(
    galleryRecords: { Url: string | null }[]
): string[] {
    return uniqueStrings(
        galleryRecords
            .map((record) => getProjectGalleryImageUrl(record.Url))
            .filter((url) => !!url && !url.includes('no-image'))
    );
}

export function getProjectLogoCandidates(rawPath: string | null): string[] {
    return buildCandidates(rawPath, PROJECT_LOGO_DIRS);
}

export function getProjectLogoUrl(filename: string | null): string {
    const urls = getProjectLogoCandidates(filename);
    return urls[0] || `${UPLOAD_BASE_URL}/no-image.png`;
}

export function getProjectFeaturedImage(
    featuredImage: string | null,
    galleryPaths: string[] = []
): string {
    const featuredCandidates = getProjectImageCandidates(featuredImage);
    if (featuredCandidates.length > 0) return featuredCandidates[0];

    if (galleryPaths.length > 0) {
        const galleryUrl = getProjectGalleryImageUrl(galleryPaths[0]);
        if (!galleryUrl.includes('no-image')) return galleryUrl;
    }

    return `${UPLOAD_BASE_URL}/no-image.png`;
}

export function buildProjectImageSet(params: {
    featuredImage?: string | null;
    logoUrl?: string | null;
    galleryPaths?: string[];
}): {
    featured: string;
    logo: string;
    gallery: string[];
    variations: string[];
    candidates: string[];
} {
    const { featuredImage, logoUrl, galleryPaths = [] } = params;

    const featured = getProjectFeaturedImage(featuredImage ?? null, galleryPaths);
    const logo = getProjectLogoUrl(logoUrl ?? null);

    const gallery = uniqueStrings(
        galleryPaths
            .map((path) => getProjectGalleryImageUrl(path))
            .filter((url) => !url.includes('no-image'))
    );

    const allPaths = [featuredImage, logoUrl, ...galleryPaths].filter(
        (p): p is string => !!p
    );

    const candidates = uniqueStrings(
        allPaths.flatMap((path) => getProjectImageCandidates(path))
    );

    return {
        featured,
        logo,
        gallery: gallery.length ? gallery : [featured],
        variations: candidates.length ? candidates : [featured],
        candidates,
    };
}

// ─── USER / AGENT IMAGES ────────────────────────────────────────────────

export function getUserPhotoUrl(
    photo: string | null,
    userId?: number
): string[] {
    const urls = buildCandidates(photo, USER_IMAGE_DIRS);
    return urls.length ? urls : [`${UPLOAD_BASE_URL}/no-image.png`];
}

export function getUserImageCandidates(rawPath: string | null): string[] {
    return buildCandidates(rawPath, USER_IMAGE_DIRS);
}

export function getUserImageUrl(filename: string | null): string {
    const urls = getUserImageCandidates(filename);
    return urls[0] || `${UPLOAD_BASE_URL}/no-image.png`;
}

export function getUserImageThumb(filename: string | null): string {
    return buildThumbUrl(filename, USER_IMAGE_DIRS);
}

export function getAgentImageCandidates(rawPath: string | null): string[] {
    return buildCandidates(rawPath, AGENT_IMAGE_DIRS);
}

export function getAgentImageUrl(filename: string | null): string {
    const urls = getAgentImageCandidates(filename);
    return urls[0] || `${UPLOAD_BASE_URL}/no-image.png`;
}

export function getAgentImageVariations(filename: string | null): string[] {
    const urls = getAgentImageCandidates(filename);
    return urls.length ? urls : [`${UPLOAD_BASE_URL}/no-image.png`];
}

export function getAgentImageThumb(filename: string | null): string {
    return buildThumbUrl(filename, AGENT_IMAGE_DIRS);
}

// ─── COMMUNITY IMAGES ────────────────────────────────────────────────────

export function getCommunityImageUrl(
    image: string | null,
    communityId?: number
): string[] {
    if (image) {
        const clean = stripUploadPrefix(image);
        if (clean && !isInvalidValue(clean)) {
            const urls = [
                `${UPLOAD_BASE_URL}/locations/${clean}`,
                `${UPLOAD_BASE_URL}/locations/medium/${clean}`,
                `${UPLOAD_BASE_URL}/locations/menu/${clean}`,
                `${UPLOAD_BASE_URL}/locations/thumbnail/${clean}`,
            ].filter(
                (url) =>
                    !url.includes('null') && !url.includes('undefined')
            );

            if (urls.length > 0) return urls;
        }
    }

    const urls = buildCandidates(image, COMMUNITY_IMAGE_DIRS);
    return urls.length ? urls : [`${UPLOAD_BASE_URL}/no-image.png`];
}

export function getCommunityImageCandidates(rawPath: string | null): string[] {
    if (rawPath) {
        const clean = stripUploadPrefix(rawPath);
        if (clean && !isInvalidValue(clean)) {
            const urls = [
                `${UPLOAD_BASE_URL}/locations/${clean}`,
                `${UPLOAD_BASE_URL}/locations/medium/${clean}`,
                `${UPLOAD_BASE_URL}/locations/menu/${clean}`,
                `${UPLOAD_BASE_URL}/locations/thumbnail/${clean}`,
            ].filter(
                (url) =>
                    !url.includes('null') && !url.includes('undefined')
            );

            if (urls.length > 0) return urls;
        }
    }

    return buildCandidates(rawPath, COMMUNITY_IMAGE_DIRS);
}

export function getCommunityImageVariations(filename: string | null): string[] {
    const urls = getCommunityImageCandidates(filename);
    return urls.length ? urls : [`${UPLOAD_BASE_URL}/no-image.png`];
}

// ─── BLOG IMAGES ─────────────────────────────────────────────────────────

export function getBlogImageCandidates(rawPath: string | null): string[] {
    return buildCandidates(rawPath, BLOG_IMAGE_DIRS);
}

export function getBlogImageUrl(filename: string | null): string {
    const urls = getBlogImageCandidates(filename);
    return urls[0] || `${UPLOAD_BASE_URL}/no-image.png`;
}

export function getBlogImageVariations(filename: string | null): string[] {
    const urls = getBlogImageCandidates(filename);
    return urls.length ? urls : [`${UPLOAD_BASE_URL}/no-image.png`];
}

export function getBlogImageThumb(filename: string | null): string {
    return buildThumbUrl(filename, BLOG_IMAGE_DIRS);
}

// ─── MEDIA / GALLERY ────────────────────────────────────────────────────

export function getMediaImageUrl(path: string | null): string {
    if (!path) return `${UPLOAD_BASE_URL}/no-image.png`;

    const cleanPath = path
        .replace(/^upload\//i, '')
        .replace(/^\/+/, '')
        .trim();

    if (!cleanPath || isInvalidValue(cleanPath)) {
        return `${UPLOAD_BASE_URL}/no-image.png`;
    }

    if (isFullUrl(path)) return path;

    // Already has directory structure
    if (cleanPath.includes('/')) {
        return `${UPLOAD_BASE_URL}/${cleanPath}`;
    }

    // Has extension
    if (/\.(webp|jpg|jpeg|png|gif|svg|avif)$/i.test(cleanPath)) {
        return `${UPLOAD_BASE_URL}/media/${cleanPath}`;
    }

    // No extension — add .webp
    return `${UPLOAD_BASE_URL}/media/${cleanPath}.webp`;
}

export function getMediaImageUrls(paths: (string | null)[]): string[] {
    return uniqueStrings(
        paths
            .map((path) => getMediaImageUrl(path))
            .filter((url) => !!url && !url.includes('no-image'))
    );
}

export function getGalleryImages(
    mediaRecords: { path: string | null }[]
): string[] {
    return uniqueStrings(
        mediaRecords
            .map((record) => getMediaImageUrl(record.path))
            .filter((url) => !!url && !url.includes('no-image'))
    );
}

// ─── TESTIMONIAL IMAGES ────────────────────────────────────────────────

export function getTestimonialImageCandidates(rawPath: string | null): string[] {
    return buildCandidates(rawPath, TESTIMONIAL_IMAGE_DIRS);
}

export function getTestimonialImageUrl(filename: string | null): string {
    const urls = getTestimonialImageCandidates(filename);
    return urls[0] || `${UPLOAD_BASE_URL}/no-image.png`;
}

export function getTestimonialImageThumb(filename: string | null): string {
    return buildThumbUrl(filename, TESTIMONIAL_IMAGE_DIRS);
}

// ─── UTILITY FUNCTIONS ──────────────────────────────────────────────────

export function getNoImageUrl(): string {
    return `${UPLOAD_BASE_URL}/no-image.png`;
}

export function isValidImageUrl(url: string): boolean {
    return !url.includes('no-image') && url.startsWith('http');
}

export function getImageExtension(filename: string): string {
    const match = filename.match(/\.([^.]+)$/);
    return match ? match[1] : '';
}

export function getImageBasename(filename: string): string {
    const clean = cleanFilename(filename);
    const parts = clean.split('/');
    return parts[parts.length - 1] || '';
}

export function getImagePathWithoutExtension(filename: string): string {
    const basename = getImageBasename(filename);
    const lastDot = basename.lastIndexOf('.');
    return lastDot > 0 ? basename.substring(0, lastDot) : basename;
}

export function getImageDirectory(filename: string): string {
    const clean = cleanFilename(filename);
    const parts = clean.split('/');
    if (parts.length > 1) {
        return parts.slice(0, -1).join('/');
    }
    return '';
}

export function buildImageUrl(directory: string, filename: string): string {
    const cleanDir = directory.replace(/^\/+|\/+$/g, '');
    const cleanFile = cleanFilename(filename);
    return `${UPLOAD_BASE_URL}/${cleanDir ? cleanDir + '/' : ''}${cleanFile}`;
}

export function processImageBatch(
    items: { image?: string | null; id?: string | number }[],
    getImageFn: (path: string | null) => string
): Map<string | number, string> {
    const result = new Map<string | number, string>();

    for (const item of items) {
        if (item.id !== undefined && item.id !== null) {
            result.set(item.id, getImageFn(item.image || null));
        }
    }

    return result;
}

export function extractImageUrls(
    data: any[],
    pathKey: string = 'image',
    idKey: string = 'id'
): { [key: string]: string } {
    const result: { [key: string]: string } = {};

    for (const item of data) {
        const id = item[idKey];
        const path = item[pathKey];
        if (id && path) {
            const url = getImageUrl(path);
            if (!url.includes('no-image')) {
                result[id] = url;
            }
        }
    }

    return result;
}

export function validateImagePath(path: string | null): boolean {
    if (!path) return false;
    const trimmed = path.trim();
    if (!trimmed) return false;

    const dangerousPatterns = ['../', '..\\', '/etc/', '\\etc\\'];
    for (const pattern of dangerousPatterns) {
        if (trimmed.includes(pattern)) return false;
    }

    const validChars = /^[a-zA-Z0-9\-_.\/]+$/;
    if (!validChars.test(trimmed)) return false;

    return true;
}

export function sanitizeImagePath(path: string): string {
    return path
        .replace(/[^a-zA-Z0-9\-_.\/]/g, '')
        .replace(/\/+/g, '/')
        .replace(/^\/+/, '')
        .trim();
}

// ─── LEGACY ALIASES ─────────────────────────────────────────────────────

export const getProjectGalleryImage = getProjectGalleryImageUrl;
export const getProjectLogo = getProjectLogoUrl;
export const getDeveloperImage = getDeveloperImageUrl;
export const getCommunityImage = getCommunityImageUrl;
export const getAgentImage = getAgentImageUrl;

// ─── DEFAULT EXPORT ─────────────────────────────────────────────────────

export default {
    UPLOAD_BASE_URL,
    IMAGE_EXTENSIONS,
    PROPERTY_IMAGE_DIRS,
    PROJECT_IMAGE_DIRS,
    PROJECT_GALLERY_DIRS,
    PROJECT_LOGO_DIRS,
    DEVELOPER_IMAGE_DIRS,
    USER_IMAGE_DIRS,
    COMMUNITY_IMAGE_DIRS,
    AGENT_IMAGE_DIRS,
    BLOG_IMAGE_DIRS,
    TESTIMONIAL_IMAGE_DIRS,

    getPropertyImageCandidates,
    getImageUrl,
    getImageUrlVariations,
    getImageThumbUrl,
    getFeaturedImage,

    getDeveloperImageCandidates,
    getDeveloperImageUrl,
    getDeveloperImageVariations,
    getDeveloperImageThumb,
    getDeveloperLogoUrl,

    getProjectImageCandidates,
    getProjectImageUrl,
    getProjectImageVariations,
    getProjectImageThumb,
    getProjectImageWithSize,
    getProjectGalleryImageCandidates,
    getProjectGalleryImageUrl,
    getProjectGalleryImages,
    getProjectLogoCandidates,
    getProjectLogoUrl,
    getProjectFeaturedImage,
    buildProjectImageSet,

    getUserPhotoUrl,
    getUserImageCandidates,
    getUserImageUrl,
    getUserImageThumb,
    getAgentImageCandidates,
    getAgentImageUrl,
    getAgentImageVariations,
    getAgentImageThumb,

    getCommunityImageUrl,
    getCommunityImageCandidates,
    getCommunityImageVariations,

    getBlogImageCandidates,
    getBlogImageUrl,
    getBlogImageVariations,
    getBlogImageThumb,

    getMediaImageUrl,
    getMediaImageUrls,
    getGalleryImages,

    getTestimonialImageCandidates,
    getTestimonialImageUrl,
    getTestimonialImageThumb,

    getNoImageUrl,
    isValidImageUrl,
    getImageExtension,
    getImageBasename,
    getImagePathWithoutExtension,
    getImageDirectory,
    buildImageUrl,
    processImageBatch,
    extractImageUrls,
    validateImagePath,
    sanitizeImagePath,

    getProjectGalleryImage,
    getProjectLogo,
    getDeveloperImage,
    getCommunityImage,
    getAgentImage,
};