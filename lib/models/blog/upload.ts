// lib/models/blog/upload.ts

import { db } from '@/lib/database';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// ─── TYPES ─────────────────────────────────────────────────────────────
export interface BlogUpload {
    id: number;
    filename: string;
    original_name: string;
    url: string;
    full_url: string;
    size: number;
    size_kb: number;
    mime_type: string;
    blog_id?: number | null;     // Kis blog se linked hai
    uploaded_by?: string | null; // Kaun sa admin
    is_used: boolean;            // Blog mein use hua ya nahi
    created_at?: Date | string;
}

export interface UploadFileOptions {
    file: File;
    uploadedBy?: string;
    blogId?: number;
}

export interface UploadResult {
    filename: string;
    original_name: string;
    url: string;
    full_url: string;
    size: number;
    size_kb: number;
    mime_type: string;
}

// ─── CONFIG ────────────────────────────────────────────────────────────
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'upload', 'blogs');
const PUBLIC_URL_BASE = '/upload/blogs';

// ─── VALIDATION ────────────────────────────────────────────────────────
export function validateFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid type: ${file.type}. Allowed: jpg, png, webp, gif`,
        };
    }

    if (file.size > MAX_SIZE_BYTES) {
        return {
            valid: false,
            error: `File too large. Max ${MAX_SIZE_MB}MB`,
        };
    }

    return { valid: true };
}

// ─── FILE SAVE ─────────────────────────────────────────────────────────
export async function saveFileToDisk(file: File): Promise<{
    fileName: string;
    filePath: string;
    publicUrl: string;
}> {
    // Directory check
    if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Unique filename generate karo
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .substring(0, 30);

    const fileName = `blog-${cleanName}-${timestamp}-${random}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    const publicUrl = `${PUBLIC_URL_BASE}/${fileName}`;

    // File disk pe likho
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return { fileName, filePath, publicUrl };
}

// ─── DB SAVE ───────────────────────────────────────────────────────────
export async function saveUploadRecord(
    uploadData: Omit<BlogUpload, 'id' | 'created_at'>
): Promise<BlogUpload> {
    const knex = await db();

    const [id] = await knex('blog_uploads').insert({
        ...uploadData,
        is_used: uploadData.is_used ? 1 : 0,
        created_at: new Date(),
    });

    const record = await knex('blog_uploads').where('id', id).first();
    return record;
}

// ─── MAIN UPLOAD FUNCTION ──────────────────────────────────────────────
export async function uploadBlogImage(
    options: UploadFileOptions
): Promise<{ upload: UploadResult; dbRecord: BlogUpload }> {
    const { file, uploadedBy, blogId } = options;

    // 1. Validate
    const validation = validateFile(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    // 2. Disk pe save karo
    const { fileName, publicUrl } = await saveFileToDisk(file);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.acasa.ae';
    const fullUrl = `${siteUrl}${publicUrl}`;

    const uploadResult: UploadResult = {
        filename: fileName,
        original_name: file.name,
        url: publicUrl,
        full_url: fullUrl,
        size: file.size,
        size_kb: Math.round(file.size / 1024),
        mime_type: file.type,
    };

    // 3. DB mein save karo
    const dbRecord = await saveUploadRecord({
        filename: fileName,
        original_name: file.name,
        url: publicUrl,
        full_url: fullUrl,
        size: file.size,
        size_kb: Math.round(file.size / 1024),
        mime_type: file.type,
        blog_id: blogId ?? null,
        uploaded_by: uploadedBy ?? null,
        is_used: !!blogId, // blogId diya toh used hai
    });

    return { upload: uploadResult, dbRecord };
}

// ─── EXTRA HELPERS ─────────────────────────────────────────────────────

// Sab uploads fetch karo
export async function getAllUploads(limit = 50): Promise<BlogUpload[]> {
    const knex = await db();
    return knex('blog_uploads')
        .orderBy('created_at', 'desc')
        .limit(limit);
}

// Blog ke uploads fetch karo
export async function getUploadsByBlogId(blogId: number): Promise<BlogUpload[]> {
    const knex = await db();
    return knex('blog_uploads').where('blog_id', blogId);
}

// Unused images (cleanup ke liye)
export async function getUnusedUploads(
    olderThanHours = 24
): Promise<BlogUpload[]> {
    const knex = await db();
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    return knex('blog_uploads')
        .where('is_used', 0)
        .where('created_at', '<', cutoff);
}

// Blog se image link karo
export async function linkUploadToBlog(
    filename: string,
    blogId: number
): Promise<void> {
    const knex = await db();
    await knex('blog_uploads')
        .where('filename', filename)
        .update({ blog_id: blogId, is_used: 1 });
}

// File delete karo (disk + DB)
export async function deleteUpload(filename: string): Promise<void> {
    const knex = await db();
    const filePath = path.join(UPLOAD_DIR, filename);

    if (existsSync(filePath)) {
        await unlink(filePath);
    }

    await knex('blog_uploads').where('filename', filename).delete();
}