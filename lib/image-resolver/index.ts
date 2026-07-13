export const UPLOAD_BASE_URL = 'https://acasa.ae/upload';

const IMAGE_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.avif'];

const PROPERTY_IMAGE_DIRS = [
    'media',
    'media/thumbnail',
    'media/medium',
    'properties',
    'property',
    'thumbnail',
    'thumbnails',
    'gallery',
    'uploads/properties',
    'uploads/property',
];

const PROJECT_IMAGE_DIRS = [
    'media',
    'media/thumbnail',
    'media/medium',
    'projects',
    'project',
    'project_gallery',
    'project-gallery',
    'gallery',
    'project_media',
    'project-media',
    'upload/projects',
    'upload/project',
    'uploads/projects',
    'uploads/project',
];

const PROJECT_GALLERY_DIRS = [
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

const PROJECT_LOGO_DIRS = [
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

const DEVELOPER_IMAGE_DIRS = [
    'developers',
    'developer',
    'media',
    'logos',
    'uploads/developers',
    'uploads/developer',
];

const USER_IMAGE_DIRS = [
    'members',
    'member',
    'users',
    'user',
    'uploads/members',
    'uploads/users',
    'media/members',
    'media/users',
];

const COMMUNITY_IMAGE_DIRS = [
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

const AGENT_IMAGE_DIRS = [
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

const BLOG_IMAGE_DIRS = [
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

const TESTIMONIAL_IMAGE_DIRS = [
    'testimonials',
    'testimonial',
    'media',
    'uploads/testimonials',
    'media/testimonials',
];

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

function buildCandidates(rawPath: string | null, dirs: string[]): string[] {
    if (!rawPath) return [];

    const original = rawPath.trim();
    if (!original) return [];

    if (isFullUrl(original)) return [original];

    const clean = stripUploadPrefix(original);
    if (!clean) return [];

    const alreadyHasFolder = clean.includes('/');
    const alreadyHasExt = hasExtension(clean);
    const candidates: string[] = [];

    if (alreadyHasFolder) {
        if (alreadyHasExt) {
            candidates.push(`${UPLOAD_BASE_URL}/${clean}`);
        } else {
            for (const ext of IMAGE_EXTENSIONS) {
                candidates.push(`${UPLOAD_BASE_URL}/${clean}${ext}`);
            }
        }
        return uniqueStrings(candidates);
    }

    if (alreadyHasExt) {
        for (const dir of dirs) {
            candidates.push(`${UPLOAD_BASE_URL}/${dir}/${clean}`);
        }
        candidates.push(`${UPLOAD_BASE_URL}/${clean}`);
    } else {
        for (const dir of dirs) {
            for (const ext of IMAGE_EXTENSIONS) {
                candidates.push(`${UPLOAD_BASE_URL}/${dir}/${clean}${ext}`);
            }
        }
        for (const ext of IMAGE_EXTENSIONS) {
            candidates.push(`${UPLOAD_BASE_URL}/${clean}${ext}`);
        }
    }

    return uniqueStrings(candidates);
}

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

export function getDeveloperLogoUrl(image: string | null, developerId?: number): string[] {
    const urls = buildCandidates(image, DEVELOPER_IMAGE_DIRS);
    return urls.length ? urls : [`${UPLOAD_BASE_URL}/no-image.png`];
}

export function getPropertyImageCandidates(rawPath: string | null): string[] {
    return buildCandidates(rawPath, PROPERTY_IMAGE_DIRS);
}

export function getImageUrlVariations(filename: string | null): string[] {
    const urls = getPropertyImageCandidates(filename);
    return urls.length ? urls : [`${UPLOAD_BASE_URL}/no-image.png`];
}

export function getImageUrl(filename: string | null): string {
    const urls = getPropertyImageCandidates(filename);
    return urls[0] || `${UPLOAD_BASE_URL}/no-image.png`;
}

export function getFeaturedImage(featuredImage: string | null, galleryPaths: string[] = []): string {
    const featuredCandidates = getPropertyImageCandidates(featuredImage);
    if (featuredCandidates.length > 0) return featuredCandidates[0];
    if (galleryPaths.length > 0) return galleryPaths[0];
    return `${UPLOAD_BASE_URL}/no-image.png`;
}

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

export function getProjectImageWithSize(rawPath: string | null, size: 'thumbnail' | 'medium' | 'large' | 'original' = 'original'): string {
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

export function getProjectGalleryImages(galleryRecords: { Url: string | null }[]): string[] {
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

export function getProjectFeaturedImage(featuredImage: string | null, galleryPaths: string[] = []): string {
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

export function getProjectMediaImageUrl(path: string | null): string {
    const urls = getProjectImageCandidates(path);
    return urls[0] || `${UPLOAD_BASE_URL}/no-image.png`;
}

export function resolveProjectImages(imagePaths: (string | null)[]): { urls: string[]; valid: string[]; invalid: number } {
    const urls = imagePaths.map((path) => getProjectImageUrl(path));
    const valid = urls.filter((url) => !url.includes('no-image'));
    const invalid = urls.length - valid.length;
    return { urls, valid, invalid };
}

export function isProjectImageValid(imageUrl: string): boolean {
    return !imageUrl.includes('no-image');
}

export function getUserPhotoUrl(photo: string | null, userId?: number): string[] {
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

export function getCommunityImageUrl(image: string | null, communityId?: number): string[] {
    if (image) {
        const clean = stripUploadPrefix(image);
        if (clean) {
            const urls = [
                `${UPLOAD_BASE_URL}/locations/${clean}`,
                `${UPLOAD_BASE_URL}/locations/medium/${clean}`,
                `${UPLOAD_BASE_URL}/locations/menu/${clean}`,
                `${UPLOAD_BASE_URL}/locations/thumbnail/${clean}`,
            ];
            const validUrls = urls.filter(url => !url.includes('null') && !url.includes('undefined'));
            if (validUrls.length > 0) {
                return validUrls;
            }
        }
    }
    const urls = buildCandidates(image, COMMUNITY_IMAGE_DIRS);
    return urls.length ? urls : [`${UPLOAD_BASE_URL}/no-image.png`];
}

export function getCommunityImageCandidates(rawPath: string | null): string[] {
    if (rawPath) {
        const clean = stripUploadPrefix(rawPath);
        if (clean) {
            const urls = [
                `${UPLOAD_BASE_URL}/locations/${clean}`,
                `${UPLOAD_BASE_URL}/locations/medium/${clean}`,
                `${UPLOAD_BASE_URL}/locations/menu/${clean}`,
                `${UPLOAD_BASE_URL}/locations/thumbnail/${clean}`,
            ];
            const validUrls = urls.filter(url => !url.includes('null') && !url.includes('undefined'));
            if (validUrls.length > 0) {
                return validUrls;
            }
        }
    }
    return buildCandidates(rawPath, COMMUNITY_IMAGE_DIRS);
}

export function getCommunityImageVariations(filename: string | null): string[] {
    const urls = getCommunityImageCandidates(filename);
    return urls.length ? urls : [`${UPLOAD_BASE_URL}/no-image.png`];
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

export function getMediaImageUrl(path: string | null): string {
    if (!path) return `${UPLOAD_BASE_URL}/no-image.png`;

    const cleanPath = path
        .replace(/^upload\//i, '')
        .replace(/^\/+/, '');

    if (cleanPath.includes('/')) {
        return `${UPLOAD_BASE_URL}/${cleanPath}`;
    }

    return `${UPLOAD_BASE_URL}/media/${cleanPath}`;
}

export function getMediaImageUrls(paths: (string | null)[]): string[] {
    return uniqueStrings(
        paths
            .map((path) => getMediaImageUrl(path))
            .filter((url) => !!url && !url.includes('no-image'))
    );
}

export function getGalleryImages(mediaRecords: { path: string | null }[]): string[] {
    return uniqueStrings(
        mediaRecords
            .map((record) => getMediaImageUrl(record.path))
            .filter((url) => !!url && !url.includes('no-image'))
    );
}

export function getTestimonialImageCandidates(rawPath: string | null): string[] {
    return buildCandidates(rawPath, TESTIMONIAL_IMAGE_DIRS);
}

export function getTestimonialImageUrl(filename: string | null): string {
    const urls = getTestimonialImageCandidates(filename);
    return urls[0] || `${UPLOAD_BASE_URL}/no-image.png`;
}

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

export function extractImageUrls(data: any[], pathKey: string = 'image', idKey: string = 'id'): { [key: string]: string } {
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

// Legacy aliases
export const getProjectGalleryImage = getProjectGalleryImageUrl;
export const getProjectLogo = getProjectLogoUrl;
export const getDeveloperImage = getDeveloperImageUrl;
export const getCommunityImage = getCommunityImageUrl;
export const getAgentImage = getAgentImageUrl;

export default {
    UPLOAD_BASE_URL,
    IMAGE_EXTENSIONS,
    getDeveloperImageCandidates,
    getDeveloperImageUrl,
    getDeveloperImageVariations,
    getDeveloperLogoUrl,
    getPropertyImageCandidates,
    getImageUrlVariations,
    getImageUrl,
    getFeaturedImage,
    getProjectImageCandidates,
    getProjectImageUrl,
    getProjectImageVariations,
    getProjectImageWithSize,
    getProjectGalleryImageCandidates,
    getProjectGalleryImageUrl,
    getProjectGalleryImages,
    getProjectLogoCandidates,
    getProjectLogoUrl,
    getProjectFeaturedImage,
    buildProjectImageSet,
    getProjectMediaImageUrl,
    resolveProjectImages,
    isProjectImageValid,
    getUserPhotoUrl,
    getUserImageCandidates,
    getUserImageUrl,
    getCommunityImageUrl,
    getCommunityImageCandidates,
    getCommunityImageVariations,
    getAgentImageCandidates,
    getAgentImageUrl,
    getAgentImageVariations,
    getBlogImageCandidates,
    getBlogImageUrl,
    getBlogImageVariations,
    getMediaImageUrl,
    getMediaImageUrls,
    getGalleryImages,
    getTestimonialImageCandidates,
    getTestimonialImageUrl,
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
};